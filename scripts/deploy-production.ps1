param(
    [switch]$SkipBuild,
    [switch]$SkipBackup,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sshHost = '45.84.205.195'
$sshPort = '65002'
$sshUser = 'u780371158'
$sshKey = Join-Path $projectRoot 'deployment_keys\id_rsa'
$remoteRoot = 'domains/nataliapotocka.pl/public_html'
$remoteStage = 'deploy_stage'
$archiveName = 'deploy_prod.tar.gz'
$archivePath = Join-Path $projectRoot $archiveName
$siteBaseUrl = 'https://nataliapotocka.pl'

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )

    Write-Host "==> $Label"
    & $Action
}

function Invoke-CheckedCommand {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList
    )

    $commandText = ($ArgumentList | ForEach-Object {
        if ($_ -match '\s') {
            '"' + $_ + '"'
        } else {
            $_
        }
    }) -join ' '

    Write-Host "$FilePath $commandText"

    if ($DryRun) {
        return
    }

    & $FilePath @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $commandText"
    }
}

function Invoke-HealthCheck {
    param(
        [string]$Label,
        [string]$Url,
        [int[]]$AllowedStatusCodes = @(200)
    )

    Write-Host "Checking $Label => $Url"

    if ($DryRun) {
        return
    }

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -MaximumRedirection 5 -TimeoutSec 30 -UseBasicParsing
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -and ($AllowedStatusCodes -contains [int]$statusCode)) {
            Write-Host "Accepted HTTP $statusCode for $Label"
            return
        }

        throw "Health check failed for ${Label}: $($_.Exception.Message)"
    }

    if ($AllowedStatusCodes -notcontains [int]$response.StatusCode) {
        throw "Health check failed for ${Label}: expected HTTP $($AllowedStatusCodes -join ', '), got $($response.StatusCode)"
    }
}

if (-not (Test-Path $sshKey)) {
    throw "SSH key not found: $sshKey"
}

Push-Location $projectRoot
try {
    if (-not $SkipBuild) {
        Invoke-Step -Label 'Building production bundle' -Action {
            Invoke-CheckedCommand -FilePath 'npm' -ArgumentList @('run', 'build')
        }

        Invoke-Step -Label 'Preparing deploy_prod package' -Action {
            Invoke-CheckedCommand -FilePath 'php' -ArgumentList @('create_deploy.php')
        }
    }

    Invoke-Step -Label 'Creating deploy archive' -Action {
        if (Test-Path $archivePath) {
            Remove-Item $archivePath -Force
        }

        Invoke-CheckedCommand -FilePath 'tar' -ArgumentList @('-czf', $archivePath, '-C', 'deploy_prod', '.')
    }

    if (-not $SkipBackup) {
        $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
        $backupCommand = "mkdir -p $remoteStage; tar -czf $remoteStage/nataliapotocka-backup-$timestamp.tar.gz -C $remoteRoot ."

        Invoke-Step -Label 'Creating remote backup' -Action {
            Invoke-CheckedCommand -FilePath 'ssh' -ArgumentList @('-i', $sshKey, '-p', $sshPort, "$sshUser@$sshHost", $backupCommand)
        }
    }

    Invoke-Step -Label 'Uploading deploy archive' -Action {
        Invoke-CheckedCommand -FilePath 'scp' -ArgumentList @('-i', $sshKey, '-P', $sshPort, $archivePath, "${sshUser}@${sshHost}:~/$remoteStage/$archiveName")
    }

    $deployCommand = @(
        'set -e',
        "cd $remoteRoot",
        'find . -mindepth 1 -maxdepth 1 ! -name data ! -name .well-known -exec rm -rf {} +',
        'mkdir -p data',
        'find data -mindepth 1 -maxdepth 1 ! -name database.sqlite ! -name webhook.log ! -name .htaccess -exec rm -rf {} +',
        "tar -xzf ~/$remoteStage/$archiveName -C .",
        'find . -type d -exec chmod 755 {} +',
        'find . -type f -exec chmod 644 {} +',
        '[ -f data/database.sqlite ] && chmod 600 data/database.sqlite || true',
        'ls -la | head -n 30',
        'echo ---DATA---',
        'ls -la data',
        'echo ---PERMISSIONS---',
        "for path in . ./api ./oferta ./data ./data/database.sqlite; do [ -e `"`$path`" ] && stat -c '`%a `%n' `"`$path`"; done"
    ) -join '; '

    Invoke-Step -Label 'Deploying archive on production' -Action {
        Invoke-CheckedCommand -FilePath 'ssh' -ArgumentList @('-i', $sshKey, '-p', $sshPort, "$sshUser@$sshHost", $deployCommand)
    }

    Invoke-Step -Label 'Running production smoke checks' -Action {
        Invoke-HealthCheck -Label 'Homepage' -Url "$siteBaseUrl/"
        Invoke-HealthCheck -Label 'Product route' -Url "$siteBaseUrl/oferta/otulic-polog/"
        Invoke-HealthCheck -Label 'Optional auth API' -Url "$siteBaseUrl/api/auth/me?optional=1"
    }

    Write-Host 'Production deploy finished.'
} finally {
    Pop-Location
}