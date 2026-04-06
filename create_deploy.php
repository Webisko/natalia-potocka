<?php
$srcDir = __DIR__;
$buildDir = __DIR__ . '/deploy_prod';

// Funkcja rekurencyjnego kopiowania
function xcopy($src, $dest) {
    if (!is_dir($dest)) {
        mkdir($dest, 0755, true);
    }
    foreach (
     $iterator = new \RecursiveIteratorIterator(
      new \RecursiveDirectoryIterator($src, \RecursiveDirectoryIterator::SKIP_DOTS),
      \RecursiveIteratorIterator::SELF_FIRST) as $item
    ) {
        $subPath = $dest . DIRECTORY_SEPARATOR . $iterator->getSubPathname();
        if ($item->isDir()) {
            if (!is_dir($subPath)) {
                mkdir($subPath, 0755, true);
            }
        } else {
            copy($item, $subPath);
        }
    }
}

// Czyszczenie starego builda
if (is_dir($buildDir)) {
    // Proste usuwanie w PHP (dla małych plików, na windzie czasem system(rm) bezpieczniejsze)
    system('rmdir /S /Q "' . $buildDir . '"');
}

echo "Tworzenie katalogu: $buildDir\n";
mkdir($buildDir, 0755, true);

if (!is_dir($srcDir . '/dist')) {
    fwrite(STDERR, "Brak katalogu /dist. Uruchom najpierw: npm run build:astro\n");
    exit(1);
}

echo "1. Kopiowanie publicznego frontendu Astro (/dist) do /deploy_prod...\n";
xcopy($srcDir . '/dist', $buildDir);

echo "2. Kopiowanie backendu PHP do /deploy_prod/api...\n";
xcopy($srcDir . '/php_api', $buildDir . '/api');
if (file_exists($buildDir . '/api/database.sqlite')) {
    unlink($buildDir . '/api/database.sqlite');
}

echo "3. Tworzenie katalogu /data bez kopiowania lokalnej bazy...\n";
mkdir($buildDir . '/data', 0755, true);
if (file_exists($buildDir . '/data/database.sqlite')) {
    unlink($buildDir . '/data/database.sqlite');
}

// Zabezpieczenie katalogu /data
file_put_contents($buildDir . '/data/.htaccess', "Deny from all\n");

echo "4. Konfiguracja routingu na froncie (.htaccess w głównym katalogu)...\n";
$rootHtaccess = <<<EOD
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^(product|uslugi|produkty)/(.*)$ /oferta/$2 [R=301,L,QSA]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_URI} !^/api/ [NC]
  RewriteCond %{REQUEST_URI} !^/data/ [NC]
  RewriteRule ^(.*)$ index.html [L,QSA]
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 month"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>

<IfModule mod_headers.c>
  <FilesMatch "^(.*)\.[0-9a-zA-Z]{8}\.(js|css)$">
    Header set Cache-Control "max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(ico|webp|avif|jpg|jpeg|png|gif|svg)$">
    Header set Cache-Control "max-age=31536000, public"
  </FilesMatch>
  <FilesMatch "^(index\.html|sitemap\.xml|robots\.txt)$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  SetOutputFilter DEFLATE
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/xml text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/x-javascript application/json
  AddOutputFilterByType DEFLATE application/xml application/xhtml+xml image/svg+xml
  AddOutputFilterByType DEFLATE font/ttf font/otf font/woff application/font-woff application/font-woff2
  BrowserMatch ^Mozilla/4 gzip-only-text/html
  BrowserMatch ^Mozilla/4\.0[678] no-gzip
  BrowserMatch \bMSIE !no-gzip !gzip-only-text/html
  Header append Vary User-Agent env=!dont-vary
</IfModule>

<IfModule mod_filter.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json
</IfModule>
EOD;
file_put_contents($buildDir . '/.htaccess', $rootHtaccess);
echo "5. Konfiguracja routingu API (/api/.htaccess)...\n";
$apiHtaccess = <<<EOD
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /api/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ index.php [L,QSA]
</IfModule>
EOD;
file_put_contents($buildDir . '/api/.htaccess', $apiHtaccess);

