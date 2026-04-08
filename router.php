<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$docroot = $_SERVER['DOCUMENT_ROOT'];

if (is_file($docroot . $path)) {
    return false;
}

// ── Maintenance mode ────────────────────────────────────────────────────────
// Checked dynamically from SQLite on every request — no rebuild needed.
// API traffic and the maintenance page itself are always allowed through.
// Admins (cookie auth_token present + valid) bypass maintenance as well.
$isApiPath = str_starts_with($path, '/api/');
$isMaintenancePage = ($path === '/przerwa-techniczna' || $path === '/przerwa-techniczna/');
$isAdminPath = str_starts_with($path, '/administrator') || str_starts_with($path, '/panel');

if (!$isApiPath && !$isMaintenancePage) {
    $dbPath = __DIR__ . '/data/database.sqlite';
    if (file_exists($dbPath)) {
        try {
            $mdb = new PDO('sqlite:' . $dbPath, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
            $mStmt = $mdb->prepare("SELECT value FROM settings WHERE key = 'maintenance_mode' LIMIT 1");
            $mStmt->execute();
            $maintenanceEnabled = (string) ($mStmt->fetchColumn() ?: '') === '1';

            if ($maintenanceEnabled && !$isAdminPath) {
                // Allow admins through based on a quick JWT check
                $isAdmin = false;
                $authToken = $_COOKIE['auth_token'] ?? '';
                if ($authToken !== '') {
                    try {
                        require_once __DIR__ . '/php_api/jwt.php';
                        $secret = trim((string) getenv('JWT_SECRET')) ?: 'natalia-potocka-secret';
                        $decoded = decode_jwt($authToken, $secret);
                        $isAdmin = is_array($decoded) && !empty($decoded['is_admin']);
                    } catch (Throwable $ignored) {}
                }

                if (!$isAdmin) {
                    $maintenancePage = rtrim($docroot, '/') . '/przerwa-techniczna/index.html';
                    http_response_code(503);
                    header('Retry-After: 3600');
                    if (file_exists($maintenancePage)) {
                        include $maintenancePage;
                    } else {
                        echo '<!doctype html><html lang="pl"><head><meta charset="UTF-8"><title>Przerwa techniczna</title></head><body style="font-family:Georgia,serif;text-align:center;padding:80px 20px;color:#433846"><h1>Wkrótce wracamy</h1><p>Trwają prace serwisowe.</p></body></html>';
                    }
                    exit;
                }
            }
        } catch (Throwable $ignored) {}
    }
}
// ────────────────────────────────────────────────────────────────────────────

if (preg_match('#^/api/products/([^/]+)$#', $path, $matches)) {
    $_GET['slug'] = $matches[1];
    require __DIR__ . '/php_api/products.php';
    exit;
}
if (preg_match('#^/api/products/?$#', $path)) {
    require __DIR__ . '/php_api/products.php';
    exit;
}

if (preg_match('#^/api/admin/products/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'products';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/products/([^/]+)/duplicate$#', $path, $matches)) {
    $_GET['action'] = 'duplicate-product';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/products/?$#', $path)) {
    $_GET['action'] = 'products';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/users/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'users';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/users/([^/]+)/reset-password-link$#', $path, $matches)) {
    $_GET['action'] = 'user-reset-password-link';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/users/([^/]+)/send-reset-password-email$#', $path, $matches)) {
    $_GET['action'] = 'user-send-reset-password-email';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/users/?$#', $path)) {
    $_GET['action'] = 'users';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/coupons/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'coupons';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/coupons/?$#', $path)) {
    $_GET['action'] = 'coupons';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/pages/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'pages';
    $_GET['pageKey'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/pages/?$#', $path)) {
    $_GET['action'] = 'pages';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/media/upload$#', $path)) {
    $_GET['action'] = 'media-upload';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/media/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'media';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/media/?$#', $path)) {
    $_GET['action'] = 'media';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/grant-access$#', $path)) {
    $_GET['action'] = 'grant-access';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/settings$#', $path)) {
    $_GET['action'] = 'settings';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/settings/send-test-email$#', $path)) {
    $_GET['action'] = 'settings-send-test-email';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/orders-export$#', $path)) {
    $_GET['action'] = 'orders-export';
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/orders/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'orders';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/admin.php';
    exit;
}
if (preg_match('#^/api/admin/orders/?$#', $path)) {
    $_GET['action'] = 'orders';
    require __DIR__ . '/php_api/admin.php';
    exit;
}

if (preg_match('#^/api/reviews/all$#', $path)) {
    $_GET['action'] = 'all';
    require __DIR__ . '/php_api/reviews.php';
    exit;
}
if (preg_match('#^/api/reviews/([^/]+)$#', $path, $matches)) {
    $_GET['id'] = $matches[1];
    require __DIR__ . '/php_api/reviews.php';
    exit;
}
if (preg_match('#^/api/reviews/?$#', $path)) {
    require __DIR__ . '/php_api/reviews.php';
    exit;
}
if (preg_match('#^/api/contact/?$#', $path)) {
    require __DIR__ . '/php_api/contact.php';
    exit;
}
if (preg_match('#^/api/checkout/config$#', $path)) {
    $_GET['action'] = 'config';
    require __DIR__ . '/php_api/checkout.php';
    exit;
}
if (preg_match('#^/api/checkout/create-session$#', $path)) {
    $_GET['action'] = 'create-session';
    require __DIR__ . '/php_api/checkout.php';
    exit;
}

if (preg_match('#^/api/courses/by-product/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'by-product';
    $_GET['productId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/progress/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'progress';
    $_GET['courseId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/progress$#', $path)) {
    $_GET['action'] = 'progress';
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/modules/([^/]+)/lessons$#', $path, $matches)) {
    $_GET['action'] = 'lesson-create';
    $_GET['moduleId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/lessons/([^/]+)/attachments$#', $path, $matches)) {
    $_GET['action'] = 'attachment-create';
    $_GET['lessonId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/([^/]+)/modules$#', $path, $matches)) {
    $_GET['action'] = 'module-create';
    $_GET['courseId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/modules/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = $_SERVER['REQUEST_METHOD'] === 'DELETE' ? 'module-delete' : 'module-update';
    $_GET['moduleId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/lessons/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = $_SERVER['REQUEST_METHOD'] === 'DELETE' ? 'lesson-delete' : 'lesson-update';
    $_GET['lessonId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/attachments/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'attachment-delete';
    $_GET['attachmentId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/([^/]+)$#', $path, $matches)) {
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $_GET['action'] = 'delete';
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $_GET['action'] = 'update';
    } else {
        $_GET['action'] = 'get';
    }
    $_GET['courseId'] = $matches[1];
    require __DIR__ . '/php_api/courses.php';
    exit;
}
if (preg_match('#^/api/courses/?$#', $path)) {
    $_GET['action'] = $_SERVER['REQUEST_METHOD'] === 'POST' ? 'create' : 'list';
    require __DIR__ . '/php_api/courses.php';
    exit;
}

if (preg_match('#^/api/client/library$#', $path)) {
    $_GET['action'] = 'library';
    require __DIR__ . '/php_api/client.php';
    exit;
}
if (preg_match('#^/api/client/orders$#', $path)) {
    $_GET['action'] = 'orders';
    require __DIR__ . '/php_api/client.php';
    exit;
}
if (preg_match('#^/api/auth/confirm/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'confirm';
    $_GET['token'] = $matches[1];
    require __DIR__ . '/php_api/auth.php';
    exit;
}
if (preg_match('#^/api/auth/confirm-email-change/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'confirm-email-change';
    $_GET['token'] = $matches[1];
    require __DIR__ . '/php_api/auth.php';
    exit;
}
if (preg_match('#^/api/auth/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = $matches[1];
    require __DIR__ . '/php_api/auth.php';
    exit;
}
if (preg_match('#^/api/webhook/stripe$#', $path) || preg_match('#^/api/webhook/?$#', $path)) {
    require __DIR__ . '/php_api/webhook.php';
    exit;
}

if (preg_match('#^/(product|uslugi|produkty)/([^/]+)$#', $path, $matches)) {
    header('Location: /oferta/' . $matches[2], true, 301);
    exit;
}

$staticIndex = rtrim($docroot . $path, '/\\') . DIRECTORY_SEPARATOR . 'index.html';
if (file_exists($staticIndex)) {
    include $staticIndex;
    exit;
}

include $docroot . '/index.html';