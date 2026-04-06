<?php
// php_api/authMiddleware.php

function decode_jwt($token, $secret) {
    if (!$token) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    list($headb64, $payloadb64, $cryptob64) = $parts;

    $signature = base64_decode(strtr($cryptob64, '-_', '+/'));
    $expected_sig = hash_hmac('sha256', "$headb64.$payloadb64", $secret, true);

    if (!hash_equals($expected_sig, $signature)) {
        return null; // Invalid signature
    }

    $payload = json_decode(base64_decode(strtr($payloadb64, '-_', '+/')), true);
    
    // Check expiry
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return null; // Expired
    }

    return $payload; // Array with user details
}

function getJwtSecret() {
    global $db;
    if (!$db) {
        require_once __DIR__ . '/db.php';
    }
    $stmt = $db->query("SELECT value FROM settings WHERE key = 'jwt_secret'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row && !empty($row['value'])) {
        return $row['value'];
    }
    $newSecret = bin2hex(random_bytes(32));
    $db->prepare("INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)")->execute([$newSecret]);
    return $newSecret;
}

function requireAuth() {
    $token = $_COOKIE['auth_token'] ?? null;
    
    if (!$token) {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : [];
        if (empty($headers)) {
            foreach ($_SERVER as $name => $value) {
                if (substr($name, 0, 5) == 'HTTP_') {
                    $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                }
            }
        }
        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                $token = $matches[1];
            }
        }
    }

    if (!$token) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Brak dostępu - wymagane zalogowanie.']);
        exit;
    }

    $secret = getJwtSecret(); 
    $user = decode_jwt($token, $secret);

    if (!$user) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Nieprawidłowy token autoryzacji.']);
        exit;
    }

    return $user;
}

function requireAdmin() {
    $user = requireAuth();
    if (empty($user['is_admin'])) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'Brak uprawnień administratora.']);
        exit;
    }
    return $user;
}
