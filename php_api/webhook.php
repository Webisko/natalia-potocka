<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

function logWebhook(string $message): void {
    file_put_contents(__DIR__ . '/../data/webhook.log', date('Y-m-d H:i:s') . " [Stripe Webhook] $message\n", FILE_APPEND);
}

function readSetting(string $key): string {
    global $db;
    $stmt = $db->prepare('SELECT value FROM settings WHERE key = ?');
    $stmt->execute([$key]);
    return trim((string) ($stmt->fetchColumn() ?: ''));
}

function normalizePurchasedItems(?string $value): array {
    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    return array_values(array_filter(array_map('trim', explode(',', $value))));
}

function webhook_customer_email(array $session): string {
    $customerDetailsEmail = strtolower(trim((string) ($session['customer_details']['email'] ?? '')));
    if ($customerDetailsEmail !== '') {
        return $customerDetailsEmail;
    }

    return strtolower(trim((string) ($session['customer_email'] ?? '')));
}

function webhook_urls_from_user(?array $user): array {
    if (!$user) {
        return ['confirmUrl' => null, 'resetUrl' => null];
    }

    $baseUrl = mailer_detect_base_url();
    $confirmUrl = !empty($user['email_confirmed']) || empty($user['confirm_token'])
        ? null
        : $baseUrl . '/api/auth/confirm/' . $user['confirm_token'];
    $resetUrl = empty($user['reset_token']) ? null : $baseUrl . '/resetowanie-hasla?token=' . $user['reset_token'];

    return [
        'confirmUrl' => $confirmUrl,
        'resetUrl' => $resetUrl,
    ];
}

