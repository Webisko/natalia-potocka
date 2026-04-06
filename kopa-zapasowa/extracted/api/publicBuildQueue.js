import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const isWindows = process.platform === 'win32';
const publicSiteDir = path.join(projectRoot, 'dist');
const tempBuildDir = path.join(projectRoot, 'dist-build');

const buildState = {
  running: false,
  queued: false,
  lastStartedAt: null,
  lastFinishedAt: null,
  lastExitCode: null,
  lastError: null,
  lastReason: null,
};

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function mirrorDirectory(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });

  const [sourceEntries, targetEntries] = await Promise.all([
    fs.readdir(sourceDir, { withFileTypes: true }),
    fs.readdir(targetDir, { withFileTypes: true }),
  ]);

  const sourceNames = new Set(sourceEntries.map((entry) => entry.name));

  await Promise.all(
    sourceEntries.map(async (entry) => {
      const sourcePath = path.join(sourceDir, entry.name);
      const targetPath = path.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        await mirrorDirectory(sourcePath, targetPath);
        return;
      }

      if (entry.isSymbolicLink()) {
        const linkedPath = await fs.readlink(sourcePath);

        if (await pathExists(targetPath)) {
          await fs.rm(targetPath, { recursive: true, force: true });
        }

        await fs.symlink(linkedPath, targetPath);
        return;
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath);
    })
  );

  await Promise.all(
    targetEntries
      .filter((entry) => !sourceNames.has(entry.name))
      .map((entry) => fs.rm(path.join(targetDir, entry.name), { recursive: true, force: true }))
  );
}

async function publishBuildOutput() {
  await mirrorDirectory(tempBuildDir, publicSiteDir);
  await fs.rm(tempBuildDir, { recursive: true, force: true });
}

function runBuild(reason) {
  buildState.running = true;
  buildState.queued = false;
  buildState.lastStartedAt = new Date().toISOString();
  buildState.lastReason = reason;
  buildState.lastError = null;

  const buildCommand = isWindows ? 'cmd.exe' : 'sh';
  const buildArgs = isWindows
    ? ['/d', '/s', '/c', 'npm run optimize:images && npm exec astro build -- --outDir dist-build']
    : ['-lc', 'npm run optimize:images && npm exec astro build -- --outDir dist-build'];

  const child = spawn(buildCommand, buildArgs, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'pipe',
    windowsHide: true,
  });

  let stderr = '';

  child.stdout?.on('data', () => {
    // Drain stdout so long builds cannot block on a full buffer.
  });

  child.stderr?.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', (error) => {
    buildState.running = false;
    buildState.lastFinishedAt = new Date().toISOString();
    buildState.lastExitCode = 1;
    buildState.lastError = error.message;
    console.error('[public-build] failed to start build:', error);

    if (buildState.queued) {
      runBuild('queued retry after startup failure');
    }
  });

  child.on('close', async (code) => {
    buildState.running = false;
    buildState.lastExitCode = code;

    if (code === 0) {
      try {
        await publishBuildOutput();
        buildState.lastFinishedAt = new Date().toISOString();
        buildState.lastError = null;
        console.log(`[public-build] build completed (${reason})`);
      } catch (error) {
        buildState.lastFinishedAt = new Date().toISOString();
        buildState.lastExitCode = 1;
        buildState.lastError = error.message;
        console.error(`[public-build] publish failed (${reason})`, error);
      }
    } else {
      buildState.lastFinishedAt = new Date().toISOString();
      buildState.lastError = stderr.trim() || `Build exited with code ${code}`;
      console.error(`[public-build] build failed (${reason})`, buildState.lastError);
    }

    if (buildState.queued) {
      runBuild('queued rebuild after content change');
    }
  });
}

export function enqueuePublicBuild(reason = 'content change') {
  if (buildState.running) {
    buildState.queued = true;
    return {
      status: 'queued',
      message: 'Zmiany zostały zapisane. Publikacja czeka na zakończenie trwającej przebudowy.',
    };
  }

  runBuild(reason);

  return {
    status: 'started',
    message: 'Zmiany zostały zapisane. Strona publiczna przebudowuje się automatycznie w tle.',
  };
}

export function getPublicBuildState() {
  return { ...buildState };
}