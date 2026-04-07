<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';
require_once __DIR__ . '/mailer.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

function readSetting(string $key): string {
    global $db;
    $stmt = $db->prepare('SELECT value FROM settings WHERE key = ?');
    $stmt->execute([$key]);
    return trim((string) ($stmt->fetchColumn() ?: ''));
}

function normalizeCouponRow(array $coupon): array {
    $coupon['code'] = strtoupper(trim((string) ($coupon['code'] ?? '')));
    $coupon['discount_type'] = strtolower(trim((string) ($coupon['discount_type'] ?? '')));
    $coupon['value'] = (float) ($coupon['value'] ?? 0);
    $coupon['is_active'] = !empty($coupon['is_active']);
    $coupon['exclude_sale_items'] = !empty($coupon['exclude_sale_items']);
    $coupon['usage_limit'] = $coupon['usage_limit'] === null ? null : (int) $coupon['usage_limit'];
    $coupon['usage_limit_per_user'] = $coupon['usage_limit_per_user'] === null ? null : (int) $coupon['usage_limit_per_user'];
    $coupon['times_used'] = (int) ($coupon['times_used'] ?? 0);
    $coupon['minimum_spend'] = $coupon['minimum_spend'] === null ? null : (float) $coupon['minimum_spend'];
    $coupon['maximum_spend'] = $coupon['maximum_spend'] === null ? null : (float) $coupon['maximum_spend'];
    $coupon['included_product_ids'] = normalizeDelimitedText($coupon['included_product_ids'] ?? null);
    $coupon['excluded_product_ids'] = normalizeDelimitedText($coupon['excluded_product_ids'] ?? null);
    $coupon['allowed_emails'] = normalizeDelimitedText($coupon['allowed_emails'] ?? null, true);
    return $coupon;
}

function matchesCouponEmailPattern(string $email, string $pattern): bool {
    $normalizedEmail = strtolower(trim($email));
    $normalizedPattern = strtolower(trim($pattern));
    if ($normalizedEmail === '' || $normalizedPattern === '') {
        return false;
    }

    if (strpos($normalizedPattern, '*') === false) {
        return $normalizedEmail === $normalizedPattern;
    }

    $quoted = str_replace('\\*', '.*', preg_quote($normalizedPattern, '/'));
    return (bool) preg_match('/^' . $quoted . '$/i', $normalizedEmail);
}

function findValidCoupon(?string $rawCode, array $context = []): ?array {
    global $db;
    $couponCode = strtoupper(trim((string) $rawCode));
    if ($couponCode === '') {
        return null;
    }

    $stmt = $db->prepare('SELECT * FROM coupons WHERE code = ?');
    $stmt->execute([$couponCode]);
    $row = $stmt->fetch();
    if (!$row) {
        throw new RuntimeException('Podany kod rabatowy nie istnieje.');
    }

    $coupon = normalizeCouponRow($row);
    $now = time();

    if (!$coupon['is_active']) {
        throw new RuntimeException('Ten kod rabatowy nie jest już aktywny.');
    }
    if (!empty($coupon['valid_from']) && strtotime((string) $coupon['valid_from']) > $now) {
        throw new RuntimeException('Ten kod rabatowy nie jest jeszcze aktywny.');
    }
    if (!empty($coupon['valid_until']) && strtotime((string) $coupon['valid_until']) < $now) {
        throw new RuntimeException('Ten kod rabatowy stracił już ważność.');
    }
    if ($coupon['usage_limit'] !== null && $coupon['times_used'] >= $coupon['usage_limit']) {
        throw new RuntimeException('Ten kod rabatowy osiągnął już limit użyć.');
    }

    if ($coupon['minimum_spend'] !== null && (float) ($context['orderAmount'] ?? 0) < $coupon['minimum_spend']) {
        throw new RuntimeException('Ten kod rabatowy działa od określonej kwoty zamówienia.');
    }
    if ($coupon['maximum_spend'] !== null && (float) ($context['orderAmount'] ?? 0) > $coupon['maximum_spend']) {
        throw new RuntimeException('Ten kod rabatowy działa tylko do określonej kwoty zamówienia.');
    }
    if (!empty($coupon['exclude_sale_items']) && !empty($context['hasPromotionalPrice'])) {
        throw new RuntimeException('Ten kod rabatowy nie działa na produkty objęte promocją.');
    }
    if (!empty($coupon['included_product_ids']) && !in_array((string) ($context['productId'] ?? ''), $coupon['included_product_ids'], true)) {
        throw new RuntimeException('Ten kod rabatowy nie dotyczy wybranego produktu.');
    }
    if (in_array((string) ($context['productId'] ?? ''), $coupon['excluded_product_ids'], true)) {
        throw new RuntimeException('Ten kod rabatowy nie może zostać użyty z tym produktem.');
    }
    if (!empty($coupon['allowed_emails'])) {
        $customerEmail = strtolower(trim((string) ($context['customerEmail'] ?? '')));
        $matched = false;
        foreach ($coupon['allowed_emails'] as $pattern) {
            if (matchesCouponEmailPattern($customerEmail, $pattern)) {
                $matched = true;
                break;
            }
        }
        if (!$matched) {
            throw new RuntimeException('Ten kod rabatowy nie jest dostępny dla tego adresu e-mail.');
        }
    }
    if ($coupon['usage_limit_per_user'] !== null && !empty($context['customerEmail'])) {
        $stmtUsage = $db->prepare("SELECT COUNT(*) FROM orders WHERE lower(customer_email) = lower(?) AND upper(COALESCE(applied_coupon_code, '')) = ?");
        $stmtUsage->execute([(string) $context['customerEmail'], $coupon['code']]);
        $usageCount = (int) $stmtUsage->fetchColumn();
        if ($usageCount >= $coupon['usage_limit_per_user']) {
            throw new RuntimeException('Ten kod rabatowy osiągnął już limit użyć dla tego adresu e-mail.');
        }
    }

    return $coupon;
}

