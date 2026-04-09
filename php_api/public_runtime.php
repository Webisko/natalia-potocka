<?php
require_once __DIR__ . '/db.php';

const PUBLIC_RUNTIME_PAGE_DEFAULTS = [
    'offer' => [
        'slug' => 'oferta',
    ],
    'contact' => [
        'slug' => 'kontakt',
    ],
    'terms' => [
        'slug' => 'regulamin-sklepu',
    ],
];

const PUBLIC_RUNTIME_SERVICE_SLUG_REDIRECTS = [
    'konsultacja-indywidualna' => 'konsultacja-indywidualna',
    'uzdrowienie-traumy-porodowej' => 'uzdrowienie-traumy-porodowej',
];

function publicRuntimeEscape($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function publicRuntimeNormalizeFaqItems($value): array
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

    $result = [];
    foreach ($value as $item) {
        $question = is_array($item) ? trim((string) ($item['q'] ?? '')) : '';
        $answer = is_array($item) ? trim((string) ($item['a'] ?? '')) : '';
        if ($question !== '' && $answer !== '') {
            $result[] = ['q' => $question, 'a' => $answer];
        }
    }

    return array_slice($result, 0, 8);
}

function publicRuntimeNormalizeBenefits($value): array
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

    $result = [];
    foreach ($value as $item) {
        $title = is_array($item) ? trim((string) ($item['title'] ?? '')) : '';
        $description = is_array($item) ? trim((string) ($item['description'] ?? '')) : '';
        if ($title !== '' || $description !== '') {
            $result[] = [
                'title' => $title,
                'description' => $description,
            ];
        }
    }

    return array_slice($result, 0, 4);
}

function publicRuntimeStripRichText(string $value): string
{
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? '');
}

function publicRuntimeSanitizeUrl(string $value): string
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return '';
    }

    if ($trimmed[0] === '/') {
        return $trimmed;
    }

    $parts = parse_url($trimmed);
    $scheme = strtolower((string) ($parts['scheme'] ?? ''));
    if (in_array($scheme, ['http', 'https', 'mailto', 'tel'], true)) {
        return $trimmed;
    }

    return '';
}

function publicRuntimeSanitizeNode(DOMNode $node, DOMDocument $output): ?DOMNode
{
    if ($node instanceof DOMText) {
        return $output->createTextNode($node->nodeValue ?? '');
    }

    if (!$node instanceof DOMElement) {
        return null;
    }

    $allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'h2', 'h3', 'h4', 'a'];
    $tagName = strtolower($node->tagName);

    if (!in_array($tagName, $allowedTags, true)) {
        $fragment = $output->createDocumentFragment();
        foreach ($node->childNodes as $child) {
            $sanitizedChild = publicRuntimeSanitizeNode($child, $output);
            if ($sanitizedChild !== null) {
                $fragment->appendChild($sanitizedChild);
            }
        }
        return $fragment;
    }

    $element = $output->createElement($tagName);

    if ($tagName === 'a') {
        $href = publicRuntimeSanitizeUrl((string) $node->getAttribute('href'));
        if ($href !== '') {
            $element->setAttribute('href', $href);
            $element->setAttribute('rel', 'noopener noreferrer');
            $element->setAttribute('target', '_blank');
        }
    }

    foreach ($node->childNodes as $child) {
        $sanitizedChild = publicRuntimeSanitizeNode($child, $output);
        if ($sanitizedChild !== null) {
            $element->appendChild($sanitizedChild);
        }
    }

    return $element;
}

function publicRuntimeSanitizeRichText(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }

    $input = new DOMDocument('1.0', 'UTF-8');
    libxml_use_internal_errors(true);
    $input->loadHTML('<?xml encoding="utf-8" ?><div>' . $value . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();

    $wrapper = $input->getElementsByTagName('div')->item(0);
    if (!$wrapper) {
        return '';
    }

    $output = new DOMDocument('1.0', 'UTF-8');
    $container = $output->createElement('div');
    $output->appendChild($container);

    foreach ($wrapper->childNodes as $child) {
        $sanitizedChild = publicRuntimeSanitizeNode($child, $output);
        if ($sanitizedChild !== null) {
            $container->appendChild($sanitizedChild);
        }
    }

    $html = '';
    foreach ($container->childNodes as $child) {
        $html .= $output->saveHTML($child);
    }

    return trim($html);
}

function publicRuntimeExtractLead(string $value): string
{
    $sanitized = publicRuntimeSanitizeRichText($value);
    if ($sanitized === '') {
        return '';
    }

    if (preg_match('/<(p|h2|h3|h4|blockquote|li)\b[^>]*>(.*?)<\/\1>/is', $sanitized, $matches)) {
        return publicRuntimeStripRichText($matches[2]);
    }

    return publicRuntimeStripRichText($sanitized);
}

