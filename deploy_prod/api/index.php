<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Zabezpieczenie wejścia bezpośredniego w /api lub /api/ -> powrót do frontu
if ($path === '/api' || $path === '/api/') {
    header("Location: /logowanie");
    exit;
}

// Routing endpointów
if (preg_match('#^/api/products/([^/]+)$#', $path, $matches)) {
    $_GET['slug'] = $matches[1];
    require __DIR__ . '/products.php';
    exit;
} elseif (preg_match('#^/api/products/?$#', $path)) {
    require __DIR__ . '/products.php';
    exit;
} elseif (preg_match('#^/api/admin/products/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'products';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/products/?$#', $path)) {
    $_GET['action'] = 'products';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/users/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'users';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/users/([^/]+)/reset-password-link$#', $path, $matches)) {
    $_GET['action'] = 'user-reset-password-link';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/users/?$#', $path)) {
    $_GET['action'] = 'users';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/coupons/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'coupons';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/coupons/?$#', $path)) {
    $_GET['action'] = 'coupons';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/pages/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'pages';
    $_GET['pageKey'] = $matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/pages/?$#', $path)) {
    $_GET['action'] = 'pages';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/media/upload$#', $path)) {
    $_GET['action'] = 'media-upload';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/media/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'media';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/media/?$#', $path)) {
    $_GET['action'] = 'media';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/grant-access$#', $path)) {
    $_GET['action'] = 'grant-access';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/settings$#', $path)) {
    $_GET['action'] = 'settings';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/orders/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'orders';
    $_GET['id'] = $matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/orders/?$#', $path)) {
    $_GET['action'] = 'orders';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/reviews/all$#', $path)) {
    $_GET['action'] = 'all';
    require __DIR__ . '/reviews.php';
    exit;
} elseif (preg_match('#^/api/reviews/([^/]+)$#', $path, $matches)) {
    $_GET['id'] = $matches[1];
    require __DIR__ . '/reviews.php';
    exit;
} elseif (preg_match('#^/api/reviews/?$#', $path)) {
    require __DIR__ . '/reviews.php';
    exit;
} elseif (preg_match('#^/api/contact/?$#', $path)) {
    require __DIR__ . '/contact.php';
    exit;
} elseif (preg_match('#^/api/checkout/create-session$#', $path)) {
    $_GET['action'] = 'create-session';
    require __DIR__ . '/checkout.php';
    exit;
} elseif (preg_match('#^/api/courses/by-product/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'by-product';
    $_GET['productId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/progress/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'progress';
    $_GET['courseId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/progress$#', $path)) {
    $_GET['action'] = 'progress';
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/modules/([^/]+)/lessons$#', $path, $matches)) {
    $_GET['action'] = 'lesson-create';
    $_GET['moduleId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/lessons/([^/]+)/attachments$#', $path, $matches)) {
    $_GET['action'] = 'attachment-create';
    $_GET['lessonId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/([^/]+)/modules$#', $path, $matches)) {
    $_GET['action'] = 'module-create';
    $_GET['courseId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/modules/([^/]+)$#', $path, $matches)) {
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') $_GET['action'] = 'module-delete';
    else $_GET['action'] = 'module-update';
    $_GET['moduleId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/lessons/([^/]+)$#', $path, $matches)) {
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') $_GET['action'] = 'lesson-delete';
    else $_GET['action'] = 'lesson-update';
    $_GET['lessonId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/attachments/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'attachment-delete';
    $_GET['attachmentId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/([^/]+)$#', $path, $matches)) {
    if ($_SERVER['REQUEST_METHOD'] === 'DELETE') $_GET['action'] = 'delete';
    else if ($_SERVER['REQUEST_METHOD'] === 'PUT') $_GET['action'] = 'update';
    else $_GET['action'] = 'get';
    $_GET['courseId'] = $matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/?$#', $path)) {
    $_GET['action'] = $_SERVER['REQUEST_METHOD'] === 'POST' ? 'create' : 'list';
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/client/library$#', $path)) {
    $_GET['action'] = 'library';
    require __DIR__ . '/client.php';
    exit;
} elseif (preg_match('#^/api/auth/confirm/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = 'confirm';
    $_GET['token'] = $matches[1];
    require __DIR__ . '/auth.php';
    exit;
} elseif (preg_match('#^/api/auth/([^/]+)$#', $path, $matches)) {
    $_GET['action'] = $matches[1];
    require __DIR__ . '/auth.php';
    exit;
} elseif (preg_match('#^/api/webhook/stripe$#', $path) || preg_match('#^/api/webhook/?$#', $path)) {
    require __DIR__ . '/webhook.php';
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found: ' . $path]);