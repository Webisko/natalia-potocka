<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';
require_once __DIR__ . '/mailer.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';
$secret = getJwtSecret();

function generateToken(array $user, string $secret): string {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'id' => $user['id'],
        'email' => $user['email'],
        'is_admin' => $user['is_admin'],
        'exp' => time() + (7 * 24 * 60 * 60),
    ]);

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
}

function parseStoredDateTime(?string $value): ?DateTimeImmutable {
    if (!$value) {
        return null;
    }

    if (preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $value)) {
        $value = str_replace(' ', 'T', $value) . 'Z';
    }

    try {
        return new DateTimeImmutable($value);
    } catch (Exception $e) {
        return null;
    }
}

function detectBaseUrl(): string {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    return ($isHttps ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function normalizeEmailAddress(?string $value): string {
    return strtolower(trim((string) $value));
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

function buildUserPayload(array $user): array {
    $purchases = !empty($user['purchased_items']) ? array_values(array_filter(array_map('trim', explode(',', (string) $user['purchased_items'])))) : [];

    return [
        'id' => $user['id'],
        'first_name' => $user['first_name'] ?? null,
        'last_name' => $user['last_name'] ?? null,
        'email' => $user['email'],
        'phone' => $user['phone'] ?? null,
        'is_admin' => (bool) ($user['is_admin'] ?? false),
        'email_confirmed' => !empty($user['email_confirmed']),
        'pending_email' => $user['pending_email'] ?? null,
        'purchased_items' => $purchases,
    ];
}

function setAuthCookie(array $user, string $secret): void {
    $token = generateToken($user, $secret);
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    setcookie('auth_token', $token, [
        'expires' => time() + (7 * 24 * 60 * 60),
        'path' => '/',
        'httponly' => true,
        'secure' => $secure,
        'samesite' => 'Lax',
    ]);

}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];

    if ($action === 'login') {
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');
        if ($email === '' || $password === '') {
            sendJson(['error' => 'Brak e-maila lub hasła.'], 400);
        }

        $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if (!$user || empty($user['password_hash']) || !password_verify($password, $user['password_hash'])) {
            sendJson(['error' => 'Nieprawidłowe dane logowania.'], 401);
        }
        if (empty($user['email_confirmed'])) {
            sendJson(['error' => 'Potwierdź adres e-mail, aby zalogować się do swojego konta i uzyskać dostęp do materiałów.'], 403);
        }

        setAuthCookie($user, $secret);

        sendJson([
            'message' => 'Zalogowano pomyślnie.',
            'user' => [
                'id' => $user['id'],
                'first_name' => $user['first_name'] ?? null,
                'last_name' => $user['last_name'] ?? null,
                'email' => $user['email'],
                'is_admin' => (bool) $user['is_admin'],
            ],
        ]);
    }

    if ($action === 'register') {
        $firstName = trim((string) ($data['first_name'] ?? ''));
        $lastName = trim((string) ($data['last_name'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');
        $passwordConfirm = (string) ($data['password_confirm'] ?? '');

        if ($firstName === '' || $lastName === '' || $email === '' || $password === '' || $passwordConfirm === '') {
            sendJson(['error' => 'Wszystkie pola są wymagane.'], 400);
        }
        if ($password !== $passwordConfirm) {
            sendJson(['error' => 'Hasła nie są identyczne.'], 400);
        }
        $passwordValidationError = validateStrongPassword($password);
        if ($passwordValidationError !== null) {
            sendJson(['error' => $passwordValidationError], 400);
        }

        $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendJson(['error' => 'Konto z tym adresem e-mail już istnieje.'], 400);
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $confirmToken = bin2hex(random_bytes(32));
        $newUserId = bin2hex(random_bytes(16));

        $stmt = $db->prepare('INSERT INTO users (id, first_name, last_name, email, password_hash, is_admin, email_confirmed, confirm_token) VALUES (?, ?, ?, ?, ?, 0, 0, ?)');
        $stmt->execute([$newUserId, $firstName, $lastName, $email, $passwordHash, $confirmToken]);

        $confirmUrl = detectBaseUrl() . '/api/auth/confirm/' . $confirmToken;
        mailer_send_account_confirmation($email, $confirmUrl, [
            'firstName' => $firstName,
        ]);

        sendJson(['message' => 'Konto zostało utworzone! Sprawdź swoją pocztę, aby potwierdzić adres e-mail.'], 201);
    }

    if ($action === 'forgot-password') {
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        if ($email === '') {
            sendJson(['error' => 'Podaj adres e-mail.'], 400);
        }

        $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if ($user) {
            $resetToken = bin2hex(random_bytes(32));
            $resetExpires = gmdate('c', strtotime('+1 hour'));
            $stmtUpdate = $db->prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?');
            $stmtUpdate->execute([$resetToken, $resetExpires, $email]);

            $resetUrl = detectBaseUrl() . '/resetowanie-hasla?token=' . $resetToken;
            mailer_send_password_reset($email, $resetUrl);
            logEvent('password_reset_requested', 'Wygenerowano link do resetu hasła.', [
                'user_id' => $user['id'] ?? null,
                'customer_email' => $email,
                'reset_expires' => $resetExpires,
            ]);
        }

        sendJson(['message' => 'Jeśli podany e-mail istnieje w bazie, wysłano na niego link do resetu hasła.']);
    }

    if ($action === 'resetowanie-hasla') {
        $token = (string) ($data['token'] ?? '');
        $newPassword = (string) ($data['password'] ?? '');
        $passwordConfirm = (string) ($data['password_confirm'] ?? '');

        if ($token === '' || $newPassword === '' || $passwordConfirm === '') {
            sendJson(['error' => 'Wszystkie pola są wymagane.'], 400);
        }
        if ($newPassword !== $passwordConfirm) {
            sendJson(['error' => 'Hasła nie są identyczne.'], 400);
        }
        $passwordValidationError = validateStrongPassword($newPassword);
        if ($passwordValidationError !== null) {
            sendJson(['error' => $passwordValidationError], 400);
        }

        $stmt = $db->prepare('SELECT id, reset_expires FROM users WHERE reset_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        if (!$user) {
            sendJson(['error' => 'Nieprawidłowy lub wygasły token.'], 400);
        }

        $expiresAt = parseStoredDateTime($user['reset_expires'] ?? null);
        if (!$expiresAt || $expiresAt->getTimestamp() < time()) {
            sendJson(['error' => 'Token resetowania hasła wygasł.'], 400);
        }

        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmtUpdate = $db->prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?');
        $stmtUpdate->execute([$passwordHash, $user['id']]);

        logEvent('password_reset_completed', 'Hasło zostało ustawione z użyciem linku resetującego.', [
            'user_id' => $user['id'],
        ]);

        sendJson(['message' => 'Hasło zostało pomyślnie zmienione. Możesz się zalogować.']);
    }

    if ($action === 'profile') {
        $authUser = requireAuth();
        $firstName = trim((string) ($data['first_name'] ?? ''));
        $lastName = trim((string) ($data['last_name'] ?? ''));
        $phone = trim((string) ($data['phone'] ?? ''));

        if ($firstName === '' || $lastName === '') {
            sendJson(['error' => 'Imię i nazwisko są wymagane.'], 400);
        }

        $stmtUpdate = $db->prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([$firstName, $lastName, $phone !== '' ? $phone : null, $authUser['id']]);

        $stmtUser = $db->prepare('SELECT id, first_name, last_name, email, phone, is_admin, email_confirmed, pending_email, purchased_items FROM users WHERE id = ?');
        $stmtUser->execute([$authUser['id']]);
        $updatedUser = $stmtUser->fetch();

        sendJson([
            'message' => 'Dane konta zostały zapisane.',
            'user' => buildUserPayload($updatedUser),
        ]);
    }

    if ($action === 'change-password') {
        $authUser = requireAuth();
        $currentPassword = (string) ($data['current_password'] ?? '');
        $newPassword = (string) ($data['new_password'] ?? '');
        $passwordConfirm = (string) ($data['password_confirm'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $passwordConfirm === '') {
            sendJson(['error' => 'Wszystkie pola hasła są wymagane.'], 400);
        }
        if ($newPassword !== $passwordConfirm) {
            sendJson(['error' => 'Nowe hasła nie są identyczne.'], 400);
        }

        $passwordValidationError = validateStrongPassword($newPassword);
        if ($passwordValidationError !== null) {
            sendJson(['error' => $passwordValidationError], 400);
        }

        $stmtUser = $db->prepare('SELECT id, password_hash FROM users WHERE id = ?');
        $stmtUser->execute([$authUser['id']]);
        $currentUser = $stmtUser->fetch();
        if (!$currentUser || empty($currentUser['password_hash'])) {
            sendJson(['error' => 'To konto nie ma jeszcze ustawionego hasła.'], 400);
        }
        if (!password_verify($currentPassword, $currentUser['password_hash'])) {
            sendJson(['error' => 'Aktualne hasło jest nieprawidłowe.'], 401);
        }

        $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmtUpdate = $db->prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([$passwordHash, $authUser['id']]);

        logEvent('password_changed', 'Użytkowniczka zmieniła hasło z poziomu ustawień konta.', [
            'user_id' => $authUser['id'],
            'customer_email' => $authUser['email'] ?? null,
        ]);

        sendJson(['message' => 'Hasło zostało zmienione.']);
    }

    if ($action === 'request-email-change') {
        $authUser = requireAuth();
        $nextEmail = normalizeEmailAddress($data['email'] ?? '');
        if ($nextEmail === '') {
            sendJson(['error' => 'Podaj nowy adres e-mail.'], 400);
        }

        $stmtUser = $db->prepare('SELECT id, first_name, email, phone, is_admin, email_confirmed, pending_email, purchased_items FROM users WHERE id = ?');
        $stmtUser->execute([$authUser['id']]);
        $currentUser = $stmtUser->fetch();
        if (!$currentUser) {
            sendJson(['error' => 'Nie znaleziono konta.'], 404);
        }

        if (normalizeEmailAddress($currentUser['email']) === $nextEmail) {
            sendJson(['error' => 'To jest już aktualny adres e-mail tego konta.'], 400);
        }

        $stmtExisting = $db->prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ? LIMIT 1');
        $stmtExisting->execute([$nextEmail, $authUser['id']]);
        if ($stmtExisting->fetch()) {
            sendJson(['error' => 'Konto z tym adresem e-mail już istnieje.'], 409);
        }

        $token = bin2hex(random_bytes(32));
        $stmtUpdate = $db->prepare('UPDATE users SET pending_email = ?, email_change_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([$nextEmail, $token, $authUser['id']]);

        $confirmUrl = detectBaseUrl() . '/api/auth/confirm-email-change/' . $token;
        mailer_send_email_change_confirmation($nextEmail, $confirmUrl, [
            'firstName' => $currentUser['first_name'] ?? '',
            'currentEmail' => $currentUser['email'] ?? '',
        ]);

        logEvent('email_change_requested', 'Rozpoczęto zmianę adresu e-mail.', [
            'user_id' => $authUser['id'],
            'customer_email' => $currentUser['email'] ?? null,
            'next_email' => $nextEmail,
        ]);

        $stmtRefetch = $db->prepare('SELECT id, first_name, last_name, email, phone, is_admin, email_confirmed, pending_email, purchased_items FROM users WHERE id = ?');
        $stmtRefetch->execute([$authUser['id']]);
        $updatedUser = $stmtRefetch->fetch();

        sendJson([
            'message' => 'Wysłano link potwierdzający na nowy adres e-mail.',
            'user' => buildUserPayload($updatedUser),
        ]);
    }

    if ($action === 'logout') {
        setcookie('auth_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
            'samesite' => 'Lax',
        ]);

        sendJson(['message' => 'Wylogowano.']);
    }
}

if ($method === 'GET') {
    if ($action === 'me') {
        $optionalSession = in_array(strtolower((string) ($_GET['optional'] ?? '')), ['1', 'true', 'yes'], true);
        $token = $_COOKIE['auth_token'] ?? null;
        if (!$token) {
            $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
            if (isset($headers['Authorization']) && preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                $token = $matches[1];
            }
        }
        if (!$token) {
            if ($optionalSession) {
                sendJson(['authenticated' => false, 'user' => null]);
            }
            sendJson(['error' => 'Nie zalogowano.'], 401);
        }

        $decoded = decode_jwt($token, $secret);
        if (!$decoded) {
            if ($optionalSession) {
                sendJson(['authenticated' => false, 'user' => null]);
            }
            sendJson(['error' => 'Nieprawidłowy lub wygasły token.'], 401);
        }

        $stmt = $db->prepare('SELECT id, first_name, last_name, email, phone, is_admin, email_confirmed, pending_email, purchased_items FROM users WHERE id = ?');
        $stmt->execute([$decoded['id']]);
        $user = $stmt->fetch();
        if (!$user) {
            sendJson(['error' => 'Podana użytkowniczka nie istnieje.'], 404);
        }

        $payload = buildUserPayload($user);

        if ($optionalSession) {
            sendJson(['authenticated' => true, 'user' => $payload]);
        }

        sendJson($payload);
    }

    if ($action === 'confirm') {
        $token = (string) ($_GET['token'] ?? '');
        $stmt = $db->prepare('SELECT * FROM users WHERE confirm_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        if (!$user) {
            http_response_code(400);
            echo '<h1>Nieprawidłowy link potwierdzający.</h1>';
            exit;
        }

        $stmtUpdate = $db->prepare('UPDATE users SET email_confirmed = 1, confirm_token = NULL WHERE id = ?');
        $stmtUpdate->execute([$user['id']]);

        logEvent('email_confirmed', 'Adres e-mail konta został potwierdzony.', [
            'user_id' => $user['id'],
            'customer_email' => $user['email'] ?? null,
        ]);

        echo '<div style="font-family: Georgia, serif; text-align: center; margin-top: 100px; color: #6B5B7B;"><h1>✓ E-mail potwierdzony!</h1><p>Twoje konto jest aktywne. Możesz się teraz zalogować.</p><a href="/" style="color: #D4AF37;">Wróć na stronę</a></div>';
        exit;
    }

    if ($action === 'confirm-email-change') {
        $token = (string) ($_GET['token'] ?? '');
        $stmt = $db->prepare('SELECT id, first_name, last_name, email, phone, is_admin, email_confirmed, pending_email, email_change_token, purchased_items FROM users WHERE email_change_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        if (!$user || empty($user['pending_email'])) {
            http_response_code(400);
            echo '<h1>Nieprawidłowy lub wygasły link do zmiany adresu e-mail.</h1>';
            exit;
        }

        $nextEmail = normalizeEmailAddress($user['pending_email']);
        $stmtConflict = $db->prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ? LIMIT 1');
        $stmtConflict->execute([$nextEmail, $user['id']]);
        if ($stmtConflict->fetch()) {
            http_response_code(409);
            echo '<h1>Ten adres e-mail został już użyty przez inne konto.</h1>';
            exit;
        }

        $stmtUpdate = $db->prepare('UPDATE users SET email = ?, pending_email = NULL, email_change_token = NULL, email_confirmed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([$nextEmail, $user['id']]);

        logEvent('email_changed', 'Adres e-mail konta został zaktualizowany i potwierdzony.', [
            'user_id' => $user['id'],
            'customer_email' => $nextEmail,
            'previous_email' => $user['email'] ?? null,
        ]);

        $activeToken = $_COOKIE['auth_token'] ?? null;
        if ($activeToken) {
            $decoded = decode_jwt($activeToken, $secret);
            if (is_array($decoded) && ($decoded['id'] ?? null) === $user['id']) {
                $stmtRefetch = $db->prepare('SELECT * FROM users WHERE id = ?');
                $stmtRefetch->execute([$user['id']]);
                $updatedUser = $stmtRefetch->fetch();
                if ($updatedUser) {
                    setAuthCookie($updatedUser, $secret);
                }
            }
        }

        echo '<div style="font-family: Georgia, serif; text-align: center; margin-top: 100px; color: #6B5B7B;"><h1>✓ Adres e-mail został zaktualizowany</h1><p>Od teraz możesz korzystać z konta przy użyciu nowego adresu e-mail.</p><a href="/panel" style="color: #D4AF37;">Przejdź do panelu użytkownika</a></div>';
        exit;
    }
}

sendJson(['error' => 'Unknown action'], 400);