function fulfillCheckoutSession(PDO $db, array $session, string $eventType): void {
    logWebhook("Received $eventType for session: " . ($session['id'] ?? 'unknown'));

    $customerEmail = webhook_customer_email($session);
    $productId = $session['client_reference_id'] ?? ($session['metadata']['productId'] ?? null);
    $couponCode = strtoupper(trim((string) ($session['metadata']['couponCode'] ?? '')));

    if ($customerEmail === '' || !$productId) {
        throw new RuntimeException('Missing customer email or product ID in session');
    }

    $stmtProduct = $db->prepare('SELECT id FROM products WHERE id = ?');
    $stmtProduct->execute([$productId]);
    if (!$stmtProduct->fetch()) {
        throw new RuntimeException("Product with ID $productId not found in database");
    }

    $stmtConsent = $db->prepare('SELECT user_id FROM purchase_consents WHERE stripe_session_id = ?');
    $stmtConsent->execute([$session['id']]);
    $consent = $stmtConsent->fetch() ?: null;

    $stmtUser = $db->prepare('SELECT id, first_name, last_name, email, password_hash, email_confirmed, confirm_token, reset_token, purchased_items FROM users WHERE email = ?');
    $stmtUser->execute([$customerEmail]);
    $user = $stmtUser->fetch();

    if ($user) {
        $purchases = normalizePurchasedItems($user['purchased_items'] ?? null);
        if (!in_array($productId, $purchases, true)) {
            $purchases[] = $productId;
            $stmtUpdateUser = $db->prepare('UPDATE users SET purchased_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmtUpdateUser->execute([implode(',', $purchases), $user['id']]);
        }

        if ($consent && empty($consent['user_id'])) {
            $stmtLinkConsent = $db->prepare('UPDATE purchase_consents SET user_id = ? WHERE stripe_session_id = ?');
            $stmtLinkConsent->execute([$user['id'], $session['id']]);
        }
    } else {
        $newUserId = bin2hex(random_bytes(16));
        $confirmToken = bin2hex(random_bytes(32));
        $stmtCreateUser = $db->prepare('INSERT INTO users (id, first_name, last_name, email, password_hash, purchased_items, email_confirmed, confirm_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmtCreateUser->execute([$newUserId, null, null, $customerEmail, null, $productId, $confirmToken]);

        $stmtLinkConsent = $db->prepare('UPDATE purchase_consents SET user_id = ? WHERE stripe_session_id = ?');
        $stmtLinkConsent->execute([$newUserId, $session['id']]);

        $user = [
            'id' => $newUserId,
            'first_name' => null,
            'last_name' => null,
            'email' => $customerEmail,
            'password_hash' => null,
            'email_confirmed' => 0,
            'confirm_token' => $confirmToken,
            'reset_token' => null,
            'purchased_items' => $productId,
        ];
    }

    $orderId = 'stripe_' . preg_replace('/[^a-zA-Z0-9_]/', '_', (string) $session['id']);
    $stmtExistingOrder = $db->prepare('SELECT id FROM orders WHERE id = ?');
    $stmtExistingOrder->execute([$orderId]);
    if ($stmtExistingOrder->fetch()) {
        logWebhook("Order $orderId already recorded. Skipping duplicate fulfillment.");
        return;
    }

    $amountTotal = ((float) ($session['amount_total'] ?? 0)) / 100;
    $orderNumber = generateOrderNumber($session['created'] ?? null);
    $stmtOrder = $db->prepare('INSERT INTO orders (id, order_number, customer_email, customer_first_name, customer_last_name, product_id, product_title, product_slug, amount_total, applied_coupon_code, payment_method, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');

    if ($couponCode !== '') {
        $stmtCoupon = $db->prepare('UPDATE coupons SET times_used = times_used + 1, updated_at = CURRENT_TIMESTAMP WHERE code = ?');
        $stmtCoupon->execute([$couponCode]);
    }

    $stmtProductInfo = $db->prepare('SELECT title, slug FROM products WHERE id = ?');
    $stmtProductInfo->execute([$productId]);
    $product = $stmtProductInfo->fetch() ?: ['title' => $productId, 'slug' => null];
    $stmtOrder->execute([$orderId, $orderNumber, $customerEmail, $user['first_name'] ?? null, $user['last_name'] ?? null, $productId, $product['title'] ?? $productId, $product['slug'] ?? null, $amountTotal, $couponCode !== '' ? $couponCode : null, 'stripe', 'completed']);

    $urls = webhook_urls_from_user($user ?: null);
    $mailPayload = [
        'orderId' => $orderId,
        'orderNumber' => $orderNumber,
        'productTitle' => (string) ($product['title'] ?? $productId),
        'amountTotal' => $amountTotal,
        'customerEmail' => $customerEmail,
        'couponCode' => $couponCode !== '' ? $couponCode : null,
        'libraryUrl' => mailer_detect_base_url() . '/panel',
        'confirmUrl' => $urls['confirmUrl'],
        'resetUrl' => $urls['resetUrl'],
        'adminUrl' => mailer_detect_base_url() . '/administrator/',
    ];

    mailer_send_order_success_customer($mailPayload);
    mailer_send_order_success_admin($mailPayload);

    logEvent('stripe_order_completed', 'Płatność Stripe została zaksięgowana i zamówienie zapisane.', [
        'user_id' => $user['id'] ?? null,
        'order_id' => $orderId,
        'customer_email' => $customerEmail,
        'order_number' => $orderNumber,
        'product_id' => $productId,
        'product_title' => $product['title'] ?? $productId,
        'stripe_session_id' => $session['id'] ?? null,
        'amount_total' => $amountTotal,
    ]);

    logWebhook("Recorded order $orderId for $amountTotal PLN");
}

$payload = file_get_contents('php://input');
$signatureHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpointSecret = readSetting('stripe_webhook_secret');
if ($endpointSecret === '') {
    $endpointSecret = trim((string) getenv('STRIPE_WEBHOOK_SECRET'));
}

if ($endpointSecret === '') {
    logWebhook('Error: STRIPE_WEBHOOK_SECRET not set in DB or ENV.');
    http_response_code(500);
    exit();
}

$signatureParts = explode(',', $signatureHeader);
$timestamp = '';
$v1 = '';
foreach ($signatureParts as $part) {
    $pair = explode('=', trim($part), 2);
    if (count($pair) !== 2) {
        continue;
    }
    if ($pair[0] === 't') {
        $timestamp = $pair[1];
    }
    if ($pair[0] === 'v1') {
        $v1 = $pair[1];
    }
}

if ($timestamp === '' || $v1 === '') {
    logWebhook('Error: Invalid Stripe signature header format.');
    http_response_code(400);
    exit();
}

$expectedSignature = hash_hmac('sha256', $timestamp . '.' . $payload, $endpointSecret);
if (!hash_equals($expectedSignature, $v1)) {
    logWebhook('Error: Signature verification failed.');
    http_response_code(400);
    exit();
}

$event = json_decode($payload, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($event)) {
    logWebhook('Error: Invalid JSON payload.');
    http_response_code(400);
    exit();
}

try {
    $eventType = $event['type'] ?? null;
    if (in_array($eventType, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
        $session = $event['data']['object'] ?? [];
        $paymentStatus = $session['payment_status'] ?? null;

        if ($eventType === 'checkout.session.completed' && $paymentStatus !== 'paid') {
            logWebhook("Checkout session {$session['id']} completed but payment_status is '$paymentStatus'. Waiting for async success event.");
        } else {
            fulfillCheckoutSession($db, $session, $eventType);
        }
    } elseif ($eventType === 'checkout.session.async_payment_failed') {
        $session = $event['data']['object'] ?? [];
        $customerEmail = webhook_customer_email($session);
        $productId = $session['client_reference_id'] ?? ($session['metadata']['productId'] ?? null);
        $amountTotal = ((float) ($session['amount_total'] ?? 0)) / 100;
        $productTitle = 'zamówienie';
        $retryUrl = null;

        if ($productId) {
            $stmtProductInfo = $db->prepare('SELECT title, slug FROM products WHERE id = ?');
            $stmtProductInfo->execute([$productId]);
            $product = $stmtProductInfo->fetch();
            if ($product) {
                $productTitle = (string) ($product['title'] ?? $productTitle);
                if (!empty($product['slug'])) {
                    $retryUrl = mailer_detect_base_url() . '/oferta/' . $product['slug'];
                }
            }
        }

        if ($customerEmail !== '') {
            $mailPayload = [
                'sessionId' => (string) ($session['id'] ?? ''),
                'productTitle' => $productTitle,
                'amountTotal' => $amountTotal,
                'customerEmail' => $customerEmail,
                'retryUrl' => $retryUrl,
                'adminUrl' => mailer_detect_base_url() . '/administrator/',
            ];
            mailer_send_order_failed_customer($mailPayload);
            mailer_send_order_failed_admin($mailPayload);
        }

        logEvent('stripe_payment_failed', 'Płatność Stripe zakończyła się niepowodzeniem.', [
            'customer_email' => $customerEmail,
            'product_id' => $productId,
            'product_title' => $productTitle,
            'stripe_session_id' => $session['id'] ?? null,
            'amount_total' => $amountTotal,
        ]);

        logWebhook('Async payment failed for session ' . ($session['id'] ?? 'unknown') . '.');
    }

    http_response_code(200);
    echo json_encode(['received' => true]);
} catch (Throwable $e) {
    logWebhook('Database error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Webhook processing failed']);
}