function publicRuntimeExtractListItems(string $value): array
{
    $sanitized = publicRuntimeSanitizeRichText($value);
    if ($sanitized !== '' && preg_match_all('/<li\b[^>]*>(.*?)<\/li>/is', $sanitized, $matches)) {
        $items = [];
        foreach ($matches[1] as $itemHtml) {
            $text = publicRuntimeStripRichText($itemHtml);
            if ($text !== '') {
                $items[] = $text;
            }
        }
        if ($items) {
            return $items;
        }
    }

    $items = [];
    foreach (preg_split('/\R/u', $value) ?: [] as $line) {
        $line = trim((string) $line);
        if (str_starts_with($line, '- ')) {
            $items[] = trim(substr($line, 2));
        }
    }

    return $items;
}

function publicRuntimeFetchPagePath(string $pageKey): string
{
    global $db;

    $defaultSlug = PUBLIC_RUNTIME_PAGE_DEFAULTS[$pageKey]['slug'] ?? '';
    try {
        $stmt = $db->prepare('SELECT slug FROM page_settings WHERE page_key = ? LIMIT 1');
        $stmt->execute([$pageKey]);
        $slug = trim((string) ($stmt->fetchColumn() ?: $defaultSlug));
    } catch (Throwable $ignored) {
        $slug = $defaultSlug;
    }

    if ($slug === '') {
        return '/';
    }

    return '/' . trim($slug, '/');
}

function publicRuntimeFormatPrice(float $value): string
{
    return number_format($value, 2, ',', ' ') . ' PLN';
}

function publicRuntimeFetchProductBySlug(string $slug): ?array
{
    global $db;

    $stmt = $db->prepare('SELECT * FROM products WHERE slug = ? AND COALESCE(is_published, 1) = 1 LIMIT 1');
    $stmt->execute([$slug]);
    $product = $stmt->fetch();
    if (!$product) {
        return null;
    }

    $product['benefits_json'] = publicRuntimeNormalizeBenefits($product['benefits_json'] ?? null);
    $product['faq_json'] = publicRuntimeNormalizeFaqItems($product['faq_json'] ?? null);
    $product['description_html'] = publicRuntimeSanitizeRichText((string) ($product['description'] ?? ''));
    $product['long_description_html'] = publicRuntimeSanitizeRichText((string) ($product['long_description'] ?? ''));
    $product['lead'] = trim((string) ($product['short_description'] ?? ''));
    if ($product['lead'] === '') {
        $product['lead'] = publicRuntimeExtractLead((string) ($product['description'] ?? ''));
    }
    $product['learning_points'] = publicRuntimeExtractListItems((string) ($product['description'] ?? ''));
    $product['noindex'] = !empty($product['noindex']);
    $product['price'] = (float) ($product['price'] ?? 0);
    $product['promotional_price'] = ($product['promotional_price'] ?? null) === null ? null : (float) $product['promotional_price'];
    $product['lowest_price_30_days'] = ($product['lowest_price_30_days'] ?? null) === null ? null : (float) $product['lowest_price_30_days'];

    $promoActive = $product['promotional_price'] !== null
        && ($product['promotional_price_until'] === null || strtotime((string) $product['promotional_price_until']) >= time());
    $product['promo_active'] = $promoActive;
    $product['current_price'] = $promoActive ? (float) $product['promotional_price'] : (float) $product['price'];

    return $product;
}

function publicRuntimeFetchCourseByProductId(string $productId): ?array
{
    global $db;

    $stmt = $db->prepare('SELECT * FROM courses WHERE product_id = ? LIMIT 1');
    $stmt->execute([$productId]);
    $course = $stmt->fetch();
    if (!$course) {
        return null;
    }

    $modulesStmt = $db->prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index ASC, created_at ASC');
    $modulesStmt->execute([$course['id']]);
    $modules = [];

    foreach ($modulesStmt->fetchAll() ?: [] as $module) {
        $lessonsStmt = $db->prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index ASC, created_at ASC');
        $lessonsStmt->execute([$module['id']]);
        $module['lessons'] = $lessonsStmt->fetchAll() ?: [];
        $modules[] = $module;
    }

    $course['modules'] = $modules;
    return $course;
}

function publicRuntimeBuildCanonicalUrl(?string $value, string $fallbackPath): string
{
    $canonical = trim((string) ($value ?? ''));
    if ($canonical !== '') {
        return $canonical;
    }

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    return ($isHttps ? 'https://' : 'http://') . $host . $fallbackPath;
}

function publicRuntimeResolveAbsoluteUrl(string $value): string
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return '';
    }

    if (preg_match('#^https?://#i', $trimmed)) {
        return $trimmed;
    }

    return publicRuntimeBuildCanonicalUrl(null, $trimmed[0] === '/' ? $trimmed : '/' . $trimmed);
}