function applyCouponDiscount(float $amount, ?array $coupon): float {
    if (!$coupon) {
        return $amount;
    }

    $discounted = $amount;
    if (($coupon['discount_type'] ?? '') === 'percent') {
        $discounted = $amount * (1 - ((float) $coupon['value'] / 100));
    } else {
        $discounted = $amount - (float) $coupon['value'];
    }

    return max(0, round($discounted, 2));
}

function serializeAppliedCoupon(?array $coupon, float $originalAmount, float $discountedAmount): ?array {
    if (!$coupon) {
        return null;
    }

    return [
        'code' => $coupon['code'],
        'discountType' => $coupon['discount_type'],
        'value' => $coupon['value'],
        'originalAmount' => $originalAmount,
        'discountedAmount' => $discountedAmount,
    ];
}

function incrementCouponUsage(?array $coupon): void {
    global $db;
    if (!$coupon) {
        return;
    }

    $stmt = $db->prepare('UPDATE coupons SET times_used = times_used + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $stmt->execute([$coupon['id']]);
}

function detectBaseUrl(): string {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    return ($isHttps ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function validateStrongPassword(string $password): ?string {
    if (strlen($password) < 12) {
        return 'Hasło musi mieć co najmniej 12 znaków.';
    }

    if (!preg_match('/[a-z]/', $password) || !preg_match('/[A-Z]/', $password) || !preg_match('/\d/', $password) || !preg_match('/[^A-Za-z\d]/', $password)) {
        return 'Hasło musi zawierać małą literę, wielką literę, cyfrę oraz znak specjalny.';
    }

    return null;
}

function resolveAuthenticatedCheckoutUser(array $authUser): array {
    global $db;

    $authEmail = strtolower(trim((string) ($authUser['email'] ?? '')));
    if ($authEmail === '') {
        throw new RuntimeException('Sesja użytkownika jest nieprawidłowa. Zaloguj się ponownie, aby dokończyć zakup.');
    }

    $user = null;
    $authUserId = trim((string) ($authUser['id'] ?? ''));
    if ($authUserId !== '') {
        $stmt = $db->prepare('SELECT id, email FROM users WHERE id = ? LIMIT 1');
        $stmt->execute([$authUserId]);
        $user = $stmt->fetch();
    }

    if (!$user) {
        $stmt = $db->prepare('SELECT id, email FROM users WHERE lower(email) = lower(?) LIMIT 1');
        $stmt->execute([$authEmail]);
        $user = $stmt->fetch();
    }

    if (!$user) {
        throw new RuntimeException('Nie znaleziono konta powiązanego z aktywną sesją. Zaloguj się ponownie i spróbuj jeszcze raz.');
    }

    return [
        'id' => $user['id'],
        'email' => strtolower(trim((string) $user['email'])),
    ];
}

function resolveOptionalAuthUser(): ?array {
    $token = $_COOKIE['auth_token'] ?? null;

    if (!$token) {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
        if (empty($headers)) {
            foreach ($_SERVER as $name => $value) {
                if (substr($name, 0, 5) === 'HTTP_') {
                    $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                }
            }
        }

        if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            $token = $matches[1];
        }
    }

    if (!$token) {
        return null;
    }

    $user = decode_jwt($token, getJwtSecret());
    return is_array($user) ? $user : null;
}

function prepareGuestCheckoutUser(array $customer, string $baseUrl): array {
    global $db;

    $firstName = trim((string) ($customer['firstName'] ?? $customer['first_name'] ?? ''));
    $lastName = trim((string) ($customer['lastName'] ?? $customer['last_name'] ?? ''));
    $email = strtolower(trim((string) ($customer['email'] ?? '')));
    $setPasswordNow = !empty($customer['setPasswordNow']);
    $password = (string) ($customer['password'] ?? '');
    $passwordConfirm = (string) ($customer['passwordConfirm'] ?? $customer['password_confirm'] ?? '');

    if ($firstName === '' || $lastName === '' || $email === '') {
        throw new RuntimeException('Podaj imię, nazwisko i adres e-mail, aby przejść do płatności.');
    }

    $passwordHash = null;
    if ($setPasswordNow) {
        if ($password !== $passwordConfirm) {
            throw new RuntimeException('Hasła nie są identyczne.');
        }

        $passwordValidationError = validateStrongPassword($password);
        if ($passwordValidationError !== null) {
            throw new RuntimeException($passwordValidationError);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    $stmtExisting = $db->prepare('SELECT id, email, password_hash, email_confirmed, confirm_token FROM users WHERE lower(email) = lower(?) LIMIT 1');
    $stmtExisting->execute([$email]);
    $existingUser = $stmtExisting->fetch() ?: null;

    $confirmToken = $existingUser['confirm_token'] ?? bin2hex(random_bytes(32));
    $shouldCreateResetLink = !$setPasswordNow && empty($existingUser['password_hash']);
    $resetToken = $shouldCreateResetLink ? bin2hex(random_bytes(32)) : null;
    $resetExpires = $shouldCreateResetLink ? gmdate('c', strtotime('+1 hour')) : null;
    $confirmUrl = $baseUrl . '/api/auth/confirm/' . $confirmToken;
    $resetUrl = $resetToken ? ($baseUrl . '/resetowanie-hasla?token=' . $resetToken) : null;

    if ($existingUser) {
        if (!empty($existingUser['password_hash']) && !empty($existingUser['email_confirmed'])) {
            $error = new RuntimeException('Konto z tym adresem e-mail już istnieje. Zaloguj się, aby dokończyć zakup.');
            throw $error;
        }

        $stmtUpdate = $db->prepare('UPDATE users SET first_name = ?, last_name = ?, password_hash = COALESCE(?, password_hash), confirm_token = COALESCE(confirm_token, ?), reset_token = COALESCE(?, reset_token), reset_expires = COALESCE(?, reset_expires), updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([$firstName, $lastName, $passwordHash, $confirmToken, $resetToken, $resetExpires, $existingUser['id']]);

        return [
            'id' => $existingUser['id'],
            'email' => $email,
            'requiresEmailConfirmation' => empty($existingUser['email_confirmed']),
            'hasPassword' => !empty($passwordHash) || !empty($existingUser['password_hash']),
            'confirmUrl' => $confirmUrl,
            'resetUrl' => $resetUrl,
        ];
    }

    $userId = bin2hex(random_bytes(16));
    $stmtInsert = $db->prepare('INSERT INTO users (id, first_name, last_name, email, password_hash, purchased_items, email_confirmed, confirm_token, reset_token, reset_expires, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
    $stmtInsert->execute([$userId, $firstName, $lastName, $email, $passwordHash, '', $confirmToken, $resetToken, $resetExpires]);

    return [
        'id' => $userId,
        'email' => $email,
        'requiresEmailConfirmation' => true,
        'hasPassword' => !empty($passwordHash),
        'confirmUrl' => $confirmUrl,
        'resetUrl' => $resetUrl,
    ];
}

function resolveCheckoutIdentity(array $customer, string $baseUrl): array {
    $authUser = resolveOptionalAuthUser();
    if ($authUser) {
        return array_merge(resolveAuthenticatedCheckoutUser($authUser), [
            'requiresEmailConfirmation' => false,
            'hasPassword' => true,
            'isAuthenticated' => true,
            'confirmUrl' => null,
            'resetUrl' => null,
        ]);
    }

    return prepareGuestCheckoutUser($customer, $baseUrl);
}

if ($method === 'POST' && $action === 'create-session') {
    try {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $productId = $data['productId'] ?? null;
        $paymentMethod = $data['paymentMethod'] ?? 'stripe';
        $couponCode = $data['couponCode'] ?? null;
        $customer = is_array($data['customer'] ?? null) ? $data['customer'] : [];
        $termsAccepted = !empty($data['termsAccepted']);
        $digitalContentAccepted = !empty($data['digitalContentAccepted']);

        if (!$productId) {
            sendJson(['error' => 'Brak ID produktu.'], 400);
        }
        if (!$termsAccepted || !$digitalContentAccepted) {
            sendJson(['error' => 'Aby kontynuować, zaakceptuj wymagane zgody.'], 400);
        }

        $stmt = $db->prepare('SELECT * FROM products WHERE id = ?');
        $stmt->execute([$productId]);
        $product = $stmt->fetch();
        if (!$product) {
            sendJson(['error' => 'Produkt nie istnieje.'], 404);
        }

        $checkoutIdentity = resolveCheckoutIdentity($customer, detectBaseUrl());
        $customerEmail = $checkoutIdentity['email'];

        if (!$customerEmail) {
            sendJson(['error' => 'Brak adresu e-mail do zamówienia.'], 400);
        }

        $hasPromo = !empty($product['promotional_price']) && (empty($product['promotional_price_until']) || strtotime((string) $product['promotional_price_until']) >= time());
        $effectivePrice = $hasPromo ? (float) $product['promotional_price'] : (float) $product['price'];
        $coupon = findValidCoupon($couponCode, [
            'productId' => $product['id'],
            'customerEmail' => $customerEmail,
            'orderAmount' => $effectivePrice,
            'hasPromotionalPrice' => $hasPromo,
        ]);
        $discountedPrice = applyCouponDiscount($effectivePrice, $coupon);
        $unitAmount = (int) round($discountedPrice * 100);
        if ($unitAmount <= 0) {
            sendJson(['error' => 'Produkt ma nieprawidłową cenę.'], 400);
        }

        $appliedCoupon = serializeAppliedCoupon($coupon, $effectivePrice, $discountedPrice);

        if ($paymentMethod === 'bank_transfer') {
            $accountName = readSetting('bank_account_name');
            $accountNumber = readSetting('bank_account_number');
            $bankName = readSetting('bank_name');
            $instructions = readSetting('bank_transfer_instructions');

            if ($accountName === '' || $accountNumber === '') {
                sendJson(['error' => 'Przelew tradycyjny nie jest jeszcze skonfigurowany. Uzupełnij dane rachunku w panelu administratora.'], 500);
            }

            $orderId = 'bank_' . bin2hex(random_bytes(8));
            $transferTitle = 'Zamówienie ' . $product['title'] . ' [' . strtoupper(substr($orderId, -6)) . ']';
            $acceptedAt = gmdate('c');

            $stmtOrder = $db->prepare('INSERT INTO orders (id, customer_email, product_id, amount_total, applied_coupon_code, status) VALUES (?, ?, ?, ?, ?, ?)');
            $stmtOrder->execute([$orderId, $customerEmail, $product['id'], $discountedPrice, $coupon['code'] ?? null, 'pending_bank_transfer']);

            $stmtConsent = $db->prepare('INSERT INTO purchase_consents (id, user_id, email, product_id, stripe_session_id, terms_accepted_at, digital_content_consent_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmtConsent->execute([
                bin2hex(random_bytes(16)),
                $checkoutIdentity['id'] ?? null,
                $customerEmail,
                $product['id'],
                'bank_transfer:' . $orderId,
                $acceptedAt,
                $acceptedAt,
            ]);

            incrementCouponUsage($coupon);

            $mailPayload = [
                'orderId' => $orderId,
                'productTitle' => (string) $product['title'],
                'amountTotal' => $discountedPrice,
                'customerEmail' => $customerEmail,
                'bankAccountName' => $accountName,
                'bankAccountNumber' => $accountNumber,
                'bankName' => $bankName,
                'bankTransferTitle' => $transferTitle,
                'bankInstructions' => $instructions,
                'confirmUrl' => $checkoutIdentity['confirmUrl'] ?? null,
                'resetUrl' => $checkoutIdentity['resetUrl'] ?? null,
                'adminUrl' => detectBaseUrl() . '/administrator/',
            ];
            mailer_send_bank_transfer_customer($mailPayload);
            mailer_send_bank_transfer_admin($mailPayload);

            sendJson([
                'message' => 'Instrukcje przelewu zostały przygotowane.',
                'bankTransfer' => [
                    'amount' => $discountedPrice,
                    'accountName' => $accountName,
                    'accountNumber' => $accountNumber,
                    'bankName' => $bankName,
                    'transferTitle' => $transferTitle,
                    'instructions' => $instructions,
                ],
                'appliedCoupon' => $appliedCoupon,
                'checkoutIdentity' => [
                    'requiresEmailConfirmation' => !empty($checkoutIdentity['requiresEmailConfirmation']),
                    'hasPassword' => !empty($checkoutIdentity['hasPassword']),
                ],
            ]);
        }

        $stripeSecret = readSetting('stripe_secret');
        if ($stripeSecret === '') {
            $stripeSecret = trim((string) getenv('STRIPE_SECRET_KEY'));
        }
        if ($stripeSecret === '') {
            sendJson(['error' => 'Konfiguracja serwera (Stripe) jest niekompletna.'], 500);
        }

        $baseUrl = detectBaseUrl();
        $successUrl = $baseUrl . '/dziekujemy?session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = $baseUrl . '/oferta/' . $product['slug'] . '?canceled=true';

        $postParams = [
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'customer_email' => $customerEmail,
            'client_reference_id' => $product['id'],
        ];
        $postParams['payment_method_types'][0] = 'card';
        $postParams['payment_method_types'][1] = 'blik';
        $postParams['payment_method_types'][2] = 'p24';
        $postParams['line_items'][0]['price_data']['currency'] = 'pln';
        $postParams['line_items'][0]['price_data']['product_data']['name'] = $product['title'];
        if (!empty($product['description'])) {
            $postParams['line_items'][0]['price_data']['product_data']['description'] = mb_substr((string) $product['description'], 0, 500);
        }
        $postParams['line_items'][0]['price_data']['unit_amount'] = $unitAmount;
        $postParams['line_items'][0]['quantity'] = 1;
        $postParams['metadata']['productId'] = $product['id'];
        $postParams['metadata']['userId'] = $checkoutIdentity['id'] ?? '';
        $postParams['metadata']['couponCode'] = $coupon['code'] ?? '';

        $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $stripeSecret . ':');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postParams));

        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($response === false) {
            sendJson(['error' => $curlError ?: 'Błąd podczas łączenia z płatnościami.'], 500);
        }

        $resData = json_decode($response, true);
        if ($httpCode >= 200 && $httpCode < 300 && isset($resData['url'], $resData['id'])) {
            $acceptedAt = gmdate('c');
            $stmtConsent = $db->prepare('INSERT INTO purchase_consents (id, user_id, email, product_id, stripe_session_id, terms_accepted_at, digital_content_consent_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmtConsent->execute([
                bin2hex(random_bytes(16)),
                $checkoutIdentity['id'] ?? null,
                $customerEmail,
                $product['id'],
                $resData['id'],
                $acceptedAt,
                $acceptedAt,
            ]);

            sendJson([
                'url' => $resData['url'],
                'appliedCoupon' => $appliedCoupon,
                'checkoutIdentity' => [
                    'requiresEmailConfirmation' => !empty($checkoutIdentity['requiresEmailConfirmation']),
                    'hasPassword' => !empty($checkoutIdentity['hasPassword']),
                ],
            ]);
        }

        sendJson(['error' => $resData['error']['message'] ?? 'Błąd podczas łączenia z płatnościami.'], 500);
    } catch (RuntimeException $e) {
        sendJson(['error' => $e->getMessage()], 400);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

sendJson(['error' => 'Unknown action'], 400);