echo "6. Generowanie aktualnego routera /api/index.php...\n";
$apiIndex = <<<EOD
<?php
\$path = parse_url(\$_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Zabezpieczenie wejścia bezpośredniego w /api lub /api/ -> powrót do frontu
if (\$path === '/api' || \$path === '/api/') {
    header("Location: /logowanie");
    exit;
}

// Routing endpointów
if (preg_match('#^/api/products/([^/]+)$#', \$path, \$matches)) {
    \$_GET['slug'] = \$matches[1];
    require __DIR__ . '/products.php';
    exit;
} elseif (preg_match('#^/api/products/?$#', \$path)) {
    require __DIR__ . '/products.php';
    exit;
} elseif (preg_match('#^/api/admin/products/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'products';
    \$_GET['id'] = \$matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/products/?$#', \$path)) {
    \$_GET['action'] = 'products';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/users/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'users';
    \$_GET['id'] = \$matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/users/([^/]+)/reset-password-link$#', \$path, \$matches)) {
    \$_GET['action'] = 'user-reset-password-link';
    \$_GET['id'] = \$matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/users/?$#', \$path)) {
    \$_GET['action'] = 'users';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/coupons/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'coupons';
    \$_GET['id'] = \$matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/coupons/?$#', \$path)) {
    \$_GET['action'] = 'coupons';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/pages/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'pages';
    \$_GET['pageKey'] = \$matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/pages/?$#', \$path)) {
    \$_GET['action'] = 'pages';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/media/upload$#', \$path)) {
    \$_GET['action'] = 'media-upload';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/media/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'media';
    \$_GET['id'] = \$matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/media/?$#', \$path)) {
    \$_GET['action'] = 'media';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/grant-access$#', \$path)) {
    \$_GET['action'] = 'grant-access';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/settings$#', \$path)) {
    \$_GET['action'] = 'settings';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/orders/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'orders';
    \$_GET['id'] = \$matches[1];
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/admin/orders/?$#', \$path)) {
    \$_GET['action'] = 'orders';
    require __DIR__ . '/admin.php';
    exit;
} elseif (preg_match('#^/api/reviews/all$#', \$path)) {
    \$_GET['action'] = 'all';
    require __DIR__ . '/reviews.php';
    exit;
} elseif (preg_match('#^/api/reviews/([^/]+)$#', \$path, \$matches)) {
    \$_GET['id'] = \$matches[1];
    require __DIR__ . '/reviews.php';
    exit;
} elseif (preg_match('#^/api/reviews/?$#', \$path)) {
    require __DIR__ . '/reviews.php';
    exit;
} elseif (preg_match('#^/api/contact/?$#', \$path)) {
    require __DIR__ . '/contact.php';
    exit;
} elseif (preg_match('#^/api/checkout/create-session$#', \$path)) {
    \$_GET['action'] = 'create-session';
    require __DIR__ . '/checkout.php';
    exit;
} elseif (preg_match('#^/api/courses/by-product/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'by-product';
    \$_GET['productId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/progress/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'progress';
    \$_GET['courseId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/progress$#', \$path)) {
    \$_GET['action'] = 'progress';
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/modules/([^/]+)/lessons$#', \$path, \$matches)) {
    \$_GET['action'] = 'lesson-create';
    \$_GET['moduleId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/lessons/([^/]+)/attachments$#', \$path, \$matches)) {
    \$_GET['action'] = 'attachment-create';
    \$_GET['lessonId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/([^/]+)/modules$#', \$path, \$matches)) {
    \$_GET['action'] = 'module-create';
    \$_GET['courseId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/modules/([^/]+)$#', \$path, \$matches)) {
    if (\$_SERVER['REQUEST_METHOD'] === 'DELETE') \$_GET['action'] = 'module-delete';
    else \$_GET['action'] = 'module-update';
    \$_GET['moduleId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/lessons/([^/]+)$#', \$path, \$matches)) {
    if (\$_SERVER['REQUEST_METHOD'] === 'DELETE') \$_GET['action'] = 'lesson-delete';
    else \$_GET['action'] = 'lesson-update';
    \$_GET['lessonId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/attachments/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'attachment-delete';
    \$_GET['attachmentId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/([^/]+)$#', \$path, \$matches)) {
    if (\$_SERVER['REQUEST_METHOD'] === 'DELETE') \$_GET['action'] = 'delete';
    else if (\$_SERVER['REQUEST_METHOD'] === 'PUT') \$_GET['action'] = 'update';
    else \$_GET['action'] = 'get';
    \$_GET['courseId'] = \$matches[1];
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/courses/?$#', \$path)) {
    \$_GET['action'] = \$_SERVER['REQUEST_METHOD'] === 'POST' ? 'create' : 'list';
    require __DIR__ . '/courses.php';
    exit;
} elseif (preg_match('#^/api/client/library$#', \$path)) {
    \$_GET['action'] = 'library';
    require __DIR__ . '/client.php';
    exit;
} elseif (preg_match('#^/api/auth/confirm/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = 'confirm';
    \$_GET['token'] = \$matches[1];
    require __DIR__ . '/auth.php';
    exit;
} elseif (preg_match('#^/api/auth/([^/]+)$#', \$path, \$matches)) {
    \$_GET['action'] = \$matches[1];
    require __DIR__ . '/auth.php';
    exit;
} elseif (preg_match('#^/api/webhook/stripe$#', \$path) || preg_match('#^/api/webhook/?$#', \$path)) {
    require __DIR__ . '/webhook.php';
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Endpoint not found: ' . \$path]);
EOD;
file_put_contents($buildDir . '/api/index.php', $apiIndex);

echo "GOTOWE! Zawartość katalogu $buildDir jest gotowa do wrzucenia na serwer.\n";
