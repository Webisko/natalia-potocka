<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit(0);
}

$dbPath = __DIR__ . '/../data/database.sqlite';
$dataDir = __DIR__ . '/../data';

if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

$pageDefaults = [
    [
        'page_key' => 'home',
        'page_name' => 'Strona główna',
        'slug' => '',
        'title' => 'Natalia Potocka',
        'featured_image_url' => '/images/hero_doula.png',
        'meta_title' => 'Natalia Potocka',
        'meta_desc' => 'Wsparcie okołoporodowe, konsultacje, szkolenia i produkty cyfrowe Natalii Potockiej.',
        'meta_image_url' => '/images/hero_doula.png',
        'canonical_url' => '',
        'noindex' => 0,
    ],
    [
        'page_key' => 'about',
        'page_name' => 'O mnie',
        'slug' => 'o-mnie',
        'title' => 'O mnie',
        'featured_image_url' => '/images/about_doula.png',
        'meta_title' => 'O mnie | Natalia Potocka',
        'meta_desc' => 'Poznaj podejście i doświadczenie Natalii Potockiej.',
        'meta_image_url' => '/images/about_doula.png',
        'canonical_url' => '',
        'noindex' => 0,
    ],
    [
        'page_key' => 'contact',
        'page_name' => 'Kontakt',
        'slug' => 'kontakt',
        'title' => 'Kontakt',
        'featured_image_url' => '/images/about_doula.png',
        'meta_title' => 'Kontakt | Natalia Potocka',
        'meta_desc' => 'Skontaktuj się z Natalią Potocką w sprawie konsultacji i wsparcia.',
        'meta_image_url' => '/images/about_doula.png',
        'canonical_url' => '',
        'noindex' => 0,
    ],
    [
        'page_key' => 'offer',
        'page_name' => 'Oferta',
        'slug' => 'oferta',
        'title' => 'Oferta',
        'featured_image_url' => '/images/hero_doula.png',
        'meta_title' => 'Oferta | Natalia Potocka',
        'meta_desc' => 'Poznaj ofertę konsultacji, wsparcia i produktów cyfrowych Natalii Potockiej.',
        'meta_image_url' => '/images/hero_doula.png',
        'canonical_url' => '',
        'noindex' => 0,
    ],
    [
        'page_key' => 'privacy',
        'page_name' => 'Polityka prywatności',
        'slug' => 'polityka-prywatnosci',
        'title' => 'Polityka prywatności',
        'featured_image_url' => '/images/hero_doula.png',
        'meta_title' => 'Polityka prywatności | Natalia Potocka',
        'meta_desc' => 'Informacje o przetwarzaniu danych osobowych i technicznych zasadach działania strony internetowej.',
        'meta_image_url' => '/images/hero_doula.png',
        'canonical_url' => '',
        'noindex' => 0,
    ],
    [
        'page_key' => 'terms',
        'page_name' => 'Regulamin sklepu',
        'slug' => 'regulamin-sklepu',
        'title' => 'Regulamin sklepu',
        'featured_image_url' => '/images/hero_doula.png',
        'meta_title' => 'Regulamin sklepu | Natalia Potocka',
        'meta_desc' => 'Zasady zakupu i korzystania z produktów cyfrowych dostępnych na stronie Natalii Potockiej.',
        'meta_image_url' => '/images/hero_doula.png',
        'canonical_url' => '',
        'noindex' => 0,
    ],
];

