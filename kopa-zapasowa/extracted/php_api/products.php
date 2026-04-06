<?php
require_once __DIR__ . '/db.php';

function normalizeBenefitCards($value) {
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
    foreach ($value as $card) {
        $title = is_array($card) ? trim((string) ($card['title'] ?? '')) : '';
        $description = is_array($card) ? trim((string) ($card['description'] ?? '')) : '';
        if ($title !== '' || $description !== '') {
            $result[] = [
                'title' => $title,
                'description' => $description,
            ];
        }
    }

    return array_slice($result, 0, 3);
}

function normalizeFaqItems($value) {
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
        if ($question !== '' || $answer !== '') {
            $result[] = [
                'q' => $question,
                'a' => $answer,
            ];
        }
    }

    return array_slice($result, 0, 5);
}

function mapProduct(array $product): array {
    $product['benefits_json'] = normalizeBenefitCards($product['benefits_json'] ?? null);
    $product['faq_json'] = normalizeFaqItems($product['faq_json'] ?? null);
    $product['noindex'] = !empty($product['noindex']);
    return $product;
}

try {
    if (isset($_GET['slug'])) {
        $stmt = $db->prepare("SELECT id, title, slug, description, short_description, price, promotional_price, promotional_price_until, lowest_price_30_days, type, content_url, thumbnail_url, duration_label, long_description, benefits_json, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex, stripe_price_id FROM products WHERE slug = :slug AND type != 'service' AND COALESCE(is_published, 1) = 1");
        $stmt->execute([':slug' => $_GET['slug']]);
        $product = $stmt->fetch();

        if (!$product) {
            sendJson(['error' => 'Product not found'], 404);
        }

        $publicProduct = mapProduct($product);
        unset($publicProduct['content_url']);
        sendJson($publicProduct);
    }

    $stmt = $db->query("SELECT id, title, slug, price, promotional_price, promotional_price_until, lowest_price_30_days, type, thumbnail_url, description, short_description, duration_label, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex FROM products WHERE type != 'service' AND COALESCE(is_published, 1) = 1");
    $products = array_map('mapProduct', $stmt->fetchAll());
    sendJson($products);
} catch (Exception $e) {
    sendJson(['error' => $e->getMessage()], 500);
}