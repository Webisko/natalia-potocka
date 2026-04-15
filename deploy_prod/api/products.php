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
        $icon = is_array($card) ? trim((string) ($card['icon'] ?? 'check')) : 'check';
        if ($title !== '' || $description !== '') {
            $result[] = [
                'title' => $title,
                'description' => $description,
                'icon' => $icon !== '' ? $icon : 'check',
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

function getTemplateContentSettingKey(string $scope, string $key): string {
    $prefix = $scope === 'course' ? 'product_template_course_' : 'product_template_common_';
    return $prefix . $key;
}

function getTemplateSettingsMap(): array {
    global $db;

    static $cached = null;
    if (is_array($cached)) {
        return $cached;
    }

    $rows = $db->query("SELECT key, value FROM settings WHERE key LIKE 'product_template_%' ORDER BY key ASC")->fetchAll();
    $settings = [];
    foreach ($rows as $row) {
        $settings[(string) ($row['key'] ?? '')] = (string) ($row['value'] ?? '');
    }

    $cached = $settings;
    return $cached;
}

function mapProduct(array $product): array {
    $product['benefits_json'] = normalizeBenefitCards($product['benefits_json'] ?? null);
    $product['faq_json'] = normalizeFaqItems($product['faq_json'] ?? null);
    $product['template_content_json'] = normalizeTemplateContent($product['template_content_json'] ?? null, (string) ($product['type'] ?? 'video'));
    $product['noindex'] = !empty($product['noindex']);
    return $product;
}

function normalizeTemplateContent($value, string $type): array {
    if (is_string($value)) {
        $trimmed = trim($value);
        if ($trimmed === '') {
            $value = [];
        } else {
            $decoded = json_decode($trimmed, true);
            $value = is_array($decoded) ? $decoded : [];
        }
    }

    if (!is_array($value)) {
        $value = [];
    }

    $settings = getTemplateSettingsMap();

    $defaults = [
        'heroAvailabilityLabel' => 'Dostęp natychmiastowy',
        'investmentLabel' => 'Inwestycja',
        'checkoutButtonLabel' => 'Kup Dostęp Teraz',
        'purchasedButtonLabel' => 'Przejdź do biblioteki',
        'checkoutNoteText' => 'Natychmiastowy dostęp po opłaceniu · Bezpieczne płatności: Stripe',
        'benefitsTitle' => 'Co zyskasz?',
        'benefitsIntro' => 'Trzy najważniejsze jakości, z którymi wyjdziesz po przerobieniu tego materiału.',
        'detailsEyebrow' => 'Szczegóły',
        'faqEyebrow' => 'FAQ',
        'faqTitle' => 'Najczęstsze pytania',
        'relatedEyebrow' => 'Pozostałe produkty',
        'relatedTitle' => 'Zobacz także',
        'relatedIntro' => 'Jeśli ten temat jest Ci bliski, poniżej znajdziesz kolejne materiały, które dobrze uzupełniają tę ścieżkę przygotowania i wsparcia.',
    ];

    if ($type === 'course') {
        $defaults = array_merge($defaults, [
            'heroFeaturesTitle' => 'W środku znajdziesz',
            'bonusMaterialsFallback' => 'Materiały dodatkowe i bonusy do pracy własnej',
            'lifetimeAccessFallback' => 'Dostęp dożywotni z poziomu panelu klientki',
            'courseProgramEyebrow' => 'Program kursu',
            'courseProgramTitle' => 'Zawartość kursu',
            'courseProgramIntro' => 'Tutaj znajdziesz dokładną rozpiskę modułów, lekcji, nagrań i materiałów dodatkowych.',
            'courseProgramEmptyState' => 'Program kursu jest właśnie uzupełniany.',
            'moduleLabel' => 'Moduł',
            'lessonLabel' => 'Lekcja',
            'materialsWord' => 'materiałów',
            'additionalMaterialsWord' => 'materiałów dodatkowych',
        ]);
    }

    $normalized = [];
    foreach ($defaults as $key => $defaultValue) {
        $scope = array_key_exists($key, [
            'heroFeaturesTitle' => true,
            'bonusMaterialsFallback' => true,
            'lifetimeAccessFallback' => true,
            'courseProgramEyebrow' => true,
            'courseProgramTitle' => true,
            'courseProgramIntro' => true,
            'courseProgramEmptyState' => true,
            'moduleLabel' => true,
            'lessonLabel' => true,
            'materialsWord' => true,
            'additionalMaterialsWord' => true,
        ]) ? 'course' : 'common';
        $globalCandidate = trim((string) ($settings[getTemplateContentSettingKey($scope, $key)] ?? ''));
        $candidate = trim((string) ($value[$key] ?? ''));
        $normalized[$key] = $candidate !== '' ? $candidate : ($globalCandidate !== '' ? $globalCandidate : $defaultValue);
    }

    return $normalized;
}

try {
    if (isset($_GET['slug'])) {
        $stmt = $db->prepare("SELECT id, title, slug, description, short_description, price, promotional_price, promotional_price_until, lowest_price_30_days, type, content_url, thumbnail_url, template_content_json, duration_label, long_description, benefits_json, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex, stripe_price_id FROM products WHERE slug = :slug AND type != 'service' AND COALESCE(is_published, 1) = 1");
        $stmt->execute([':slug' => $_GET['slug']]);
        $product = $stmt->fetch();

        if (!$product) {
            sendJson(['error' => 'Product not found'], 404);
        }

        $publicProduct = mapProduct($product);
        unset($publicProduct['content_url']);
        sendJson($publicProduct);
    }

    $stmt = $db->query("SELECT id, title, slug, price, promotional_price, promotional_price_until, lowest_price_30_days, type, thumbnail_url, description, short_description, template_content_json, duration_label, faq_json, meta_title, meta_desc, meta_image_url, canonical_url, noindex FROM products WHERE type != 'service' AND COALESCE(is_published, 1) = 1");
    $products = array_map('mapProduct', $stmt->fetchAll());
    sendJson($products);
} catch (Exception $e) {
    sendJson(['error' => $e->getMessage()], 500);
}