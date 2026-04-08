<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';
require_once __DIR__ . '/mailer.php';

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

const PUBLIC_CONTENT_SETTING_KEYS = [
    'favicon_url',
    'seo_default_title',
    'seo_default_desc',
    'seo_default_social_image',
    'marketing_head_scripts',
    'marketing_body_scripts',
    'legal_privacy_content',
    'legal_terms_content',
];

const INTERNAL_PUBLISH_SETTING_PREFIX = 'site_publish_';
const GITHUB_PUBLISH_REPO_OWNER = 'Webisko';
const GITHUB_PUBLISH_REPO_NAME = 'natalia-potocka';
const GITHUB_PUBLISH_WORKFLOW_FILE = 'publish-production.yml';
const GITHUB_PUBLISH_BRANCH = 'main';
const GITHUB_PUBLISH_EVENT_TYPE = 'content_publish';

function getEnvironmentValue(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value !== false && $value !== null && trim((string) $value) !== '') {
        return trim((string) $value);
    }

    $serverValue = $_SERVER[$key] ?? $_ENV[$key] ?? null;
    if ($serverValue !== null && trim((string) $serverValue) !== '') {
        return trim((string) $serverValue);
    }

    return $default;
}

function getGithubPublishToken(): string
{
    $environmentToken = getEnvironmentValue('GITHUB_PUBLISH_TOKEN');
    if ($environmentToken !== '') {
        return $environmentToken;
    }

    return trim((string) getSettingValue('github_publish_token'));
}

function normalizeSettingStoredValue($value): string
{
    return $value == null ? '' : (string) $value;
}

function shouldExposeSettingKey(string $key): bool
{
    return !str_starts_with($key, INTERNAL_PUBLISH_SETTING_PREFIX);
}

function canWriteSettingKey(string $key): bool
{
    return !str_starts_with($key, INTERNAL_PUBLISH_SETTING_PREFIX);
}

function getSettingValue(string $key, string $default = ''): string
{
    global $db;

    $stmt = $db->prepare('SELECT value FROM settings WHERE key = ? LIMIT 1');
    $stmt->execute([$key]);
    $value = $stmt->fetchColumn();

    return $value === false || $value === null ? $default : (string) $value;
}

function getSettingsMap(array $keys = []): array
{
    global $db;

    if (!$keys) {
        $rows = $db->query('SELECT key, value FROM settings ORDER BY key ASC')->fetchAll();
    } else {
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $stmt = $db->prepare("SELECT key, value FROM settings WHERE key IN ($placeholders)");
        $stmt->execute(array_values($keys));
        $rows = $stmt->fetchAll();
    }

    $settings = [];
    foreach ($rows as $row) {
        $settings[(string) $row['key']] = (string) ($row['value'] ?? '');
    }

    return $settings;
}

function saveSettingsMap(array $settings): void
{
    global $db;

    if (!$settings) {
        return;
    }

    $stmt = $db->prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');
    foreach ($settings as $key => $value) {
        $stmt->execute([(string) $key, normalizeSettingStoredValue($value)]);
    }
}

function translatePublishSource(string $source): string
{
    return match ($source) {
        'products' => 'produkty',
        'pages' => 'strony',
        'media' => 'media',
        'settings' => 'ustawienia globalne',
        default => 'panel administracyjny',
    };
}

function markPublicContentDirty(string $source, ?string $changedBy = null): array
{
    $current = getSettingsMap([
        'site_publish_content_version',
        'site_publish_status',
        'site_publish_requested_version',
    ]);

    $nextVersion = ((int) ($current['site_publish_content_version'] ?? 0)) + 1;
    $currentStatus = trim((string) ($current['site_publish_status'] ?? ''));
    $status = in_array($currentStatus, ['requested', 'running'], true) ? $currentStatus : 'pending';
    $timestamp = gmdate('c');
    $message = in_array($currentStatus, ['requested', 'running'], true)
        ? 'Trwa publikacja wcześniejszej wersji. Po jej zakończeniu pozostaną jeszcze nowsze zmiany do publikacji.'
        : 'Są publiczne zmiany oczekujące na publikację.';

    saveSettingsMap([
        'site_publish_content_version' => (string) $nextVersion,
        'site_publish_status' => $status,
        'site_publish_last_change_at' => $timestamp,
        'site_publish_last_change_source' => $source,
        'site_publish_last_change_by' => trim((string) ($changedBy ?? '')),
        'site_publish_last_message' => $message,
    ]);

    return [
        'content_version' => $nextVersion,
        'status' => $status,
    ];
}

function publicSettingsChanged(array $incomingSettings): bool
{
    $relevantKeys = array_values(array_intersect(array_keys($incomingSettings), PUBLIC_CONTENT_SETTING_KEYS));
    if (!$relevantKeys) {
        return false;
    }

    $current = getSettingsMap($relevantKeys);
    foreach ($relevantKeys as $key) {
        if (normalizeSettingStoredValue($incomingSettings[$key] ?? '') !== (string) ($current[$key] ?? '')) {
            return true;
        }
    }

    return false;
}

function isStorefrontProduct(array $product): bool
{
    $type = trim((string) ($product['type'] ?? ''));
    $isPublished = parseBooleanFlag($product['is_published'] ?? false) === 1;

    return $isPublished && in_array($type, ['video', 'audio', 'course'], true);
}

function shouldMarkPublicContentDirtyForProductChange(?array $beforeProduct, ?array $afterProduct = null): bool
{
    return ($beforeProduct !== null && isStorefrontProduct($beforeProduct))
        || ($afterProduct !== null && isStorefrontProduct($afterProduct));
}

function githubApiRequest(string $method, string $url, string $token, ?array $payload = null): array
{
    $headers = [
        'Accept: application/vnd.github+json',
        'Authorization: Bearer ' . $token,
        'User-Agent: natalia-potocka-admin-publisher',
        'X-GitHub-Api-Version: 2022-11-28',
    ];

    $options = [
        'http' => [
            'method' => strtoupper($method),
            'header' => implode("\r\n", array_merge($headers, ['Content-Type: application/json'])),
            'ignore_errors' => true,
            'timeout' => 20,
        ],
    ];

    if ($payload !== null) {
        $options['http']['content'] = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    $context = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);
    $responseHeaders = $http_response_header ?? [];
    $statusLine = $responseHeaders[0] ?? '';
    preg_match('/HTTP\/\S+\s+(\d{3})/', $statusLine, $matches);
    $statusCode = (int) ($matches[1] ?? 0);

    $decoded = null;
    if ($result !== false && trim($result) !== '') {
        $decoded = json_decode($result, true);
    }

    if ($statusCode < 200 || $statusCode >= 300) {
        $message = is_array($decoded) ? trim((string) ($decoded['message'] ?? '')) : '';
        if ($message === '') {
            $message = 'GitHub API zwróciło kod ' . ($statusCode ?: 'nieznany') . '.';
        }
        throw new RuntimeException($message, $statusCode ?: 500);
    }

    return is_array($decoded) ? $decoded : [];
}

