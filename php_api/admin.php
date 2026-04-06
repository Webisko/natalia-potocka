<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';
$currentUser = requireAdmin();

const PAGE_RESERVED_SLUGS = [
    'api',
    'administrator',
    'panel',
    'logowanie',
    'zapomnialam-hasla',
    'resetowanie-hasla',
];

function getPageDefaults(): array {
    return [
        'home' => ['page_key' => 'home', 'page_name' => 'Strona główna', 'slug' => '', 'title' => 'Natalia Potocka', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Natalia Potocka', 'meta_desc' => 'Wsparcie okołoporodowe, konsultacje, szkolenia i produkty cyfrowe Natalii Potockiej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'about' => ['page_key' => 'about', 'page_name' => 'O mnie', 'slug' => 'o-mnie', 'title' => 'O mnie', 'featured_image_url' => '/images/about_doula.png', 'meta_title' => 'O mnie | Natalia Potocka', 'meta_desc' => 'Poznaj podejście i doświadczenie Natalii Potockiej.', 'meta_image_url' => '/images/about_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'contact' => ['page_key' => 'contact', 'page_name' => 'Kontakt', 'slug' => 'kontakt', 'title' => 'Kontakt', 'featured_image_url' => '/images/about_doula.png', 'meta_title' => 'Kontakt | Natalia Potocka', 'meta_desc' => 'Skontaktuj się z Natalią Potocką w sprawie konsultacji i wsparcia.', 'meta_image_url' => '/images/about_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'offer' => ['page_key' => 'offer', 'page_name' => 'Oferta', 'slug' => 'oferta', 'title' => 'Oferta', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Oferta | Natalia Potocka', 'meta_desc' => 'Poznaj ofertę konsultacji, wsparcia i produktów cyfrowych Natalii Potockiej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'privacy' => ['page_key' => 'privacy', 'page_name' => 'Polityka prywatności', 'slug' => 'polityka-prywatnosci', 'title' => 'Polityka prywatności', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Polityka prywatności | Natalia Potocka', 'meta_desc' => 'Informacje o przetwarzaniu danych osobowych i technicznych zasadach działania strony internetowej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'terms' => ['page_key' => 'terms', 'page_name' => 'Regulamin sklepu', 'slug' => 'regulamin-sklepu', 'title' => 'Regulamin sklepu', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Regulamin sklepu | Natalia Potocka', 'meta_desc' => 'Zasady zakupu i korzystania z produktów cyfrowych dostępnych na stronie Natalii Potockiej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
    ];
}

function emptyToNull($value) {
    if ($value === null) {
        return null;
    }
    if (is_string($value)) {
        $trimmed = trim($value);
        return $trimmed === '' ? null : $trimmed;
    }
    return $value;
}

function parseBooleanFlag($value): int {
    return ($value === true || $value === 1 || $value === '1' || $value === 'true') ? 1 : 0;
}

function parseNullableInteger($value): ?int {
    if ($value === '' || $value === null) {
        return null;
    }
    return is_numeric($value) ? (int) $value : null;
}

function normalizeSlug(string $value): string {
    return trim(strtolower(trim($value)), '/');
}

function normalizeBenefitCards($value): array {
    if (is_string($value)) {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return [];
        }
        $decoded = json_decode($trimmed, true);
        if (!is_array($decoded)) {
            return [];
        }
        $value = $decoded;
    }

    if (!is_array($value)) {
        return [];
    }

    $cards = [];
    foreach ($value as $card) {
        $title = trim((string) ($card['title'] ?? ''));
        $description = trim((string) ($card['description'] ?? ''));
        if ($title !== '' || $description !== '') {
            $cards[] = ['title' => $title, 'description' => $description];
        }
    }

    return array_slice($cards, 0, 3);
}

function normalizeFaqItems($value): array {
    if (is_string($value)) {
        $trimmed = trim($value);
        if ($trimmed === '') {
            return [];
        }
        $decoded = json_decode($trimmed, true);
        if (!is_array($decoded)) {
            return [];
        }
        $value = $decoded;
    }

    if (!is_array($value)) {
        return [];
    }

    $items = [];
    foreach ($value as $item) {
        $question = trim((string) ($item['q'] ?? ''));
        $answer = trim((string) ($item['a'] ?? ''));
        if ($question !== '' || $answer !== '') {
            $items[] = ['q' => $question, 'a' => $answer];
        }
    }

    return array_slice($items, 0, 5);
}

function serializeBenefitCards($value): ?string {
    $cards = normalizeBenefitCards($value);
    return $cards ? json_encode($cards, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
}

function serializeFaqItems($value): ?string {
    $items = normalizeFaqItems($value);
    return $items ? json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
}

function normalizePurchasedItems($value): array {
    if (is_array($value)) {
        return array_values(array_unique(array_filter(array_map(static function ($item) {
            return trim((string) $item);
        }, $value))));
    }

    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    return array_values(array_unique(array_filter(array_map('trim', explode(',', $value)))));
}

function serializePurchasedItems($value): ?string {
    $items = normalizePurchasedItems($value);
    return $items ? implode(',', $items) : null;
}

function normalizeDelimitedText($value, bool $lowercase = false): array {
    if (is_array($value)) {
        $items = $value;
    } else {
        $items = preg_split('/[\n,;]+/', (string) ($value ?? '')) ?: [];
    }

    $normalized = [];
    foreach ($items as $item) {
        $trimmed = trim((string) $item);
        if ($trimmed === '') {
            continue;
        }
        $normalized[] = $lowercase ? strtolower($trimmed) : $trimmed;
    }

    return array_values(array_unique($normalized));
}

function serializeDelimitedText($value, bool $lowercase = false): ?string {
    $items = normalizeDelimitedText($value, $lowercase);
    return $items ? implode(',', $items) : null;
}

function mapUser(array $user): array {
    $user['is_admin'] = !empty($user['is_admin']);
    $user['email_confirmed'] = !empty($user['email_confirmed']);
    $user['purchased_items'] = normalizePurchasedItems($user['purchased_items'] ?? null);
    $user['purchased_item_count'] = count($user['purchased_items']);
    return $user;
}

function mapCoupon(array $coupon): array {
    $coupon['code'] = strtoupper(trim((string) ($coupon['code'] ?? '')));
    $coupon['discount_type'] = strtolower(trim((string) ($coupon['discount_type'] ?? '')));
    $coupon['is_active'] = !empty($coupon['is_active']);
    $coupon['exclude_sale_items'] = !empty($coupon['exclude_sale_items']);
    $coupon['usage_limit'] = $coupon['usage_limit'] === null ? null : (int) $coupon['usage_limit'];
    $coupon['usage_limit_per_user'] = $coupon['usage_limit_per_user'] === null ? null : (int) $coupon['usage_limit_per_user'];
    $coupon['times_used'] = (int) ($coupon['times_used'] ?? 0);
    $coupon['value'] = (float) ($coupon['value'] ?? 0);
    $coupon['minimum_spend'] = $coupon['minimum_spend'] === null ? null : (float) $coupon['minimum_spend'];
    $coupon['maximum_spend'] = $coupon['maximum_spend'] === null ? null : (float) $coupon['maximum_spend'];
    $coupon['included_product_ids'] = normalizeDelimitedText($coupon['included_product_ids'] ?? null);
    $coupon['excluded_product_ids'] = normalizeDelimitedText($coupon['excluded_product_ids'] ?? null);
    $coupon['allowed_emails'] = normalizeDelimitedText($coupon['allowed_emails'] ?? null, true);
    return $coupon;
}

function mapProduct(array $product): array {
    $product['benefits_json'] = normalizeBenefitCards($product['benefits_json'] ?? null);
    $product['faq_json'] = normalizeFaqItems($product['faq_json'] ?? null);
    $product['noindex'] = !empty($product['noindex']);
    $product['is_published'] = !empty($product['is_published']);
    $product['course_count'] = (int) ($product['course_count'] ?? 0);
    $product['module_count'] = (int) ($product['module_count'] ?? 0);
    $product['lesson_count'] = (int) ($product['lesson_count'] ?? 0);
    return $product;
}

function requireUserRecord(string $userId): array {
    global $db;
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) {
        sendJson(['error' => 'Nie znaleziono użytkowniczki.'], 404);
    }
    return $user;
}

function requireProductRecord(string $productId): array {
    global $db;
    $stmt = $db->prepare("SELECT id, title FROM products WHERE id = ? AND type != 'service'");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    if (!$product) {
        sendJson(['error' => 'Produkt nie istnieje.'], 404);
    }
    return $product;
}

function validateCouponPayload(array $payload, bool $partial = false): ?string {
    $code = strtoupper(trim((string) ($payload['code'] ?? '')));
    $discountType = strtolower(trim((string) ($payload['discount_type'] ?? '')));
    $value = $payload['value'] ?? null;
    $minimumSpend = ($payload['minimum_spend'] ?? null) === '' ? null : ($payload['minimum_spend'] ?? null);
    $maximumSpend = ($payload['maximum_spend'] ?? null) === '' ? null : ($payload['maximum_spend'] ?? null);
    $usageLimit = ($payload['usage_limit'] ?? null) === '' ? null : ($payload['usage_limit'] ?? null);
    $usageLimitPerUser = ($payload['usage_limit_per_user'] ?? null) === '' ? null : ($payload['usage_limit_per_user'] ?? null);
    $includedProductIds = normalizeDelimitedText($payload['included_product_ids'] ?? null);
    $excludedProductIds = normalizeDelimitedText($payload['excluded_product_ids'] ?? null);

    if ((!$partial || array_key_exists('code', $payload)) && $code === '') {
        return 'Kod kuponu jest wymagany.';
    }
    if ((!$partial || array_key_exists('discount_type', $payload)) && !in_array($discountType, ['percent', 'amount'], true)) {
        return 'Typ zniżki musi być równy percent albo amount.';
    }
    if ((!$partial || array_key_exists('value', $payload)) && (!is_numeric($value) || (float) $value <= 0)) {
        return 'Wartość kuponu musi być większa od zera.';
    }
    if ($discountType === 'percent' && is_numeric($value) && (float) $value > 100) {
        return 'Zniżka procentowa nie może przekroczyć 100%.';
    }

    if ((!$partial || array_key_exists('minimum_spend', $payload)) && $minimumSpend !== null && (!is_numeric($minimumSpend) || (float) $minimumSpend < 0)) {
        return 'Minimalna kwota koszyka musi być liczbą nieujemną.';
    }

    if ((!$partial || array_key_exists('maximum_spend', $payload)) && $maximumSpend !== null && (!is_numeric($maximumSpend) || (float) $maximumSpend < 0)) {
        return 'Maksymalna kwota koszyka musi być liczbą nieujemną.';
    }

    if ($minimumSpend !== null && $maximumSpend !== null && (float) $minimumSpend > (float) $maximumSpend) {
        return 'Minimalna kwota nie może być większa od maksymalnej.';
    }

    if ((!$partial || array_key_exists('usage_limit', $payload)) && $usageLimit !== null && (!is_numeric($usageLimit) || (int) $usageLimit < 1 || (string) (int) $usageLimit !== (string) $usageLimit)) {
        return 'Limit użyć kuponu musi być liczbą całkowitą większą od zera.';
    }

    if ((!$partial || array_key_exists('usage_limit_per_user', $payload)) && $usageLimitPerUser !== null && (!is_numeric($usageLimitPerUser) || (int) $usageLimitPerUser < 1 || (string) (int) $usageLimitPerUser !== (string) $usageLimitPerUser)) {
        return 'Limit użyć na użytkowniczkę musi być liczbą całkowitą większą od zera.';
    }

    if ((!$partial || array_key_exists('valid_from', $payload)) && !empty($payload['valid_from']) && strtotime((string) $payload['valid_from']) === false) {
        return 'Data rozpoczęcia ważności kuponu jest nieprawidłowa.';
    }

    if ((!$partial || array_key_exists('valid_until', $payload)) && !empty($payload['valid_until']) && strtotime((string) $payload['valid_until']) === false) {
        return 'Data zakończenia ważności kuponu jest nieprawidłowa.';
    }

    if (!empty($payload['valid_from']) && !empty($payload['valid_until']) && strtotime((string) $payload['valid_from']) > strtotime((string) $payload['valid_until'])) {
        return 'Data rozpoczęcia ważności nie może być późniejsza niż data zakończenia.';
    }

    foreach ($includedProductIds as $productId) {
        requireProductRecord($productId);
    }

    foreach ($excludedProductIds as $productId) {
        requireProductRecord($productId);
    }

    if (array_intersect($includedProductIds, $excludedProductIds)) {
        return 'Ten sam produkt nie może być jednocześnie dozwolony i wykluczony.';
    }

    return null;
}

function buildBaseUrl(): string {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    return ($isHttps ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function validateUserPayload(array $payload, bool $partial = false): ?string {
    $email = strtolower(trim((string) ($payload['email'] ?? '')));
    $password = (string) ($payload['password'] ?? '');

    if ((!$partial || array_key_exists('email', $payload)) && $email === '') {
        return 'Adres e-mail jest wymagany.';
    }
    if ($password !== '' && strlen($password) < 6) {
        return 'Hasło musi mieć co najmniej 6 znaków.';
    }

    foreach (normalizePurchasedItems($payload['purchased_items'] ?? []) as $productId) {
        requireProductRecord($productId);
    }

    return null;
}

function validatePageSettingsInput(string $pageKey, array $payload): ?string {
    $defaults = getPageDefaults();
    if (!isset($defaults[$pageKey])) {
        return 'Nieznany klucz strony.';
    }

    $slug = $pageKey === 'home' ? '' : normalizeSlug((string) ($payload['slug'] ?? ''));
    if ($pageKey !== 'home' && $slug === '') {
        return 'Slug strony nie może być pusty.';
    }
    if (in_array($slug, PAGE_RESERVED_SLUGS, true)) {
        return 'Wybrany slug jest zarezerwowany przez system.';
    }

    global $db;
    $stmt = $db->prepare('SELECT page_key FROM page_settings WHERE slug = ? AND page_key != ?');
    $stmt->execute([$slug, $pageKey]);
    if ($stmt->fetch()) {
        return 'Ten slug jest już używany przez inną stronę.';
    }

    return null;
}

function getPageSettings(): array {
    global $db;
    $defaults = getPageDefaults();
    $rows = $db->query('SELECT * FROM page_settings ORDER BY page_name ASC')->fetchAll();
    $byKey = [];
    foreach ($rows as $row) {
        $byKey[$row['page_key']] = $row;
    }

    $pages = [];
    foreach ($defaults as $pageKey => $default) {
        $pages[] = array_merge($default, $byKey[$pageKey] ?? [], ['noindex' => !empty(($byKey[$pageKey] ?? $default)['noindex'])]);
    }

    return $pages;
}

function resolveMediaUploadDir(): string {
    $publicDir = realpath(__DIR__ . '/../public');
    $baseDir = $publicDir ?: dirname(__DIR__);
    $uploadDir = $baseDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'media';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    return $uploadDir;
}

function getMediaAssetPath(string $fileName): string {
    return resolveMediaUploadDir() . DIRECTORY_SEPARATOR . $fileName;
}

if ($method === 'GET' && $action === 'products') {
    try {
        $stmt = $db->query("SELECT p.*, CASE WHEN p.type = 'course' AND EXISTS (SELECT 1 FROM courses c JOIN modules m ON m.course_id = c.id JOIN lessons l ON l.module_id = m.id WHERE c.product_id = p.id) THEN 'ready' WHEN p.type = 'course' AND EXISTS (SELECT 1 FROM courses c WHERE c.product_id = p.id) THEN 'needs-lessons' WHEN p.type = 'course' THEN 'missing-course' WHEN COALESCE(TRIM(p.content_url), '') <> '' THEN 'ready' ELSE 'missing-content-url' END AS delivery_status, (SELECT COUNT(*) FROM courses c WHERE c.product_id = p.id) AS course_count, (SELECT COUNT(*) FROM modules m JOIN courses c ON c.id = m.course_id WHERE c.product_id = p.id) AS module_count, (SELECT COUNT(*) FROM lessons l JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id WHERE c.product_id = p.id) AS lesson_count FROM products p WHERE p.type != 'service' ORDER BY p.created_at DESC");
        sendJson(array_map('mapProduct', $stmt->fetchAll()));
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'products') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    try {
        $id = bin2hex(random_bytes(16));
        $stmt = $db->prepare('INSERT INTO products (id, title, slug, description, short_description, price, promotional_price, promotional_price_until, lowest_price_30_days, stripe_price_id, type, content_url, thumbnail_url, secondary_image_url, duration_label, long_description, benefits_json, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$id, $data['title'] ?? '', $data['slug'] ?? '', emptyToNull($data['description'] ?? null), emptyToNull($data['short_description'] ?? null), $data['price'] ?? 0, emptyToNull($data['promotional_price'] ?? null), emptyToNull($data['promotional_price_until'] ?? null), emptyToNull($data['lowest_price_30_days'] ?? null), emptyToNull($data['stripe_price_id'] ?? null), $data['type'] ?? '', emptyToNull($data['content_url'] ?? null), emptyToNull($data['thumbnail_url'] ?? null), emptyToNull($data['secondary_image_url'] ?? null), emptyToNull($data['duration_label'] ?? null), emptyToNull($data['long_description'] ?? null), serializeBenefitCards($data['benefits_json'] ?? null), serializeFaqItems($data['faq_json'] ?? null), emptyToNull($data['meta_title'] ?? null), emptyToNull($data['meta_desc'] ?? null), emptyToNull($data['meta_image_url'] ?? null), emptyToNull($data['canonical_url'] ?? null), parseBooleanFlag($data['noindex'] ?? false), parseBooleanFlag($data['is_published'] ?? true)]);
        sendJson(['id' => $id, 'message' => 'Produkt utworzony'], 201);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' && $action === 'products') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = (string) ($_GET['id'] ?? '');
    try {
        $stmt = $db->prepare('UPDATE products SET title = ?, slug = ?, description = ?, short_description = ?, price = ?, promotional_price = ?, promotional_price_until = ?, lowest_price_30_days = ?, stripe_price_id = ?, type = ?, content_url = ?, thumbnail_url = ?, secondary_image_url = ?, duration_label = ?, long_description = ?, benefits_json = ?, faq_json = ?, meta_title = ?, meta_desc = ?, meta_image_url = ?, canonical_url = ?, noindex = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$data['title'] ?? '', $data['slug'] ?? '', emptyToNull($data['description'] ?? null), emptyToNull($data['short_description'] ?? null), $data['price'] ?? 0, emptyToNull($data['promotional_price'] ?? null), emptyToNull($data['promotional_price_until'] ?? null), emptyToNull($data['lowest_price_30_days'] ?? null), emptyToNull($data['stripe_price_id'] ?? null), $data['type'] ?? '', emptyToNull($data['content_url'] ?? null), emptyToNull($data['thumbnail_url'] ?? null), emptyToNull($data['secondary_image_url'] ?? null), emptyToNull($data['duration_label'] ?? null), emptyToNull($data['long_description'] ?? null), serializeBenefitCards($data['benefits_json'] ?? null), serializeFaqItems($data['faq_json'] ?? null), emptyToNull($data['meta_title'] ?? null), emptyToNull($data['meta_desc'] ?? null), emptyToNull($data['meta_image_url'] ?? null), emptyToNull($data['canonical_url'] ?? null), parseBooleanFlag($data['noindex'] ?? false), parseBooleanFlag($data['is_published'] ?? true), $id]);
        sendJson(['message' => 'Produkt zaktualizowany']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE' && $action === 'products') {
    $id = (string) ($_GET['id'] ?? '');
    try {
        $stmt = $db->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);
        sendJson(['message' => 'Produkt usunięty']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'orders') {
    try {
        $orderId = (string) ($_GET['id'] ?? '');
        if ($orderId !== '') {
            $stmt = $db->prepare('SELECT orders.*, products.title AS product_title FROM orders LEFT JOIN products ON products.id = orders.product_id WHERE orders.id = ?');
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            if (!$order) {
                sendJson(['error' => 'Nie znaleziono zamówienia.'], 404);
            }
            sendJson($order);
        }

        $stmt = $db->query('SELECT orders.*, products.title AS product_title FROM orders LEFT JOIN products ON products.id = orders.product_id ORDER BY orders.created_at DESC');
        sendJson($stmt->fetchAll());
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' && $action === 'orders') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $orderId = (string) ($_GET['id'] ?? '');
    $allowedStatuses = ['completed', 'pending_bank_transfer', 'manual', 'pending', 'failed', 'refunded', 'cancelled'];

    $stmtExisting = $db->prepare('SELECT * FROM orders WHERE id = ?');
    $stmtExisting->execute([$orderId]);
    $existingOrder = $stmtExisting->fetch();
    if (!$existingOrder) {
        sendJson(['error' => 'Nie znaleziono zamówienia.'], 404);
    }

    $customerEmail = strtolower(trim((string) ($data['customer_email'] ?? '')));
    $productId = trim((string) ($data['product_id'] ?? ''));
    $amountTotal = $data['amount_total'] ?? null;
    $status = trim((string) ($data['status'] ?? ''));

    if ($customerEmail === '' || strpos($customerEmail, '@') === false) {
        sendJson(['error' => 'Podaj prawidłowy adres e-mail klientki.'], 400);
    }
    if ($productId === '') {
        sendJson(['error' => 'Wybierz produkt przypisany do zamówienia.'], 400);
    }
    if (!is_numeric($amountTotal) || (float) $amountTotal < 0) {
        sendJson(['error' => 'Kwota zamówienia musi być liczbą nieujemną.'], 400);
    }
    if (!in_array($status, $allowedStatuses, true)) {
        sendJson(['error' => 'Wybrano nieprawidłowy status zamówienia.'], 400);
    }

    requireProductRecord($productId);

    try {
        $stmtUpdate = $db->prepare('UPDATE orders SET customer_email = ?, product_id = ?, amount_total = ?, status = ? WHERE id = ?');
        $stmtUpdate->execute([$customerEmail, $productId, (float) $amountTotal, $status, $orderId]);

        $stmtOrder = $db->prepare('SELECT orders.*, products.title AS product_title FROM orders LEFT JOIN products ON products.id = orders.product_id WHERE orders.id = ?');
        $stmtOrder->execute([$orderId]);
        sendJson(['message' => 'Zamówienie zostało zaktualizowane.', 'order' => $stmtOrder->fetch()]);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE' && $action === 'orders') {
    $orderId = (string) ($_GET['id'] ?? '');
    try {
        $stmt = $db->prepare('DELETE FROM orders WHERE id = ?');
        $stmt->execute([$orderId]);
        if ($stmt->rowCount() === 0) {
            sendJson(['error' => 'Nie znaleziono zamówienia.'], 404);
        }
        sendJson(['message' => 'Zamówienie zostało usunięte.']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'users') {
    try {
        $userId = (string) ($_GET['id'] ?? '');
        if ($userId !== '') {
            $user = mapUser(requireUserRecord($userId));
            $productRows = $db->query("SELECT id, title, type, slug FROM products WHERE type != 'service' ORDER BY title COLLATE NOCASE ASC")->fetchAll();
            $purchasedProducts = array_values(array_filter(array_map(function ($productId) use ($productRows) {
                foreach ($productRows as $product) {
                    if (($product['id'] ?? null) === $productId) {
                        return $product;
                    }
                }
                return null;
            }, $user['purchased_items'])));

            $stmtOrders = $db->prepare('SELECT orders.*, products.title AS product_title FROM orders LEFT JOIN products ON products.id = orders.product_id WHERE lower(orders.customer_email) = lower(?) ORDER BY orders.created_at DESC');
            $stmtOrders->execute([$user['email']]);

            sendJson([
                'user' => $user,
                'purchased_products' => $purchasedProducts,
                'orders' => $stmtOrders->fetchAll(),
            ]);
        }

        $users = $db->query('SELECT * FROM users ORDER BY is_admin DESC, created_at DESC')->fetchAll();
        sendJson(array_map('mapUser', $users));
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'user-reset-password-link') {
    $userId = (string) ($_GET['id'] ?? '');
    $user = requireUserRecord($userId);
    if (empty($user['email'])) {
        sendJson(['error' => 'Użytkowniczka nie ma przypisanego adresu e-mail.'], 400);
    }

    try {
        $resetToken = bin2hex(random_bytes(32));
        $expiresAt = gmdate('c', time() + 3600);

        $stmt = $db->prepare('UPDATE users SET reset_token = ?, reset_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$resetToken, $expiresAt, $userId]);

        sendJson([
            'message' => 'Link resetu hasła został wygenerowany.',
            'reset_url' => buildBaseUrl() . '/resetowanie-hasla?token=' . $resetToken,
            'expires_at' => $expiresAt,
        ]);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'users') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $validationError = validateUserPayload($data, false);
    if ($validationError) {
        sendJson(['error' => $validationError], 400);
    }

    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendJson(['error' => 'Użytkowniczka z tym adresem e-mail już istnieje.'], 409);
    }

    try {
        $userId = bin2hex(random_bytes(16));
        $passwordHash = !empty($data['password']) ? password_hash((string) $data['password'], PASSWORD_BCRYPT, ['cost' => 12]) : null;
        $stmtInsert = $db->prepare('INSERT INTO users (id, first_name, last_name, email, password_hash, purchased_items, is_admin, email_confirmed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmtInsert->execute([$userId, emptyToNull($data['first_name'] ?? null), emptyToNull($data['last_name'] ?? null), $email, $passwordHash, serializePurchasedItems($data['purchased_items'] ?? []), parseBooleanFlag($data['is_admin'] ?? false), parseBooleanFlag($data['email_confirmed'] ?? true)]);
        sendJson(['message' => 'Użytkowniczka została utworzona.', 'user' => mapUser(requireUserRecord($userId))], 201);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' && $action === 'users') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $userId = (string) ($_GET['id'] ?? '');
    $existingUser = requireUserRecord($userId);
    $validationError = validateUserPayload($data, true);
    if ($validationError) {
        sendJson(['error' => $validationError], 400);
    }

    $email = array_key_exists('email', $data) ? strtolower(trim((string) $data['email'])) : $existingUser['email'];
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
    $stmt->execute([$email, $userId]);
    if ($stmt->fetch()) {
        sendJson(['error' => 'Inna użytkowniczka używa już tego adresu e-mail.'], 409);
    }

    $isAdmin = array_key_exists('is_admin', $data) ? parseBooleanFlag($data['is_admin']) : (int) $existingUser['is_admin'];
    if (!empty($existingUser['is_admin']) && !$isAdmin) {
        $adminCount = (int) $db->query('SELECT COUNT(*) FROM users WHERE is_admin = 1')->fetchColumn();
        if ($adminCount <= 1) {
            sendJson(['error' => 'Nie można odebrać uprawnień ostatniej administratorce.'], 400);
        }
    }

    if ($currentUser['id'] === $userId && !$isAdmin) {
        sendJson(['error' => 'Nie możesz odebrać sobie uprawnień administratora.'], 400);
    }

    try {
        $passwordHash = !empty($data['password']) ? password_hash((string) $data['password'], PASSWORD_BCRYPT, ['cost' => 12]) : $existingUser['password_hash'];
        $stmtUpdate = $db->prepare('UPDATE users SET first_name = ?, last_name = ?, email = ?, password_hash = ?, purchased_items = ?, is_admin = ?, email_confirmed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([array_key_exists('first_name', $data) ? emptyToNull($data['first_name']) : $existingUser['first_name'], array_key_exists('last_name', $data) ? emptyToNull($data['last_name']) : $existingUser['last_name'], $email, $passwordHash, array_key_exists('purchased_items', $data) ? serializePurchasedItems($data['purchased_items']) : $existingUser['purchased_items'], $isAdmin, array_key_exists('email_confirmed', $data) ? parseBooleanFlag($data['email_confirmed']) : (int) $existingUser['email_confirmed'], $userId]);
        sendJson(['message' => 'Użytkowniczka została zaktualizowana.', 'user' => mapUser(requireUserRecord($userId))]);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE' && $action === 'users') {
    $userId = (string) ($_GET['id'] ?? '');
    $existingUser = requireUserRecord($userId);
    if ($currentUser['id'] === $userId) {
        sendJson(['error' => 'Nie możesz usunąć aktualnie zalogowanej administratorki.'], 400);
    }
    if (!empty($existingUser['is_admin'])) {
        $adminCount = (int) $db->query('SELECT COUNT(*) FROM users WHERE is_admin = 1')->fetchColumn();
        if ($adminCount <= 1) {
            sendJson(['error' => 'Nie można usunąć ostatniej administratorki.'], 400);
        }
    }

    try {
        $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        sendJson(['message' => 'Użytkowniczka została usunięta.']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'grant-access') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $email = strtolower(trim((string) ($data['email'] ?? '')));
    $productId = (string) ($data['product_id'] ?? '');
    if ($email === '' || $productId === '') {
        sendJson(['error' => 'Brak emaila lub ID produktu'], 400);
    }

    requireProductRecord($productId);
    try {
        $stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            $userId = bin2hex(random_bytes(16));
            $stmtInsert = $db->prepare('INSERT INTO users (id, email, password_hash, purchased_items, email_confirmed, created_at, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
            $stmtInsert->execute([$userId, $email, null, $productId]);
            $user = requireUserRecord($userId);
        } else {
            $purchases = normalizePurchasedItems($user['purchased_items'] ?? null);
            if (!in_array($productId, $purchases, true)) {
                $purchases[] = $productId;
                $stmtUpdate = $db->prepare('UPDATE users SET purchased_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
                $stmtUpdate->execute([implode(',', $purchases), $user['id']]);
            }
        }

        $orderId = 'man_' . bin2hex(random_bytes(8));
        $stmtOrder = $db->prepare('INSERT INTO orders (id, customer_email, product_id, amount_total, status) VALUES (?, ?, ?, ?, ?)');
        $stmtOrder->execute([$orderId, $email, $productId, 0, 'manual']);

        sendJson(['message' => 'Dostęp został nadany.', 'user' => mapUser(requireUserRecord($user['id'] ?? $userId))]);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'settings') {
    try {
        $rows = $db->query('SELECT key, value FROM settings ORDER BY key ASC')->fetchAll();
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['key']] = $row['value'] ?? '';
        }
        sendJson($settings);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'settings') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    try {
        $stmt = $db->prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');
        foreach ($data as $key => $value) {
            $stmt->execute([(string) $key, $value == null ? '' : (string) $value]);
        }
        sendJson(['message' => 'Ustawienia zapisane']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'pages') {
    sendJson(getPageSettings());
}

if ($method === 'PUT' && $action === 'pages') {
    $pageKey = (string) ($_GET['pageKey'] ?? '');
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $defaults = getPageDefaults();
    if (!isset($defaults[$pageKey])) {
        sendJson(['error' => 'Nie znaleziono takiej strony.'], 404);
    }

    $validationError = validatePageSettingsInput($pageKey, $data);
    if ($validationError) {
        sendJson(['error' => $validationError], 400);
    }

    try {
        $stmt = $db->prepare('INSERT INTO page_settings (page_key, page_name, slug, title, featured_image_url, meta_title, meta_desc, meta_image_url, canonical_url, noindex, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(page_key) DO UPDATE SET page_name = excluded.page_name, slug = excluded.slug, title = excluded.title, featured_image_url = excluded.featured_image_url, meta_title = excluded.meta_title, meta_desc = excluded.meta_desc, meta_image_url = excluded.meta_image_url, canonical_url = excluded.canonical_url, noindex = excluded.noindex, updated_at = CURRENT_TIMESTAMP');
        $default = $defaults[$pageKey];
        $stmt->execute([$pageKey, $default['page_name'], $pageKey === 'home' ? '' : normalizeSlug((string) ($data['slug'] ?? '')), emptyToNull($data['title'] ?? null) ?: $default['title'], emptyToNull($data['featured_image_url'] ?? null), emptyToNull($data['meta_title'] ?? null), emptyToNull($data['meta_desc'] ?? null), emptyToNull($data['meta_image_url'] ?? null), emptyToNull($data['canonical_url'] ?? null), parseBooleanFlag($data['noindex'] ?? false)]);
        sendJson(['message' => 'Ustawienia strony zapisane']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'coupons') {
    try {
        $coupons = $db->query('SELECT * FROM coupons ORDER BY is_active DESC, created_at DESC')->fetchAll();
        sendJson(array_map('mapCoupon', $coupons));
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'coupons') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $validationError = validateCouponPayload($data, false);
    if ($validationError) {
        sendJson(['error' => $validationError], 400);
    }

    $code = strtoupper(trim((string) $data['code']));
    $stmt = $db->prepare('SELECT id FROM coupons WHERE code = ?');
    $stmt->execute([$code]);
    if ($stmt->fetch()) {
        sendJson(['error' => 'Kupon z takim kodem już istnieje.'], 409);
    }

    try {
        $couponId = bin2hex(random_bytes(16));
        $stmtInsert = $db->prepare('INSERT INTO coupons (id, code, discount_type, value, description, is_active, valid_from, valid_until, minimum_spend, maximum_spend, usage_limit, usage_limit_per_user, included_product_ids, excluded_product_ids, allowed_emails, exclude_sale_items, times_used, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmtInsert->execute([$couponId, $code, strtolower(trim((string) $data['discount_type'])), (float) $data['value'], emptyToNull($data['description'] ?? null), array_key_exists('is_active', $data) ? parseBooleanFlag($data['is_active']) : 1, emptyToNull($data['valid_from'] ?? null), emptyToNull($data['valid_until'] ?? null), parseNullableFloat($data['minimum_spend'] ?? null), parseNullableFloat($data['maximum_spend'] ?? null), parseNullableInteger($data['usage_limit'] ?? null), parseNullableInteger($data['usage_limit_per_user'] ?? null), serializeDelimitedText($data['included_product_ids'] ?? null), serializeDelimitedText($data['excluded_product_ids'] ?? null), serializeDelimitedText($data['allowed_emails'] ?? null, true), parseBooleanFlag($data['exclude_sale_items'] ?? false)]);
        $stmtCoupon = $db->prepare('SELECT * FROM coupons WHERE id = ?');
        $stmtCoupon->execute([$couponId]);
        sendJson(['message' => 'Kupon został utworzony.', 'coupon' => mapCoupon($stmtCoupon->fetch())], 201);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' && $action === 'coupons') {
    $couponId = (string) ($_GET['id'] ?? '');
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $validationError = validateCouponPayload($data, true);
    if ($validationError) {
        sendJson(['error' => $validationError], 400);
    }

    $stmt = $db->prepare('SELECT * FROM coupons WHERE id = ?');
    $stmt->execute([$couponId]);
    $coupon = $stmt->fetch();
    if (!$coupon) {
        sendJson(['error' => 'Nie znaleziono kuponu.'], 404);
    }

    $nextCode = array_key_exists('code', $data) ? strtoupper(trim((string) $data['code'])) : $coupon['code'];
    $stmtDuplicate = $db->prepare('SELECT id FROM coupons WHERE code = ? AND id != ?');
    $stmtDuplicate->execute([$nextCode, $couponId]);
    if ($stmtDuplicate->fetch()) {
        sendJson(['error' => 'Inny kupon używa już tego kodu.'], 409);
    }

    try {
        $stmtUpdate = $db->prepare('UPDATE coupons SET code = ?, discount_type = ?, value = ?, description = ?, is_active = ?, valid_from = ?, valid_until = ?, minimum_spend = ?, maximum_spend = ?, usage_limit = ?, usage_limit_per_user = ?, included_product_ids = ?, excluded_product_ids = ?, allowed_emails = ?, exclude_sale_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([
            $nextCode,
            array_key_exists('discount_type', $data) ? strtolower(trim((string) $data['discount_type'])) : $coupon['discount_type'],
            array_key_exists('value', $data) ? (float) $data['value'] : (float) $coupon['value'],
            array_key_exists('description', $data) ? emptyToNull($data['description']) : $coupon['description'],
            array_key_exists('is_active', $data) ? parseBooleanFlag($data['is_active']) : (int) $coupon['is_active'],
            array_key_exists('valid_from', $data) ? emptyToNull($data['valid_from']) : $coupon['valid_from'],
            array_key_exists('valid_until', $data) ? emptyToNull($data['valid_until']) : $coupon['valid_until'],
            array_key_exists('minimum_spend', $data) ? parseNullableFloat($data['minimum_spend']) : parseNullableFloat($coupon['minimum_spend']),
            array_key_exists('maximum_spend', $data) ? parseNullableFloat($data['maximum_spend']) : parseNullableFloat($coupon['maximum_spend']),
            array_key_exists('usage_limit', $data) ? parseNullableInteger($data['usage_limit']) : parseNullableInteger($coupon['usage_limit']),
            array_key_exists('usage_limit_per_user', $data) ? parseNullableInteger($data['usage_limit_per_user']) : parseNullableInteger($coupon['usage_limit_per_user']),
            array_key_exists('included_product_ids', $data) ? serializeDelimitedText($data['included_product_ids']) : $coupon['included_product_ids'],
            array_key_exists('excluded_product_ids', $data) ? serializeDelimitedText($data['excluded_product_ids']) : $coupon['excluded_product_ids'],
            array_key_exists('allowed_emails', $data) ? serializeDelimitedText($data['allowed_emails'], true) : $coupon['allowed_emails'],
            array_key_exists('exclude_sale_items', $data) ? parseBooleanFlag($data['exclude_sale_items']) : (int) $coupon['exclude_sale_items'],
            $couponId,
        ]);

        $stmtCoupon = $db->prepare('SELECT * FROM coupons WHERE id = ?');
        $stmtCoupon->execute([$couponId]);
        sendJson(['message' => 'Kupon został zaktualizowany.', 'coupon' => mapCoupon($stmtCoupon->fetch())]);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE' && $action === 'coupons') {
    $couponId = (string) ($_GET['id'] ?? '');
    try {
        $stmt = $db->prepare('DELETE FROM coupons WHERE id = ?');
        $stmt->execute([$couponId]);
        if ($stmt->rowCount() === 0) {
            sendJson(['error' => 'Nie znaleziono kuponu.'], 404);
        }
        sendJson(['message' => 'Kupon został usunięty.']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'media') {
    try {
        $media = $db->query('SELECT * FROM media_assets ORDER BY created_at DESC')->fetchAll();
        sendJson($media);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'media-upload') {
    if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
        sendJson(['error' => 'Nie przesłano pliku.'], 400);
    }

    $mimeType = mime_content_type($_FILES['file']['tmp_name']) ?: ($_FILES['file']['type'] ?? '');
    if (strpos($mimeType, 'image/') !== 0 && $mimeType !== 'image/x-icon' && $mimeType !== 'image/vnd.microsoft.icon' && $mimeType !== 'application/ico') {
        sendJson(['error' => 'Do biblioteki mediów można przesyłać tylko obrazy i ikony.'], 400);
    }

    $extension = strtolower(pathinfo((string) $_FILES['file']['name'], PATHINFO_EXTENSION));
    $fileName = time() . '-' . bin2hex(random_bytes(8)) . ($extension ? '.' . $extension : '');
    $destination = getMediaAssetPath($fileName);

    if (!move_uploaded_file($_FILES['file']['tmp_name'], $destination)) {
        sendJson(['error' => 'Nie udało się zapisać pliku.'], 500);
    }

    try {
        $mediaId = bin2hex(random_bytes(16));
        $publicUrl = '/uploads/media/' . $fileName;
        $stmt = $db->prepare('INSERT INTO media_assets (id, file_name, original_name, mime_type, size_bytes, width, height, alt_text, public_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmt->execute([$mediaId, $fileName, $_FILES['file']['name'], $mimeType, (int) ($_FILES['file']['size'] ?? 0), null, null, emptyToNull($_POST['alt_text'] ?? null), $publicUrl]);
        $stmtMedia = $db->prepare('SELECT * FROM media_assets WHERE id = ?');
        $stmtMedia->execute([$mediaId]);
        sendJson(['message' => 'Plik został dodany do biblioteki mediów.', 'media' => $stmtMedia->fetch()], 201);
    } catch (Exception $e) {
        @unlink($destination);
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE' && $action === 'media') {
    $mediaId = (string) ($_GET['id'] ?? '');
    try {
        $stmt = $db->prepare('SELECT * FROM media_assets WHERE id = ?');
        $stmt->execute([$mediaId]);
        $media = $stmt->fetch();
        if (!$media) {
            sendJson(['error' => 'Nie znaleziono medium.'], 404);
        }

        $stmtDelete = $db->prepare('DELETE FROM media_assets WHERE id = ?');
        $stmtDelete->execute([$mediaId]);
        @unlink(getMediaAssetPath((string) $media['file_name']));
        sendJson(['message' => 'Medium zostało usunięte.']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'sync-media') {
    if (empty($currentUser['is_admin'])) {
        sendJson(['error' => 'Brak uprawnień'], 403);
    }

    $publicImagesDir = realpath(__DIR__ . '/../images') ?: realpath(__DIR__ . '/../public/images');
    if (!$publicImagesDir) {
        sendJson(['error' => 'Nie znaleziono katalogu images: ' . __DIR__], 500);
    }

    $images = array_merge(glob($publicImagesDir . '/*.png') ?: [], glob($publicImagesDir . '/*/*.webp') ?: []);
    $favicon = realpath(__DIR__ . '/../favicon.ico') ?: realpath(__DIR__ . '/../public/favicon.ico');
    if ($favicon) {
        $images[] = $favicon;
    }

    $added = 0;
    foreach ($images as $path) {
        if (!file_exists($path)) continue;

        $filename = basename($path);
        // build correct public url
        // Jeśli plik jest w /images/optimized to public_url ma być /images/optimized/nazwa
        $isOptimized = strpos($path, 'optimized') !== false;
        if ($filename === 'favicon.ico') {
            $public_url = '/favicon.ico';
        } elseif ($isOptimized) {
            $public_url = '/images/optimized/' . $filename;
        } else {
            $public_url = '/images/' . $filename;
        }

        $stmt = $db->prepare("SELECT id FROM media_assets WHERE public_url = ?");
        $stmt->execute([$public_url]);
        if ($stmt->fetch()) {
            continue; 
        }
        
        $mediaId = bin2hex(random_bytes(16));
        $mimeType = mime_content_type($path);
        $size = filesize($path);
        $alt = 'Zdjęcie ' . str_replace(['_', '.png', '.ico', '.webp'], [' ', '', '', ''], $filename);
        
        $stmtIns = $db->prepare('INSERT INTO media_assets (id, file_name, original_name, mime_type, size_bytes, width, height, alt_text, public_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmtIns->execute([
            $mediaId, $filename, $filename, $mimeType ?: 'image/png', $size, null, null, $alt, $public_url
        ]);
        $added++;
    }

    sendJson(['message' => 'Zsynchronizowano', 'added_count' => $added]);
}

sendJson(['error' => 'Unknown action'], 400);