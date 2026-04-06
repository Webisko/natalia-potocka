import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bridgeScriptPath = path.join(__dirname, '..', 'php_api', 'mailer_bridge.php');

function runBridge(action, payload, { baseUrl = '' } = {}) {
    const input = JSON.stringify({ action, payload, baseUrl });
    const result = spawnSync('php', [bridgeScriptPath], {
        input,
        encoding: 'utf8',
        timeout: 15000,
        windowsHide: true,
    });

    if (result.error) {
        console.warn(`[MailerBridge] Failed to execute PHP mailer for action '${action}': ${result.error.message}`);
        return { ok: false, sent: false, error: result.error.message };
    }

    if (result.status !== 0) {
        const stderr = `${result.stderr || ''}`.trim();
        console.warn(`[MailerBridge] PHP mailer exited with code ${result.status} for action '${action}'. ${stderr}`.trim());
        return { ok: false, sent: false, error: stderr || `Exit code ${result.status}` };
    }

    try {
        const parsed = JSON.parse(`${result.stdout || ''}`.trim() || '{}');
        return {
            ok: Boolean(parsed.ok),
            sent: Boolean(parsed.sent),
            error: parsed.error || null,
        };
    } catch (error) {
        console.warn(`[MailerBridge] Could not parse PHP mailer response for action '${action}': ${error.message}`);
        return { ok: false, sent: false, error: error.message };
    }
}

export function sendPhpMailer(action, payload, options = {}) {
    return runBridge(action, payload, options);
}

export function sendOrderSuccessEmails(orderPayload, options = {}) {
    const customerResult = runBridge('order_success_customer', orderPayload, options);
    const adminResult = runBridge('order_success_admin', orderPayload, options);
    return { customerResult, adminResult };
}

export function sendOrderFailureEmails(orderPayload, options = {}) {
    const customerResult = runBridge('order_failed_customer', orderPayload, options);
    const adminResult = runBridge('order_failed_admin', orderPayload, options);
    return { customerResult, adminResult };
}

export function sendBankTransferEmails(orderPayload, options = {}) {
    const customerResult = runBridge('bank_transfer_customer', orderPayload, options);
    const adminResult = runBridge('bank_transfer_admin', orderPayload, options);
    return { customerResult, adminResult };
}