function findGithubPublishRun(string $token, string $requestId): ?array
{
    if ($requestId === '') {
        return null;
    }

    $url = sprintf(
        'https://api.github.com/repos/%s/%s/actions/workflows/%s/runs?branch=%s&per_page=20',
        rawurlencode(GITHUB_PUBLISH_REPO_OWNER),
        rawurlencode(GITHUB_PUBLISH_REPO_NAME),
        rawurlencode(GITHUB_PUBLISH_WORKFLOW_FILE),
        rawurlencode(GITHUB_PUBLISH_BRANCH)
    );

    $response = githubApiRequest('GET', $url, $token);
    foreach ((array) ($response['workflow_runs'] ?? []) as $run) {
        $displayTitle = (string) ($run['display_title'] ?? '');
        $name = (string) ($run['name'] ?? '');
        if (str_contains($displayTitle, $requestId) || str_contains($name, $requestId)) {
            return $run;
        }
    }

    return null;
}

function buildPublishStatusPayload(bool $syncWithGithub = true): array
{
    $settings = getSettingsMap([
        'site_publish_content_version',
        'site_publish_published_version',
        'site_publish_requested_version',
        'site_publish_status',
        'site_publish_request_id',
        'site_publish_requested_at',
        'site_publish_finished_at',
        'site_publish_last_change_at',
        'site_publish_last_change_source',
        'site_publish_last_change_by',
        'site_publish_last_message',
        'site_publish_last_triggered_by',
        'site_publish_last_run_url',
    ]);

    $status = trim((string) ($settings['site_publish_status'] ?? '')) ?: 'idle';
    $contentVersion = (int) ($settings['site_publish_content_version'] ?? 0);
    $publishedVersion = (int) ($settings['site_publish_published_version'] ?? 0);
    $requestedVersion = (int) ($settings['site_publish_requested_version'] ?? 0);
    $requestId = trim((string) ($settings['site_publish_request_id'] ?? ''));
    $githubToken = getGithubPublishToken();
    $lastMessage = trim((string) ($settings['site_publish_last_message'] ?? ''));
    $lastRunUrl = trim((string) ($settings['site_publish_last_run_url'] ?? ''));
    $finishedAt = trim((string) ($settings['site_publish_finished_at'] ?? ''));

    if ($syncWithGithub && $githubToken !== '' && $requestId !== '' && in_array($status, ['requested', 'running'], true)) {
        try {
            $run = findGithubPublishRun($githubToken, $requestId);
            if ($run) {
                $runStatus = trim((string) ($run['status'] ?? ''));
                $runConclusion = trim((string) ($run['conclusion'] ?? ''));
                $runUrl = trim((string) ($run['html_url'] ?? ''));
                $runUpdatedAt = trim((string) ($run['updated_at'] ?? '')) ?: gmdate('c');
                $lastRunUrl = $runUrl !== '' ? $runUrl : $lastRunUrl;

                if ($runStatus === 'completed') {
                    if ($runConclusion === 'success') {
                        $publishedVersion = max($publishedVersion, $requestedVersion);
                        $status = $contentVersion > $publishedVersion ? 'pending' : 'succeeded';
                        $lastMessage = $contentVersion > $publishedVersion
                            ? 'Publikacja zakończyła się poprawnie, ale od tego czasu pojawiły się już nowsze zmiany.'
                            : 'Publikacja zakończyła się powodzeniem.';
                    } else {
                        $status = 'failed';
                        $lastMessage = 'Publikacja zakończyła się błędem w GitHub Actions.';
                    }

                    $finishedAt = $runUpdatedAt;
                    saveSettingsMap([
                        'site_publish_status' => $status,
                        'site_publish_published_version' => (string) $publishedVersion,
                        'site_publish_finished_at' => $finishedAt,
                        'site_publish_last_message' => $lastMessage,
                        'site_publish_last_run_url' => $lastRunUrl,
                    ]);
                } else {
                    $status = $runStatus === 'queued' ? 'requested' : 'running';
                    saveSettingsMap([
                        'site_publish_status' => $status,
                        'site_publish_last_run_url' => $lastRunUrl,
                    ]);
                }
            }
        } catch (Throwable $exception) {
            $lastMessage = 'Nie udało się odczytać statusu publikacji z GitHub Actions: ' . $exception->getMessage();
        }
    }

    $hasPendingChanges = $contentVersion > $publishedVersion;
    if (!$hasPendingChanges && $status === 'pending') {
        $status = 'succeeded';
    }

    return [
        'status' => $status,
        'has_pending_changes' => $hasPendingChanges,
        'content_version' => $contentVersion,
        'published_version' => $publishedVersion,
        'requested_version' => $requestedVersion,
        'request_id' => $requestId,
        'requested_at' => trim((string) ($settings['site_publish_requested_at'] ?? '')),
        'finished_at' => $finishedAt,
        'last_change_at' => trim((string) ($settings['site_publish_last_change_at'] ?? '')),
        'last_change_source' => trim((string) ($settings['site_publish_last_change_source'] ?? '')),
        'last_change_source_label' => translatePublishSource(trim((string) ($settings['site_publish_last_change_source'] ?? ''))),
        'last_change_by' => trim((string) ($settings['site_publish_last_change_by'] ?? '')),
        'last_message' => $lastMessage,
        'last_triggered_by' => trim((string) ($settings['site_publish_last_triggered_by'] ?? '')),
        'last_run_url' => $lastRunUrl,
        'github_token_configured' => $githubToken !== '',
        'repository' => GITHUB_PUBLISH_REPO_OWNER . '/' . GITHUB_PUBLISH_REPO_NAME,
        'workflow' => GITHUB_PUBLISH_WORKFLOW_FILE,
    ];
}