try {
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec('PRAGMA journal_mode = WAL');

    $db->exec("PRAGMA foreign_keys = ON");

    $db->exec("
    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        short_description TEXT,
        price REAL NOT NULL,
        promotional_price REAL,
        promotional_price_until DATETIME,
        lowest_price_30_days REAL,
        stripe_price_id TEXT,
        type TEXT NOT NULL,
        content_url TEXT,
        thumbnail_url TEXT,
        secondary_image_url TEXT,
        duration_label TEXT,
        long_description TEXT,
        benefits_json TEXT,
        faq_json TEXT,
        allow_download INTEGER DEFAULT 1,
        meta_title TEXT,
        meta_desc TEXT,
        meta_image_url TEXT,
        canonical_url TEXT,
        noindex INTEGER DEFAULT 0,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        order_number TEXT,
        customer_email TEXT NOT NULL,
        customer_first_name TEXT,
        customer_last_name TEXT,
        product_id TEXT NOT NULL,
        product_title TEXT,
        product_slug TEXT,
        amount_total REAL NOT NULL,
        applied_coupon_code TEXT,
        payment_method TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT,
        purchased_items TEXT,
        phone TEXT,
        is_admin INTEGER DEFAULT 0,
        email_confirmed INTEGER DEFAULT 0,
        confirm_token TEXT,
        pending_email TEXT,
        email_change_token TEXT,
        reset_token TEXT,
        reset_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT NOT NULL,
        subtitle TEXT,
        content TEXT NOT NULL,
        thumbnail_url TEXT,
        order_index INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        lesson_type TEXT NOT NULL DEFAULT 'video',
        content_url TEXT,
        content_text TEXT,
        duration_minutes INTEGER,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lesson_attachments (
        id TEXT PRIMARY KEY,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        completed INTEGER DEFAULT 0,
        completed_at DATETIME,
        UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS page_settings (
        page_key TEXT PRIMARY KEY,
        page_name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        featured_image_url TEXT,
        meta_title TEXT,
        meta_desc TEXT,
        meta_image_url TEXT,
        canonical_url TEXT,
        noindex INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_consents (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        stripe_session_id TEXT NOT NULL UNIQUE,
        terms_accepted_at DATETIME NOT NULL,
        digital_content_consent_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        value REAL NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        valid_from DATETIME,
        valid_until DATETIME,
        minimum_spend REAL,
        maximum_spend REAL,
        usage_limit_per_user INTEGER,
        included_product_ids TEXT,
        excluded_product_ids TEXT,
        allowed_emails TEXT,
        exclude_sale_items INTEGER DEFAULT 0,
        usage_limit INTEGER,
        times_used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        title TEXT,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        alt_text TEXT,
        public_url TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_log (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        message TEXT NOT NULL,
        user_id TEXT,
        order_id TEXT,
        customer_email TEXT,
        context_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    ");

    $ensureColumn = function (string $table, string $column, string $definition) use ($db) {
        $stmt = $db->query("PRAGMA table_info($table)");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN, 1);
        if (in_array($column, $columns, true)) {
            return;
        }

        $db->exec("ALTER TABLE $table ADD COLUMN $column $definition");
    };

    $ensureColumn('users', 'first_name', 'TEXT');
    $ensureColumn('users', 'last_name', 'TEXT');
    $ensureColumn('users', 'phone', 'TEXT');
    $ensureColumn('users', 'email_confirmed', 'INTEGER DEFAULT 0');
    $ensureColumn('users', 'confirm_token', 'TEXT');
    $ensureColumn('users', 'pending_email', 'TEXT');
    $ensureColumn('users', 'email_change_token', 'TEXT');
    $ensureColumn('users', 'reset_token', 'TEXT');
    $ensureColumn('users', 'reset_expires', 'DATETIME');

    $ensureColumn('products', 'short_description', 'TEXT');
    $ensureColumn('products', 'promotional_price', 'REAL');
    $ensureColumn('products', 'promotional_price_until', 'DATETIME');
    $ensureColumn('products', 'lowest_price_30_days', 'REAL');
    $ensureColumn('products', 'duration_label', 'TEXT');
    $ensureColumn('products', 'long_description', 'TEXT');
    $ensureColumn('products', 'benefits_json', 'TEXT');
    $ensureColumn('products', 'faq_json', 'TEXT');
    $ensureColumn('products', 'secondary_image_url', 'TEXT');
    $ensureColumn('products', 'meta_title', 'TEXT');
    $ensureColumn('products', 'meta_desc', 'TEXT');
    $ensureColumn('products', 'meta_image_url', 'TEXT');
    $ensureColumn('products', 'canonical_url', 'TEXT');
    $ensureColumn('products', 'noindex', 'INTEGER DEFAULT 0');
    $ensureColumn('products', 'is_published', 'INTEGER DEFAULT 1');
    $ensureColumn('products', 'updated_at', 'DATETIME');

    $ensureColumn('settings', 'updated_at', 'DATETIME');
    $ensureColumn('page_settings', 'featured_image_url', 'TEXT');
    $ensureColumn('page_settings', 'meta_title', 'TEXT');
    $ensureColumn('page_settings', 'meta_desc', 'TEXT');
    $ensureColumn('page_settings', 'meta_image_url', 'TEXT');
    $ensureColumn('page_settings', 'canonical_url', 'TEXT');
    $ensureColumn('page_settings', 'noindex', 'INTEGER DEFAULT 0');
    $ensureColumn('page_settings', 'updated_at', 'DATETIME');
    $ensureColumn('coupons', 'description', 'TEXT');
    $ensureColumn('coupons', 'is_active', 'INTEGER DEFAULT 1');
    $ensureColumn('coupons', 'valid_from', 'DATETIME');
    $ensureColumn('coupons', 'valid_until', 'DATETIME');
    $ensureColumn('coupons', 'minimum_spend', 'REAL');
    $ensureColumn('coupons', 'maximum_spend', 'REAL');
    $ensureColumn('coupons', 'usage_limit_per_user', 'INTEGER');
    $ensureColumn('coupons', 'included_product_ids', 'TEXT');
    $ensureColumn('coupons', 'excluded_product_ids', 'TEXT');
    $ensureColumn('coupons', 'allowed_emails', 'TEXT');
    $ensureColumn('coupons', 'exclude_sale_items', 'INTEGER DEFAULT 0');
    $ensureColumn('coupons', 'usage_limit', 'INTEGER');
    $ensureColumn('coupons', 'times_used', 'INTEGER DEFAULT 0');
    $ensureColumn('coupons', 'updated_at', 'DATETIME');
    $ensureColumn('orders', 'order_number', 'TEXT');
    $ensureColumn('orders', 'customer_first_name', 'TEXT');
    $ensureColumn('orders', 'customer_last_name', 'TEXT');
    $ensureColumn('orders', 'product_title', 'TEXT');
    $ensureColumn('orders', 'product_slug', 'TEXT');
    $ensureColumn('orders', 'applied_coupon_code', 'TEXT');
    $ensureColumn('orders', 'payment_method', 'TEXT');
    $ensureColumn('orders', 'updated_at', 'DATETIME');
    $ensureColumn('media_assets', 'title', 'TEXT');
    $ensureColumn('media_assets', 'width', 'INTEGER');
    $ensureColumn('media_assets', 'height', 'INTEGER');
    $ensureColumn('media_assets', 'alt_text', 'TEXT');
    $ensureColumn('media_assets', 'updated_at', 'DATETIME');

    backfillMissingOrderNumbers($db);
    backfillOrderSnapshots($db);

    $insertPageSetting = $db->prepare('INSERT OR IGNORE INTO page_settings (page_key, page_name, slug, title, featured_image_url, meta_title, meta_desc, meta_image_url, canonical_url, noindex, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
    foreach ($pageDefaults as $page) {
        $insertPageSetting->execute([
            $page['page_key'],
            $page['page_name'],
            $page['slug'],
            $page['title'],
            $page['featured_image_url'],
            $page['meta_title'],
            $page['meta_desc'],
            $page['meta_image_url'],
            $page['canonical_url'],
            $page['noindex'],
        ]);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
    exit;
}

function sendJson($data, $statusCode = 200) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function normalizeEventEmail(?string $email): ?string
{
    $normalized = strtolower(trim((string) $email));
    return $normalized === '' ? null : $normalized;
}

function getOrderDateKey($createdAt = null): string
{
    $timestamp = $createdAt ? strtotime((string) $createdAt) : time();
    if ($timestamp === false) {
        $timestamp = time();
    }

    return gmdate('Ymd', $timestamp);
}

function formatOrderNumber(string $dateKey, int $sequence): string
{
    return sprintf('NP-%s-%04d', $dateKey, $sequence);
}

function parseOrderNumber(?string $orderNumber): ?array
{
    if (!preg_match('/^NP-(\d{8})-(\d{4})$/', (string) $orderNumber, $matches)) {
        return null;
    }

    return [
        'dateKey' => $matches[1],
        'sequence' => (int) $matches[2],
    ];
}

function generateOrderNumber($createdAt = null): string
{
    global $db;

    $dateKey = getOrderDateKey($createdAt);
    $stmt = $db->prepare('SELECT order_number FROM orders WHERE order_number LIKE ? ORDER BY order_number DESC LIMIT 1');
    $stmt->execute(['NP-' . $dateKey . '-%']);
    $latest = parseOrderNumber((string) ($stmt->fetchColumn() ?: ''));
    $nextSequence = ($latest['sequence'] ?? 0) + 1;

    return formatOrderNumber($dateKey, $nextSequence);
}

function backfillMissingOrderNumbers(PDO $db): void
{
    $rows = $db->query("SELECT id, created_at, order_number FROM orders ORDER BY COALESCE(datetime(created_at), created_at) ASC, id ASC")->fetchAll();
    if (!$rows) {
        return;
    }

    $counters = [];
    foreach ($rows as $row) {
        $parsed = parseOrderNumber($row['order_number'] ?? null);
        if ($parsed) {
            $counters[$parsed['dateKey']] = max($counters[$parsed['dateKey']] ?? 0, $parsed['sequence']);
        }
    }

    $stmtUpdate = $db->prepare('UPDATE orders SET order_number = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    foreach ($rows as $row) {
        if (trim((string) ($row['order_number'] ?? '')) !== '') {
            continue;
        }

        $dateKey = getOrderDateKey($row['created_at'] ?? null);
        $nextSequence = ($counters[$dateKey] ?? 0) + 1;
        $counters[$dateKey] = $nextSequence;
        $stmtUpdate->execute([formatOrderNumber($dateKey, $nextSequence), $row['id']]);
    }
}

function inferOrderPaymentMethod(array $order): ?string
{
    $status = trim((string) ($order['status'] ?? ''));
    $orderId = trim((string) ($order['id'] ?? ''));

    if ($status === 'pending_bank_transfer' || str_starts_with($orderId, 'bank_')) {
        return 'bank_transfer';
    }

    if (str_starts_with($orderId, 'man_')) {
        return 'manual';
    }

    if (str_starts_with($orderId, 'stripe_')) {
        return 'stripe';
    }

    return null;
}

function backfillOrderSnapshots(PDO $db): void
{
    $stmt = $db->query("SELECT o.id, o.customer_email, o.product_id, o.product_title, o.product_slug, o.customer_first_name, o.customer_last_name, o.payment_method, o.status, p.title AS live_product_title, p.slug AS live_product_slug, u.first_name AS live_first_name, u.last_name AS live_last_name FROM orders o LEFT JOIN products p ON p.id = o.product_id LEFT JOIN users u ON lower(u.email) = lower(o.customer_email)");
    $rows = $stmt->fetchAll();
    if (!$rows) {
        return;
    }

    $stmtUpdate = $db->prepare('UPDATE orders SET product_title = ?, product_slug = ?, customer_first_name = ?, customer_last_name = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    foreach ($rows as $row) {
        $productTitle = trim((string) ($row['product_title'] ?? '')) !== '' ? $row['product_title'] : ($row['live_product_title'] ?? null);
        $productSlug = trim((string) ($row['product_slug'] ?? '')) !== '' ? $row['product_slug'] : ($row['live_product_slug'] ?? null);
        $firstName = trim((string) ($row['customer_first_name'] ?? '')) !== '' ? $row['customer_first_name'] : ($row['live_first_name'] ?? null);
        $lastName = trim((string) ($row['customer_last_name'] ?? '')) !== '' ? $row['customer_last_name'] : ($row['live_last_name'] ?? null);
        $paymentMethod = trim((string) ($row['payment_method'] ?? '')) !== '' ? $row['payment_method'] : inferOrderPaymentMethod($row);

        $stmtUpdate->execute([$productTitle, $productSlug, $firstName, $lastName, $paymentMethod, $row['id']]);
    }
}

function logEvent(string $eventType, string $message, array $context = []): void
{
    global $db;

    try {
        $eventId = bin2hex(random_bytes(16));
        $userId = trim((string) ($context['user_id'] ?? '')) ?: null;
        $orderId = trim((string) ($context['order_id'] ?? '')) ?: null;
        $customerEmail = normalizeEventEmail($context['customer_email'] ?? null);
        unset($context['user_id'], $context['order_id'], $context['customer_email']);

        $contextJson = $context ? json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
        $stmt = $db->prepare('INSERT INTO event_log (id, event_type, message, user_id, order_id, customer_email, context_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $stmt->execute([$eventId, $eventType, $message, $userId, $orderId, $customerEmail, $contextJson]);
    } catch (Throwable $ignored) {
    }
}

function getEventLog(array $filters = [], int $limit = 25): array
{
    global $db;

    $conditions = [];
    $params = [];

    if (!empty($filters['order_id'])) {
        $conditions[] = 'order_id = ?';
        $params[] = (string) $filters['order_id'];
    }

    if (!empty($filters['user_id']) && !empty($filters['customer_email'])) {
        $conditions[] = '(user_id = ? OR lower(customer_email) = lower(?))';
        $params[] = (string) $filters['user_id'];
        $params[] = (string) $filters['customer_email'];
    } elseif (!empty($filters['user_id'])) {
        $conditions[] = 'user_id = ?';
        $params[] = (string) $filters['user_id'];
    } elseif (!empty($filters['customer_email'])) {
        $conditions[] = 'lower(customer_email) = lower(?)';
        $params[] = (string) $filters['customer_email'];
    }

    $sql = 'SELECT * FROM event_log';
    if ($conditions) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY COALESCE(datetime(created_at), created_at) DESC LIMIT ' . max(1, $limit);

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    return array_map(static function (array $row): array {
        $row['context'] = !empty($row['context_json']) ? (json_decode((string) $row['context_json'], true) ?: []) : [];
        unset($row['context_json']);
        return $row;
    }, $rows ?: []);
}