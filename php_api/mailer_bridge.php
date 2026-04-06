<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

function bridge_json_response(array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function bridge_apply_base_url(?string $baseUrl): void {
    $value = trim((string) $baseUrl);
    if ($value === '') {
        return;
    }

    $parts = parse_url($value);
    if (!is_array($parts) || empty($parts['host'])) {
        return;
    }

    $scheme = strtolower((string) ($parts['scheme'] ?? 'http'));
    $host = (string) $parts['host'];
    $port = (int) ($parts['port'] ?? ($scheme === 'https' ? 443 : 80));

    $_SERVER['HTTP_HOST'] = ($port === 80 || $port === 443) ? $host : ($host . ':' . $port);
    $_SERVER['HTTPS'] = $scheme === 'https' ? 'on' : 'off';
    $_SERVER['SERVER_PORT'] = (string) $port;
}

$rawInput = file_get_contents('php://stdin');
if ($rawInput === false || trim($rawInput) === '') {
    bridge_json_response(['ok' => false, 'error' => 'Missing input payload.'], 400);
}

$payload = json_decode($rawInput, true);
if (!is_array($payload)) {
    bridge_json_response(['ok' => false, 'error' => 'Invalid JSON payload.'], 400);
}

bridge_apply_base_url($payload['baseUrl'] ?? null);

$action = (string) ($payload['action'] ?? '');
$data = is_array($payload['payload'] ?? null) ? $payload['payload'] : [];

try {
    switch ($action) {
        case 'account_confirmation':
            $sent = mailer_send_account_confirmation(
                (string) ($data['email'] ?? ''),
                (string) ($data['confirmUrl'] ?? ''),
                is_array($data['context'] ?? null) ? $data['context'] : []
            );
            break;

        case 'password_reset':
            $sent = mailer_send_password_reset(
                (string) ($data['email'] ?? ''),
                (string) ($data['resetUrl'] ?? ''),
                is_array($data['context'] ?? null) ? $data['context'] : []
            );
            break;

        case 'email_change_confirmation':
            $sent = mailer_send_email_change_confirmation(
                (string) ($data['email'] ?? ''),
                (string) ($data['confirmUrl'] ?? ''),
                is_array($data['context'] ?? null) ? $data['context'] : []
            );
            break;

        case 'order_success_customer':
            $sent = mailer_send_order_success_customer($data);
            break;

        case 'order_success_admin':
            $sent = mailer_send_order_success_admin($data);
            break;

        case 'order_failed_customer':
            $sent = mailer_send_order_failed_customer($data);
            break;

        case 'order_failed_admin':
            $sent = mailer_send_order_failed_admin($data);
            break;

        case 'bank_transfer_customer':
            $sent = mailer_send_bank_transfer_customer($data);
            break;

        case 'bank_transfer_admin':
            $sent = mailer_send_bank_transfer_admin($data);
            break;

        default:
            bridge_json_response(['ok' => false, 'error' => 'Unsupported mailer action.'], 400);
    }

    bridge_json_response(['ok' => true, 'sent' => (bool) $sent]);
} catch (Throwable $error) {
    bridge_json_response(['ok' => false, 'error' => $error->getMessage()], 500);
}