function getPageDefaults(): array
{
    return [
        'home' => ['page_key' => 'home', 'page_name' => 'Strona główna', 'slug' => '', 'title' => 'Natalia Potocka', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Natalia Potocka', 'meta_desc' => 'Wsparcie okołoporodowe, konsultacje, szkolenia i produkty cyfrowe Natalii Potockiej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'about' => ['page_key' => 'about', 'page_name' => 'O mnie', 'slug' => 'o-mnie', 'title' => 'O mnie', 'featured_image_url' => '/images/about_doula.png', 'meta_title' => 'O mnie | Natalia Potocka', 'meta_desc' => 'Poznaj podejście i doświadczenie Natalii Potockiej.', 'meta_image_url' => '/images/about_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'contact' => ['page_key' => 'contact', 'page_name' => 'Kontakt', 'slug' => 'kontakt', 'title' => 'Kontakt', 'featured_image_url' => '/images/about_doula.png', 'meta_title' => 'Kontakt | Natalia Potocka', 'meta_desc' => 'Skontaktuj się z Natalią Potocką w sprawie konsultacji i wsparcia.', 'meta_image_url' => '/images/about_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'offer' => ['page_key' => 'offer', 'page_name' => 'Oferta', 'slug' => 'oferta', 'title' => 'Oferta', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Oferta | Natalia Potocka', 'meta_desc' => 'Poznaj ofertę konsultacji, wsparcia i produktów cyfrowych Natalii Potockiej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'privacy' => ['page_key' => 'privacy', 'page_name' => 'Polityka prywatności', 'slug' => 'polityka-prywatnosci', 'title' => 'Polityka prywatności', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Polityka prywatności | Natalia Potocka', 'meta_desc' => 'Informacje o przetwarzaniu danych osobowych i technicznych zasadach działania strony internetowej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
        'terms' => ['page_key' => 'terms', 'page_name' => 'Regulamin sklepu', 'slug' => 'regulamin-sklepu', 'title' => 'Regulamin sklepu', 'featured_image_url' => '/images/hero_doula.png', 'meta_title' => 'Regulamin sklepu | Natalia Potocka', 'meta_desc' => 'Zasady zakupu i korzystania z produktów cyfrowych dostępnych na stronie Natalii Potockiej.', 'meta_image_url' => '/images/hero_doula.png', 'canonical_url' => '', 'noindex' => 0],
    ];
}

function emptyToNull($value)
{
    if ($value === null) {
        return null;
    }
    if (is_string($value)) {
        $trimmed = trim($value);
        return $trimmed === '' ? null : $trimmed;
    }
    return $value;
}

function parseBooleanFlag($value): int
{
    return ($value === true || $value === 1 || $value === '1' || $value === 'true') ? 1 : 0;
}

function parseNullableInteger($value): ?int
{
    if ($value === '' || $value === null) {
        return null;
    }
    return is_numeric($value) ? (int) $value : null;
}

function normalizeSlug(string $value): string
{
    return trim(strtolower(trim($value)), '/');
}

function normalizeBenefitCards($value): array
{
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

function normalizeFaqItems($value): array
{
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

function serializeBenefitCards($value): ?string
{
    $cards = normalizeBenefitCards($value);
    return $cards ? json_encode($cards, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
}

function serializeFaqItems($value): ?string
{
    $items = normalizeFaqItems($value);
    return $items ? json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
}

function normalizePurchasedItems($value): array
{
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

function serializePurchasedItems($value): ?string
{
    $items = normalizePurchasedItems($value);
    return $items ? implode(',', $items) : null;
}

function normalizeDelimitedText($value, bool $lowercase = false): array
{
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

function serializeDelimitedText($value, bool $lowercase = false): ?string
{
    $items = normalizeDelimitedText($value, $lowercase);
    return $items ? implode(',', $items) : null;
}

function stripFileExtension(string $value): string
{
    return preg_replace('/\.[^.]+$/u', '', $value) ?? $value;
}

function buildDefaultMediaTitle(?string $value): string
{
    $normalized = trim(str_replace(['_', '-'], ' ', stripFileExtension((string) $value)));
    return $normalized !== '' ? $normalized : 'Medium';
}
function getFaviconAssetCandidates(): array
{
    $candidates = [
        ['path' => __DIR__ . '/../favicon.svg', 'public_url' => '/favicon.svg'],
        ['path' => __DIR__ . '/../public/favicon.svg', 'public_url' => '/favicon.svg'],
        ['path' => __DIR__ . '/../favicon.ico', 'public_url' => '/favicon.ico'],
        ['path' => __DIR__ . '/../public/favicon.ico', 'public_url' => '/favicon.ico'],
        ['path' => __DIR__ . '/../favicon.png', 'public_url' => '/favicon.png'],
        ['path' => __DIR__ . '/../public/favicon.png', 'public_url' => '/favicon.png'],
    ];

    $results = [];
    $seenUrls = [];

    foreach ($candidates as $candidate) {
        $resolvedPath = realpath($candidate['path']);
        if (!$resolvedPath || !is_file($resolvedPath)) {
            continue;
        }

        if (in_array($candidate['public_url'], $seenUrls, true)) {
            continue;
        }

        $seenUrls[] = $candidate['public_url'];
        $results[] = [
            'path' => $resolvedPath,
            'public_url' => $candidate['public_url'],
            'file_name' => basename($resolvedPath),
        ];
    }

    return $results;
}

function mapUser(array $user): array
{
    $user['is_admin'] = !empty($user['is_admin']);
    $user['email_confirmed'] = !empty($user['email_confirmed']);
    $user['purchased_items'] = normalizePurchasedItems($user['purchased_items'] ?? null);
    $user['purchased_item_count'] = count($user['purchased_items']);
    return $user;
}

function mapCoupon(array $coupon): array
{
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

function mapProduct(array $product): array
{
    $product['benefits_json'] = normalizeBenefitCards($product['benefits_json'] ?? null);
    $product['faq_json'] = normalizeFaqItems($product['faq_json'] ?? null);
    $product['noindex'] = !empty($product['noindex']);
    $product['is_published'] = !empty($product['is_published']);
    $product['course_count'] = (int) ($product['course_count'] ?? 0);
    $product['module_count'] = (int) ($product['module_count'] ?? 0);
    $product['lesson_count'] = (int) ($product['lesson_count'] ?? 0);
    return $product;
}

function requireUserRecord(string $userId): array
{
    global $db;
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) {
        sendJson(['error' => 'Nie znaleziono użytkowniczki.'], 404);
    }
    return $user;
}

function requireProductRecord(string $productId): array
{
    global $db;
    $stmt = $db->prepare("SELECT id, title, slug FROM products WHERE id = ? AND type != 'service'");
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    if (!$product) {
        sendJson(['error' => 'Produkt nie istnieje.'], 404);
    }
    return $product;
}

function buildOrderSnapshot(string $customerEmail, string $productId, array $existingOrder = []): array
{
    global $db;

    $product = requireProductRecord($productId);
    $stmtUser = $db->prepare('SELECT first_name, last_name FROM users WHERE lower(email) = lower(?) LIMIT 1');
    $stmtUser->execute([$customerEmail]);
    $user = $stmtUser->fetch() ?: [];

    $currentFirstName = trim((string) ($existingOrder['customer_first_name'] ?? ''));
    $currentLastName = trim((string) ($existingOrder['customer_last_name'] ?? ''));
    $currentProductTitle = trim((string) ($existingOrder['product_title'] ?? ''));
    $currentProductSlug = trim((string) ($existingOrder['product_slug'] ?? ''));

    return [
        'customer_first_name' => $currentFirstName !== '' ? $currentFirstName : (($user['first_name'] ?? null) ?: null),
        'customer_last_name' => $currentLastName !== '' ? $currentLastName : (($user['last_name'] ?? null) ?: null),
        'product_title' => $currentProductTitle !== '' ? $currentProductTitle : ($product['title'] ?? null),
        'product_slug' => $currentProductSlug !== '' ? $currentProductSlug : ($product['slug'] ?? null),
    ];
}

function validateCouponPayload(array $payload, bool $partial = false): ?string
{
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

function buildBaseUrl(): string
{
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    return ($isHttps ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function buildDuplicateProductTitle(string $title): string
{
    $normalized = trim($title);
    if ($normalized === '') {
        return 'Nowy produkt (kopia)';
    }

    if (preg_match('/\(kopia(?:\s+\d+)?\)$/ui', $normalized)) {
        return $normalized;
    }

    return $normalized . ' (kopia)';
}

function buildUniqueProductSlug(string $seedSlug): string
{
    global $db;

    $baseSlug = normalizeSlug($seedSlug);
    if ($baseSlug === '') {
        $baseSlug = 'produkt-kopia';
    }

    $candidate = $baseSlug;
    $suffix = 2;
    $stmt = $db->prepare('SELECT 1 FROM products WHERE slug = ? LIMIT 1');

    while (true) {
        $stmt->execute([$candidate]);
        if (!$stmt->fetchColumn()) {
            return $candidate;
        }

        $candidate = $baseSlug . '-' . $suffix;
        $suffix++;
    }
}

function parseOrderSearchTerm(?string $value): string
{
    return mb_strtolower(trim((string) $value), 'UTF-8');
}

function translateOrderStatus(string $status): string
{
    if ($status === 'completed') {
        return 'Opłacone';
    }
    if ($status === 'pending_bank_transfer') {
        return 'Oczekujące na przelew';
    }
    if ($status === 'manual') {
        return 'Dostęp ręczny';
    }
    if ($status === 'pending') {
        return 'W trakcie';
    }
    if ($status === 'failed') {
        return 'Nieopłacone';
    }
    if ($status === 'refunded') {
        return 'Zwrócone';
    }
    if ($status === 'cancelled') {
        return 'Anulowane';
    }

    return $status;
}

function translatePaymentMethod(?string $method): string
{
    if ($method === 'stripe') {
        return 'Stripe';
    }
    if ($method === 'bank_transfer') {
        return 'Przelew tradycyjny';
    }
    if ($method === 'manual') {
        return 'Dostęp ręczny';
    }

    return (string) ($method ?? '');
}

function fetchOrdersForExport(?string $monthFilter, ?string $statusFilter, ?string $searchTerm): array
{
    global $db;

    $conditions = [];
    $params = [];

    if ($monthFilter && preg_match('/^\d{4}-\d{2}$/', $monthFilter)) {
        $conditions[] = "strftime('%Y-%m', orders.created_at) = ?";
        $params[] = $monthFilter;
    }

    if ($statusFilter && $statusFilter !== 'all') {
        $conditions[] = 'orders.status = ?';
        $params[] = $statusFilter;
    }

    $normalizedSearch = parseOrderSearchTerm($searchTerm);
    if ($normalizedSearch !== '') {
        $conditions[] = '(lower(COALESCE(orders.order_number, \"\")) LIKE ? OR lower(COALESCE(orders.customer_email, \"\")) LIKE ? OR lower(COALESCE(orders.product_title, products.title, \"\")) LIKE ?)';
        $likeTerm = '%' . $normalizedSearch . '%';
        $params[] = $likeTerm;
        $params[] = $likeTerm;
        $params[] = $likeTerm;
    }

    $whereSql = $conditions ? ('WHERE ' . implode(' AND ', $conditions)) : '';
    $sql = 'SELECT orders.*, COALESCE(orders.product_title, products.title) AS product_title, COALESCE(orders.product_slug, products.slug) AS product_slug, COALESCE(orders.customer_first_name, users.first_name) AS customer_first_name, COALESCE(orders.customer_last_name, users.last_name) AS customer_last_name FROM orders LEFT JOIN products ON products.id = orders.product_id LEFT JOIN users ON lower(users.email) = lower(orders.customer_email) ' . $whereSql . ' ORDER BY orders.created_at DESC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll();
}

function streamOrdersCsv(array $orders, string $fileName): void
{
    header_remove('Content-Type');
    http_response_code(200);
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="' . $fileName . '"');

    $output = fopen('php://output', 'wb');
    if ($output === false) {
        sendJson(['error' => 'Nie udało się przygotować eksportu CSV.'], 500);
    }

    fwrite($output, "\xEF\xBB\xBF");
    fputcsv($output, ['Data', 'Numer zamówienia', 'E-mail', 'Imię', 'Nazwisko', 'Produkt', 'Slug produktu', 'Kwota', 'Status', 'Metoda płatności', 'Kupon', 'ID zamówienia'], ';');

    foreach ($orders as $order) {
        fputcsv($output, [
            (string) ($order['created_at'] ?? ''),
            (string) (($order['order_number'] ?? '') ?: ($order['id'] ?? '')),
            (string) ($order['customer_email'] ?? ''),
            (string) ($order['customer_first_name'] ?? ''),
            (string) ($order['customer_last_name'] ?? ''),
            (string) ($order['product_title'] ?? ''),
            (string) ($order['product_slug'] ?? ''),
            number_format((float) ($order['amount_total'] ?? 0), 2, '.', ''),
            translateOrderStatus((string) ($order['status'] ?? '')),
            translatePaymentMethod($order['payment_method'] ?? null),
            (string) ($order['applied_coupon_code'] ?? ''),
            (string) ($order['id'] ?? ''),
        ], ';');
    }

    fclose($output);
    exit;
}

function validateUserPayload(array $payload, bool $partial = false): ?string
{
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

function validatePageSettingsInput(string $pageKey, array $payload): ?string
{
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

function getPageSettings(): array
{
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

function resolveMediaUploadDir(): string
{
    $publicDir = realpath(__DIR__ . '/../public');
    $baseDir = $publicDir ?: dirname(__DIR__);
    $uploadDir = $baseDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'media';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    return $uploadDir;
}

function getMediaAssetPath(string $fileName): string
{
    return resolveMediaUploadDir() . DIRECTORY_SEPARATOR . $fileName;
}

if ($method === 'GET' && $action === 'publish-status') {
    try {
        sendJson(buildPublishStatusPayload(true));
    } catch (Throwable $exception) {
        sendJson(['error' => $exception->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'publish') {
    try {
        $status = buildPublishStatusPayload(true);
        if (!$status['github_token_configured']) {
            sendJson(['error' => 'Brakuje tokenu GitHub do uruchamiania publikacji. Uzupełnij go w ustawieniach panelu.'], 400);
        }

        if (in_array($status['status'], ['requested', 'running'], true)) {
            sendJson(['error' => 'Publikacja już trwa albo czeka w kolejce GitHub Actions.'], 409);
        }

        if (!$status['has_pending_changes']) {
            sendJson([
                'message' => 'Brak nowych zmian do publikacji.',
                'status' => $status,
            ]);
        }

        $requestId = bin2hex(random_bytes(12));
        $requestedAt = gmdate('c');
        $triggeredBy = trim((string) (($currentUser['email'] ?? '') ?: ($currentUser['id'] ?? 'administrator')));
        $targetVersion = (int) $status['content_version'];
        $token = getGithubPublishToken();

        githubApiRequest(
            'POST',
            sprintf('https://api.github.com/repos/%s/%s/dispatches', rawurlencode(GITHUB_PUBLISH_REPO_OWNER), rawurlencode(GITHUB_PUBLISH_REPO_NAME)),
            $token,
            [
                'event_type' => GITHUB_PUBLISH_EVENT_TYPE,
                'client_payload' => [
                    'request_id' => $requestId,
                    'target_version' => $targetVersion,
                    'triggered_by' => $triggeredBy,
                    'requested_at' => $requestedAt,
                ],
            ]
        );

        saveSettingsMap([
            'site_publish_status' => 'requested',
            'site_publish_request_id' => $requestId,
            'site_publish_requested_version' => (string) $targetVersion,
            'site_publish_requested_at' => $requestedAt,
            'site_publish_last_triggered_by' => $triggeredBy,
            'site_publish_last_message' => 'Publikacja została zlecona do GitHub Actions.',
            'site_publish_last_run_url' => '',
        ]);

        logEvent('site_publish_requested', 'Administratorka uruchomiła publikację publicznych treści.', [
            'user_id' => $currentUser['id'] ?? null,
            'customer_email' => $currentUser['email'] ?? null,
            'target_version' => $targetVersion,
            'request_id' => $requestId,
        ]);

        sendJson([
            'message' => 'Publikacja została przekazana do GitHub Actions.',
            'status' => buildPublishStatusPayload(false),
        ]);
    } catch (Throwable $exception) {
        sendJson(['error' => $exception->getMessage()], 500);
    }
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
        if (shouldMarkPublicContentDirtyForProductChange(null, $data)) {
            markPublicContentDirty('products', (string) ($currentUser['email'] ?? ''));
        }
        sendJson(['id' => $id, 'message' => 'Produkt utworzony'], 201);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'duplicate-product') {
    $id = (string) ($_GET['id'] ?? '');

    try {
        $stmtProduct = $db->prepare('SELECT * FROM products WHERE id = ?');
        $stmtProduct->execute([$id]);
        $product = $stmtProduct->fetch();

        if (!$product) {
            sendJson(['error' => 'Nie znaleziono produktu do zduplikowania.'], 404);
        }

        $duplicateId = bin2hex(random_bytes(16));
        $duplicateTitle = buildDuplicateProductTitle((string) ($product['title'] ?? ''));
        $duplicateSlug = buildUniqueProductSlug(((string) ($product['slug'] ?? '')) . '-kopia');

        $stmtInsert = $db->prepare('INSERT INTO products (id, title, slug, description, short_description, price, promotional_price, promotional_price_until, lowest_price_30_days, stripe_price_id, type, content_url, thumbnail_url, secondary_image_url, duration_label, long_description, benefits_json, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmtInsert->execute([
            $duplicateId,
            $duplicateTitle,
            $duplicateSlug,
            $product['description'] ?? null,
            $product['short_description'] ?? null,
            $product['price'] ?? 0,
            $product['promotional_price'] ?? null,
            $product['promotional_price_until'] ?? null,
            $product['lowest_price_30_days'] ?? null,
            $product['stripe_price_id'] ?? null,
            $product['type'] ?? 'video',
            $product['content_url'] ?? null,
            $product['thumbnail_url'] ?? null,
            $product['secondary_image_url'] ?? null,
            $product['duration_label'] ?? null,
            $product['long_description'] ?? null,
            $product['benefits_json'] ?? null,
            $product['faq_json'] ?? null,
            $product['meta_title'] ?? null,
            $product['meta_desc'] ?? null,
            $product['meta_image_url'] ?? null,
            $product['canonical_url'] ?? null,
            parseBooleanFlag($product['noindex'] ?? false),
            0,
        ]);

        logEvent('product_duplicated', 'Administratorka zduplikowała produkt.', [
            'user_id' => $currentUser['id'] ?? null,
            'source_product_id' => $id,
            'duplicate_product_id' => $duplicateId,
            'duplicate_slug' => $duplicateSlug,
        ]);

        sendJson([
            'message' => 'Produkt został zduplikowany jako szkic nieopublikowany.',
            'product' => mapProduct((array) $db->query("SELECT * FROM products WHERE id = '" . $duplicateId . "'")->fetch()),
        ], 201);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' && $action === 'products') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $id = (string) ($_GET['id'] ?? '');
    try {
        $stmtCurrentProduct = $db->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmtCurrentProduct->execute([$id]);
        $currentProduct = $stmtCurrentProduct->fetch();

        $stmt = $db->prepare('UPDATE products SET title = ?, slug = ?, description = ?, short_description = ?, price = ?, promotional_price = ?, promotional_price_until = ?, lowest_price_30_days = ?, stripe_price_id = ?, type = ?, content_url = ?, thumbnail_url = ?, secondary_image_url = ?, duration_label = ?, long_description = ?, benefits_json = ?, faq_json = ?, meta_title = ?, meta_desc = ?, meta_image_url = ?, canonical_url = ?, noindex = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$data['title'] ?? '', $data['slug'] ?? '', emptyToNull($data['description'] ?? null), emptyToNull($data['short_description'] ?? null), $data['price'] ?? 0, emptyToNull($data['promotional_price'] ?? null), emptyToNull($data['promotional_price_until'] ?? null), emptyToNull($data['lowest_price_30_days'] ?? null), emptyToNull($data['stripe_price_id'] ?? null), $data['type'] ?? '', emptyToNull($data['content_url'] ?? null), emptyToNull($data['thumbnail_url'] ?? null), emptyToNull($data['secondary_image_url'] ?? null), emptyToNull($data['duration_label'] ?? null), emptyToNull($data['long_description'] ?? null), serializeBenefitCards($data['benefits_json'] ?? null), serializeFaqItems($data['faq_json'] ?? null), emptyToNull($data['meta_title'] ?? null), emptyToNull($data['meta_desc'] ?? null), emptyToNull($data['meta_image_url'] ?? null), emptyToNull($data['canonical_url'] ?? null), parseBooleanFlag($data['noindex'] ?? false), parseBooleanFlag($data['is_published'] ?? true), $id]);

        if (shouldMarkPublicContentDirtyForProductChange(is_array($currentProduct) ? $currentProduct : null, $data)) {
            markPublicContentDirty('products', (string) ($currentUser['email'] ?? ''));
        }

        sendJson(['message' => 'Produkt zaktualizowany']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE' && $action === 'products') {
    $id = (string) ($_GET['id'] ?? '');
    try {
        $stmtCurrentProduct = $db->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmtCurrentProduct->execute([$id]);
        $currentProduct = $stmtCurrentProduct->fetch();

        $stmt = $db->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0 && shouldMarkPublicContentDirtyForProductChange(is_array($currentProduct) ? $currentProduct : null, null)) {
            markPublicContentDirty('products', (string) ($currentUser['email'] ?? ''));
        }

        sendJson(['message' => 'Produkt usunięty']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'orders') {
    try {
        $orderId = (string) ($_GET['id'] ?? '');
        if ($orderId !== '') {
            $stmt = $db->prepare('SELECT orders.*, COALESCE(orders.product_title, products.title) AS product_title, COALESCE(orders.product_slug, products.slug) AS product_slug, COALESCE(orders.customer_first_name, users.first_name) AS customer_first_name, COALESCE(orders.customer_last_name, users.last_name) AS customer_last_name FROM orders LEFT JOIN products ON products.id = orders.product_id LEFT JOIN users ON lower(users.email) = lower(orders.customer_email) WHERE orders.id = ?');
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            if (!$order) {
                sendJson(['error' => 'Nie znaleziono zamówienia.'], 404);
            }

            sendJson([
                'order' => $order,
                'events' => getEventLog(['order_id' => $orderId], 40),
            ]);
        }

        $stmt = $db->query('SELECT orders.*, COALESCE(orders.product_title, products.title) AS product_title, COALESCE(orders.product_slug, products.slug) AS product_slug, COALESCE(orders.customer_first_name, users.first_name) AS customer_first_name, COALESCE(orders.customer_last_name, users.last_name) AS customer_last_name FROM orders LEFT JOIN products ON products.id = orders.product_id LEFT JOIN users ON lower(users.email) = lower(orders.customer_email) ORDER BY orders.created_at DESC');
        sendJson($stmt->fetchAll());
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'GET' && $action === 'orders-export') {
    try {
        $month = trim((string) ($_GET['month'] ?? ''));
        $status = trim((string) ($_GET['status'] ?? ''));
        $search = trim((string) ($_GET['q'] ?? ''));
        $orders = fetchOrdersForExport($month !== '' ? $month : null, $status !== '' ? $status : null, $search !== '' ? $search : null);
        $fileName = 'zamowienia-' . ($month !== '' ? $month : 'wszystkie') . '.csv';
        streamOrdersCsv($orders, $fileName);
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
    $snapshot = buildOrderSnapshot($customerEmail, $productId, $existingOrder);
    $orderNumber = trim((string) ($existingOrder['order_number'] ?? '')) !== ''
        ? $existingOrder['order_number']
        : generateOrderNumber($existingOrder['created_at'] ?? null);
    $paymentMethod = trim((string) ($existingOrder['payment_method'] ?? '')) !== ''
        ? $existingOrder['payment_method']
        : inferOrderPaymentMethod($existingOrder);

    try {
        $stmtUpdate = $db->prepare('UPDATE orders SET order_number = ?, customer_email = ?, customer_first_name = ?, customer_last_name = ?, product_id = ?, product_title = ?, product_slug = ?, amount_total = ?, payment_method = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmtUpdate->execute([$orderNumber, $customerEmail, $snapshot['customer_first_name'], $snapshot['customer_last_name'], $productId, $snapshot['product_title'], $snapshot['product_slug'], (float) $amountTotal, $paymentMethod, $status, $orderId]);

        logEvent('order_updated_by_admin', 'Administratorka zaktualizowała zamówienie.', [
            'user_id' => $currentUser['id'] ?? null,
            'order_id' => $orderId,
            'customer_email' => $customerEmail,
            'status' => $status,
            'product_id' => $productId,
            'amount_total' => (float) $amountTotal,
        ]);

        $stmtOrder = $db->prepare('SELECT orders.*, COALESCE(orders.product_title, products.title) AS product_title, COALESCE(orders.product_slug, products.slug) AS product_slug, COALESCE(orders.customer_first_name, users.first_name) AS customer_first_name, COALESCE(orders.customer_last_name, users.last_name) AS customer_last_name FROM orders LEFT JOIN products ON products.id = orders.product_id LEFT JOIN users ON lower(users.email) = lower(orders.customer_email) WHERE orders.id = ?');
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
                'events' => getEventLog(['user_id' => $user['id'], 'customer_email' => $user['email']], 40),
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

        logEvent('admin_reset_link_generated', 'Administratorka wygenerowała link resetu hasła.', [
            'user_id' => $userId,
            'customer_email' => $user['email'] ?? null,
            'generated_by' => $currentUser['id'] ?? null,
            'reset_expires' => $expiresAt,
        ]);

        sendJson([
            'message' => 'Link resetu hasła został wygenerowany.',
            'reset_url' => buildBaseUrl() . '/resetowanie-hasla?token=' . $resetToken,
            'expires_at' => $expiresAt,
        ]);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'user-send-reset-password-email') {
    $userId = (string) ($_GET['id'] ?? '');
    $user = requireUserRecord($userId);
    if (empty($user['email'])) {
        sendJson(['error' => 'Użytkowniczka nie ma przypisanego adresu e-mail.'], 400);
    }

    try {
        $resetToken = bin2hex(random_bytes(32));
        $expiresAt = gmdate('c', time() + 3600);
        $resetUrl = buildBaseUrl() . '/resetowanie-hasla?token=' . $resetToken;

        $stmt = $db->prepare('UPDATE users SET reset_token = ?, reset_expires = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
        $stmt->execute([$resetToken, $expiresAt, $userId]);

        $sent = mailer_send_password_reset((string) $user['email'], $resetUrl, [
            'firstName' => (string) ($user['first_name'] ?? ''),
        ]);
        $delivery = mailer_get_last_delivery();

        if (!$sent) {
            $details = trim((string) ($delivery['details'] ?? ''));
            $error = 'Nie udało się wysłać wiadomości resetującej.' . ($details !== '' ? ' ' . $details : '');
            sendJson(['error' => $error, 'delivery' => $delivery], 500);
        }

        logEvent('admin_reset_email_sent', 'Administratorka wysłała wiadomość resetu hasła.', [
            'user_id' => $userId,
            'customer_email' => $user['email'] ?? null,
            'generated_by' => $currentUser['id'] ?? null,
            'reset_expires' => $expiresAt,
        ]);

        sendJson([
            'message' => ($delivery['mode'] ?? '') === 'local-preview'
                ? 'Wiadomość z linkiem do resetu hasła została zapisana lokalnie do podglądu.'
                : 'Wiadomość z linkiem do resetu hasła została wysłana.',
            'expires_at' => $expiresAt,
            'delivery' => $delivery,
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
        $orderNumber = generateOrderNumber();
        $snapshot = buildOrderSnapshot($email, $productId);
        $stmtOrder = $db->prepare('INSERT INTO orders (id, order_number, customer_email, customer_first_name, customer_last_name, product_id, product_title, product_slug, amount_total, payment_method, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)');
        $stmtOrder->execute([$orderId, $orderNumber, $email, $snapshot['customer_first_name'], $snapshot['customer_last_name'], $productId, $snapshot['product_title'], $snapshot['product_slug'], 0, 'manual', 'manual']);

        logEvent('manual_access_granted', 'Administratorka nadała ręczny dostęp do produktu.', [
            'user_id' => $user['id'] ?? $userId,
            'order_id' => $orderId,
            'customer_email' => $email,
            'order_number' => $orderNumber,
            'product_id' => $productId,
            'product_title' => $snapshot['product_title'],
            'granted_by' => $currentUser['id'] ?? null,
        ]);

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
            $key = (string) ($row['key'] ?? '');
            if (!shouldExposeSettingKey($key)) {
                continue;
            }
            $settings[$key] = $row['value'] ?? '';
        }
        sendJson($settings);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'settings') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    try {
        $dirtyPublicContent = publicSettingsChanged($data);
        $stmt = $db->prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');
        foreach ($data as $key => $value) {
            if (!canWriteSettingKey((string) $key)) {
                continue;
            }
            $stmt->execute([(string) $key, normalizeSettingStoredValue($value)]);
        }
        if ($dirtyPublicContent) {
            markPublicContentDirty('settings', (string) ($currentUser['email'] ?? ''));
        }
        sendJson(['message' => 'Ustawienia zapisane']);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'settings-send-test-email') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $recipient = trim((string) ($data['email'] ?? ''));

    if ($recipient === '') {
        $recipient = trim((string) ($currentUser['email'] ?? ''));
    }

    if (!filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        sendJson(['error' => 'Brakuje prawidłowego adresu e-mail do testu.'], 400);
    }

    $sent = mailer_send_admin_test_email($recipient, [
        'adminEmail' => (string) ($currentUser['email'] ?? ''),
        'notifyEmail' => mailer_read_setting('notify_email'),
        'baseUrl' => buildBaseUrl(),
    ]);
    $delivery = mailer_get_last_delivery();

    if (!$sent) {
        $details = trim((string) ($delivery['details'] ?? ''));
        $error = 'Nie udało się wysłać testowego e-maila.' . ($details !== '' ? ' ' . $details : '');
        sendJson(['error' => $error, 'delivery' => $delivery], 500);
    }

    logEvent('test_email_sent', 'Administratorka wysłała testową wiadomość e-mail.', [
        'user_id' => $currentUser['id'] ?? null,
        'customer_email' => $recipient,
    ]);

    sendJson([
        'message' => ($delivery['mode'] ?? '') === 'local-preview'
            ? 'Testowy e-mail został zapisany lokalnie do podglądu.'
            : 'Testowy e-mail został wysłany.',
        'recipient' => $recipient,
        'delivery' => $delivery,
    ]);
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
        markPublicContentDirty('pages', (string) ($currentUser['email'] ?? ''));
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
        $existingPublicUrls = [];
        foreach ($media as $mediaItem) {
            if (!empty($mediaItem['public_url'])) {
                $existingPublicUrls[] = (string) $mediaItem['public_url'];
            }
        }

        $fallbackMedia = [];
        foreach (getFaviconAssetCandidates() as $faviconCandidate) {
            if (in_array($faviconCandidate['public_url'], $existingPublicUrls, true)) {
                continue;
            }

            $faviconId = bin2hex(random_bytes(16));
            $imageSize = @getimagesize($faviconCandidate['path']) ?: [null, null];

            $faviconMedia = null;
            try {
                $stmtInsert = $db->prepare('INSERT INTO media_assets (id, file_name, original_name, title, mime_type, size_bytes, width, height, alt_text, public_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
                $stmtInsert->execute([
                    $faviconId,
                    $faviconCandidate['file_name'],
                    $faviconCandidate['file_name'],
                    'Favicon strony',
                    mime_content_type($faviconCandidate['path']) ?: 'image/svg+xml',
                    (int) (filesize($faviconCandidate['path']) ?: 0),
                    $imageSize[0] ?? null,
                    $imageSize[1] ?? null,
                    'Favicon strony',
                    $faviconCandidate['public_url'],
                ]);

                $stmtFavicon = $db->prepare('SELECT * FROM media_assets WHERE id = ?');
                $stmtFavicon->execute([$faviconId]);
                $faviconMedia = $stmtFavicon->fetch();
            } catch (Exception $exception) {
                $stmtFavicon = $db->prepare('SELECT * FROM media_assets WHERE public_url = ? LIMIT 1');
                $stmtFavicon->execute([$faviconCandidate['public_url']]);
                $faviconMedia = $stmtFavicon->fetch();
            }

            if ($faviconMedia) {
                $fallbackMedia[] = $faviconMedia;
                $existingPublicUrls[] = $faviconCandidate['public_url'];
            }
        }

        if ($fallbackMedia) {
            $media = array_merge($fallbackMedia, $media);
        }

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
        $imageSize = @getimagesize($destination) ?: [null, null];
        $stmt = $db->prepare('INSERT INTO media_assets (id, file_name, original_name, title, mime_type, size_bytes, width, height, alt_text, public_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)');
        $stmt->execute([$mediaId, $fileName, $_FILES['file']['name'], buildDefaultMediaTitle((string) $_FILES['file']['name']), $mimeType, (int) ($_FILES['file']['size'] ?? 0), $imageSize[0] ?? null, $imageSize[1] ?? null, emptyToNull($_POST['alt_text'] ?? null), $publicUrl]);
        $stmtMedia = $db->prepare('SELECT * FROM media_assets WHERE id = ?');
        $stmtMedia->execute([$mediaId]);
        markPublicContentDirty('media', (string) ($currentUser['email'] ?? ''));
        sendJson(['message' => 'Plik został dodany do biblioteki mediów.', 'media' => $stmtMedia->fetch()], 201);
    } catch (Exception $e) {
        @unlink($destination);
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT' && $action === 'media') {
    $mediaId = (string) ($_GET['id'] ?? '');
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $relatedIds = array_values(array_unique(array_filter(array_map('strval', (array) ($data['related_ids'] ?? [])))));
    if (empty($relatedIds)) {
        $relatedIds = [$mediaId];
    }

    try {
        $placeholders = implode(',', array_fill(0, count($relatedIds), '?'));
        $stmt = $db->prepare("SELECT id FROM media_assets WHERE id IN ($placeholders)");
        $stmt->execute($relatedIds);
        $existingIds = array_column($stmt->fetchAll(), 'id');
        if (empty($existingIds)) {
            sendJson(['error' => 'Nie znaleziono medium.'], 404);
        }

        $stmtUpdate = $db->prepare("UPDATE media_assets SET title = ?, alt_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN ($placeholders)");
        $params = [emptyToNull($data['title'] ?? null), emptyToNull($data['alt_text'] ?? null)];
        $params = array_merge($params, $existingIds);
        $stmtUpdate->execute($params);

        $stmtMedia = $db->prepare("SELECT * FROM media_assets WHERE id IN ($placeholders) ORDER BY created_at DESC");
        $stmtMedia->execute($existingIds);
        markPublicContentDirty('media', (string) ($currentUser['email'] ?? ''));
        sendJson(['message' => 'Szczegóły medium zostały zapisane.', 'media' => $stmtMedia->fetchAll()]);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE' && $action === 'media') {
    $mediaId = (string) ($_GET['id'] ?? '');
    try {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $relatedIds = array_values(array_unique(array_filter(array_map('strval', (array) ($data['related_ids'] ?? [])))));
        if (empty($relatedIds)) {
            $relatedIds = [$mediaId];
        }

        $placeholders = implode(',', array_fill(0, count($relatedIds), '?'));
        $stmt = $db->prepare("SELECT * FROM media_assets WHERE id IN ($placeholders)");
        $stmt->execute($relatedIds);
        $mediaRows = $stmt->fetchAll();
        if (!$mediaRows) {
            sendJson(['error' => 'Nie znaleziono medium.'], 404);
        }

        $existingIds = array_column($mediaRows, 'id');
        $stmtDelete = $db->prepare("DELETE FROM media_assets WHERE id IN ($placeholders)");
        $stmtDelete->execute($existingIds);
        foreach ($mediaRows as $media) {
            @unlink(getMediaAssetPath((string) $media['file_name']));
        }
        markPublicContentDirty('media', (string) ($currentUser['email'] ?? ''));
        sendJson(['message' => count($mediaRows) > 1 ? 'Całe medium zostało usunięte.' : 'Medium zostało usunięte.']);
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
    foreach (getFaviconAssetCandidates() as $faviconCandidate) {
        $images[] = $faviconCandidate['path'];
    }

    $added = 0;
    foreach ($images as $path) {
        if (!file_exists($path))
            continue;

        $filename = basename($path);
        // build correct public url
        // Jeśli plik jest w /images/optimized to public_url ma być /images/optimized/nazwa
        $isOptimized = strpos($path, 'optimized') !== false;
        if (preg_match('/^favicon\.(svg|ico|png)$/i', $filename) === 1) {
            $public_url = '/' . $filename;
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
            $mediaId,
            $filename,
            $filename,
            $mimeType ?: 'image/png',
            $size,
            null,
            null,
            $alt,
            $public_url
        ]);
        $added++;
    }

    sendJson(['message' => 'Zsynchronizowano', 'added_count' => $added]);
}

sendJson(['error' => 'Unknown action'], 400);