<?php
require_once __DIR__ . '/public_runtime.php';

$productSlug = trim((string) ($_GET['productSlug'] ?? ''));
$product = $productSlug !== '' ? publicRuntimeFetchProductBySlug($productSlug) : null;

if (!$product) {
  header('Location: /#oferta', true, 302);
    exit;
}

if (($product['type'] ?? '') === 'service') {
    $redirectSlug = PUBLIC_RUNTIME_SERVICE_SLUG_REDIRECTS[$product['slug']] ?? null;
    if ($redirectSlug) {
        header('Location: /' . $redirectSlug, true, 302);
        exit;
    }
}

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache, max-age=0, must-revalidate');

$offerPath = publicRuntimeFetchPagePath('offer');
$contactPath = publicRuntimeFetchPagePath('contact');
$termsPath = publicRuntimeFetchPagePath('terms');
$loginPath = '/logowanie';
$panelPath = '/panel';
$productPath = '/' . rawurlencode((string) $product['slug']);
$canonicalUrl = publicRuntimeBuildCanonicalUrl($product['canonical_url'] ?? null, $productPath);
$seoTitle = trim((string) ($product['meta_title'] ?? '')) !== ''
    ? (string) $product['meta_title']
    : ((string) $product['title'] . ' | Natalia Potocka');
$seoDescription = trim((string) ($product['meta_desc'] ?? '')) !== ''
    ? (string) $product['meta_desc']
    : ((string) ($product['lead'] ?: $product['title']));
$socialImage = trim((string) ($product['meta_image_url'] ?? '')) !== ''
    ? (string) $product['meta_image_url']
    : (trim((string) ($product['thumbnail_url'] ?? '')) !== '' ? (string) $product['thumbnail_url'] : '/images/hero_doula.png');
$socialImageUrl = publicRuntimeResolveAbsoluteUrl($socialImage);
$course = ($product['type'] ?? '') === 'course' ? publicRuntimeFetchCourseByProductId((string) $product['id']) : null;
$courseModules = is_array($course['modules'] ?? null) ? $course['modules'] : [];
$courseLessonsCount = 0;
foreach ($courseModules as $module) {
    $courseLessonsCount += count($module['lessons'] ?? []);
}
$currentPriceLabel = publicRuntimeFormatPrice((float) $product['current_price']);
$regularPriceLabel = publicRuntimeFormatPrice((float) $product['price']);
$lowestPriceLabel = ($product['lowest_price_30_days'] ?? null) !== null ? publicRuntimeFormatPrice((float) $product['lowest_price_30_days']) : null;
$hasCancellationNotice = isset($_GET['canceled']) && $_GET['canceled'] === 'true';

$structuredData = [
    '@context' => 'https://schema.org',
    '@type' => 'Product',
    'name' => (string) $product['title'],
    'description' => $seoDescription,
    'url' => $canonicalUrl,
    'image' => $socialImageUrl,
    'offers' => [
        '@type' => 'Offer',
        'priceCurrency' => 'PLN',
        'price' => number_format((float) $product['current_price'], 2, '.', ''),
        'availability' => 'https://schema.org/InStock',
        'url' => $canonicalUrl,
    ],
];
?><!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= publicRuntimeEscape($seoTitle) ?></title>
  <meta name="description" content="<?= publicRuntimeEscape($seoDescription) ?>">
  <link rel="canonical" href="<?= publicRuntimeEscape($canonicalUrl) ?>">
  <meta property="og:type" content="product">
  <meta property="og:title" content="<?= publicRuntimeEscape($seoTitle) ?>">
  <meta property="og:description" content="<?= publicRuntimeEscape($seoDescription) ?>">
  <meta property="og:url" content="<?= publicRuntimeEscape($canonicalUrl) ?>">
  <meta property="og:image" content="<?= publicRuntimeEscape($socialImageUrl) ?>">
  <meta name="twitter:card" content="summary_large_image">
  <?php if (!empty($product['noindex'])): ?>
  <meta name="robots" content="noindex, nofollow">
  <?php endif; ?>
  <script type="application/ld+json"><?= json_encode($structuredData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?></script>
  <style>
    :root {
      --bg: #f7f1ea;
      --surface: rgba(255, 255, 255, 0.78);
      --surface-strong: #fffdf9;
      --text: #4a2f3e;
      --muted: rgba(74, 47, 62, 0.68);
      --line: rgba(74, 47, 62, 0.12);
      --gold: #c79c47;
      --terracotta: #bc6d4f;
      --shadow: 0 28px 70px -42px rgba(74, 47, 62, 0.35);
      --radius: 30px;
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: Georgia, 'Times New Roman', serif;
      color: var(--text);
      background:
        radial-gradient(circle at top, rgba(234, 221, 215, 0.78), transparent 34%),
        linear-gradient(180deg, #faf7f2 0%, var(--bg) 100%);
    }

    img { max-width: 100%; display: block; }
    a { color: inherit; }
    button, input { font: inherit; }

    .shell { width: min(1160px, calc(100% - 32px)); margin: 0 auto; }
    .muted { color: var(--muted); }
    .eyebrow {
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--gold);
    }

    .hero {
      padding: 112px 0 48px;
      display: grid;
      gap: 40px;
      align-items: center;
    }

    .hero-grid,
    .content-grid {
      display: grid;
      gap: 36px;
    }

    .hero-media {
      position: relative;
      overflow: hidden;
      border-radius: 34px;
      min-height: 280px;
      background: rgba(199, 156, 71, 0.12);
      box-shadow: var(--shadow);
    }

    .hero-media img { width: 100%; height: 100%; object-fit: cover; }
    .hero-card,
    .surface-card {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      backdrop-filter: blur(10px);
      box-shadow: var(--shadow);
    }

    .hero-card { padding: 32px; }
    .hero-title { margin: 14px 0 0; font-size: clamp(2.4rem, 5vw, 4.2rem); line-height: 0.98; }
    .hero-lead { margin: 20px 0 0; font-size: 1.1rem; line-height: 1.9; }
    .breadcrumbs {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
      font-family: Arial, sans-serif; font-size: 0.92rem; color: rgba(74, 47, 62, 0.56);
    }
    .breadcrumbs a { text-decoration: none; }

    .price-wrap { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 18px; align-items: end; }
    .price-current { font-size: clamp(2.2rem, 4vw, 3.4rem); line-height: 1; color: var(--terracotta); }
    .price-old { text-decoration: line-through; color: rgba(74, 47, 62, 0.34); font-size: 1.2rem; }
    .price-note { margin-top: 10px; padding-left: 12px; border-left: 2px solid rgba(199, 156, 71, 0.4); font-family: Arial, sans-serif; font-size: 0.95rem; }

    .cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
    .button,
    .button-secondary {
      border: 0; cursor: pointer; text-decoration: none; border-radius: 18px; padding: 15px 22px;
      font-family: Arial, sans-serif; font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em;
      transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .button:hover,
    .button-secondary:hover { transform: translateY(-1px); }
    .button { background: var(--gold); color: white; box-shadow: 0 18px 34px -22px rgba(199, 156, 71, 0.9); }
    .button-secondary { background: rgba(74, 47, 62, 0.08); color: var(--text); }

    .notice {
      margin-top: 18px; padding: 14px 16px; border-radius: 18px;
      font-family: Arial, sans-serif; font-size: 0.95rem; line-height: 1.6;
      border: 1px solid rgba(188, 109, 79, 0.18); background: rgba(188, 109, 79, 0.09);
    }

    .section { padding: 28px 0 72px; }
    .section-title { margin: 0 0 14px; font-size: clamp(2rem, 4vw, 3rem); line-height: 1.05; }
    .body-copy,
    .rich-text { font-size: 1.06rem; line-height: 1.95; }
    .rich-text > :first-child { margin-top: 0; }
    .rich-text > :last-child { margin-bottom: 0; }
    .rich-text ul,
    .rich-text ol { padding-left: 20px; }
    .rich-text a { color: var(--terracotta); }

    .benefits,
    .faq-list,
    .module-list { display: grid; gap: 16px; }
    .benefits { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 28px; }
    .benefit-card,
    .faq-item,
    .module,
    .checkout-panel,
    .checkout-result { padding: 24px; border-radius: 24px; border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow); }
    .benefit-card h3,
    .module h3 { margin: 0 0 10px; font-size: 1.35rem; }
    .faq-item button {
      width: 100%; border: 0; background: transparent; padding: 0; text-align: left; cursor: pointer;
      display: flex; justify-content: space-between; gap: 12px; align-items: center; color: var(--text);
      font-size: 1.05rem; font-weight: 700;
    }
    .faq-answer { display: none; padding-top: 16px; color: var(--muted); font-family: Arial, sans-serif; line-height: 1.7; }
    .faq-item[data-open="true"] .faq-answer { display: block; }

    .content-grid { align-items: start; }
    .sticky-card { position: sticky; top: 28px; }
    .meta-list,
    .learning-points,
    .module-lessons { list-style: none; margin: 0; padding: 0; }
    .meta-list li,
    .learning-points li,
    .module-lessons li {
      padding: 10px 0; border-bottom: 1px solid var(--line); font-family: Arial, sans-serif; color: var(--muted);
    }
    .meta-list li:last-child,
    .learning-points li:last-child,
    .module-lessons li:last-child { border-bottom: 0; }

    .checkout-modal {
      position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
      padding: 20px; background: rgba(60, 32, 46, 0.42); backdrop-filter: blur(8px); z-index: 1000;
    }
    .checkout-modal[aria-hidden="false"] { display: flex; }
    .checkout-dialog {
      width: min(720px, 100%); max-height: min(90vh, 900px); overflow: auto; padding: 28px;
      border-radius: 28px; background: var(--surface-strong); box-shadow: 0 40px 80px -40px rgba(74, 47, 62, 0.6);
    }
    .checkout-close {
      margin-left: auto; display: block; border: 0; background: transparent; cursor: pointer;
      font-size: 1.8rem; line-height: 1; color: rgba(74, 47, 62, 0.5);
    }
    .form-grid { display: grid; gap: 14px; }
    .form-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .field label { display: block; margin-bottom: 7px; font-family: Arial, sans-serif; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(74, 47, 62, 0.58); }
    .field input,
    .field textarea,
    .field select {
      width: 100%; border: 1px solid var(--line); border-radius: 16px; background: #fff; padding: 13px 15px; color: var(--text);
    }
    .check-row,
    .payment-option {
      display: flex; gap: 12px; align-items: start; padding: 14px 16px; border: 1px solid var(--line); border-radius: 18px; background: rgba(247, 241, 234, 0.65); font-family: Arial, sans-serif; color: var(--muted);
    }
    .payment-option input,
    .check-row input { margin-top: 3px; }
    .checkout-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
    .status-box { margin-top: 16px; padding: 14px 16px; border-radius: 18px; font-family: Arial, sans-serif; line-height: 1.6; }
    .status-box.error { background: rgba(188, 109, 79, 0.1); border: 1px solid rgba(188, 109, 79, 0.18); color: #8f4e37; }
    .status-box.info { background: rgba(199, 156, 71, 0.12); border: 1px solid rgba(199, 156, 71, 0.2); }
    .hidden { display: none !important; }

    @media (min-width: 900px) {
      .hero { grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr); }
      .content-grid { grid-template-columns: minmax(0, 1fr) minmax(320px, 360px); }
    }

    @media (max-width: 720px) {
      .shell { width: min(100% - 24px, 1160px); }
      .hero { padding-top: 92px; }
      .hero-card, .benefit-card, .faq-item, .module, .checkout-panel, .checkout-result, .checkout-dialog { padding: 20px; }
      .form-grid.two { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="hero">
      <div class="hero-media">
        <?php if (!empty($product['thumbnail_url'])): ?>
        <img src="<?= publicRuntimeEscape((string) $product['thumbnail_url']) ?>" alt="<?= publicRuntimeEscape((string) $product['title']) ?>" loading="eager" fetchpriority="high">
        <?php else: ?>
        <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:32px;font-size:2rem;text-align:center;"><?= publicRuntimeEscape((string) $product['title']) ?></div>
        <?php endif; ?>
      </div>

      <div class="hero-card">
        <nav class="breadcrumbs" aria-label="Breadcrumbs">
          <a href="/">Strona główna</a>
          <span>/</span>
          <a href="<?= publicRuntimeEscape($offerPath) ?>">Oferta</a>
          <span>/</span>
          <span><?= publicRuntimeEscape((string) $product['title']) ?></span>
        </nav>

        <p class="eyebrow"><?= publicRuntimeEscape(($product['type'] ?? '') === 'course' ? 'Szkolenie online' : (($product['type'] ?? '') === 'audio' ? 'Medytacja audio' : 'Produkt cyfrowy')) ?></p>
        <h1 class="hero-title"><?= publicRuntimeEscape((string) $product['title']) ?></h1>
        <?php if ($seoDescription !== ''): ?>
        <p class="hero-lead muted"><?= publicRuntimeEscape($seoDescription) ?></p>
        <?php endif; ?>

        <div class="price-wrap">
          <div>
            <?php if (!empty($product['promo_active'])): ?>
            <div class="price-old"><?= publicRuntimeEscape($regularPriceLabel) ?></div>
            <?php endif; ?>
            <div class="price-current"><?= publicRuntimeEscape($currentPriceLabel) ?></div>
            <?php if (!empty($product['promo_active']) && $lowestPriceLabel !== null): ?>
            <div class="price-note">Najniższa cena z 30 dni przed obniżką: <?= publicRuntimeEscape($lowestPriceLabel) ?></div>
            <?php endif; ?>
          </div>
        </div>

        <div class="cta-row">
          <button type="button" class="button" data-open-checkout>Kup dostęp</button>
          <a href="<?= publicRuntimeEscape($contactPath) ?>" class="button-secondary">Zapytaj o wsparcie</a>
        </div>

        <?php if ($hasCancellationNotice): ?>
        <div class="notice">Płatność została anulowana. Możesz wrócić do zakupu w dowolnym momencie.</div>
        <?php endif; ?>
      </div>
    </section>

    <section class="section">
      <div class="content-grid">
        <div>
          <?php if (!empty($product['description_html'])): ?>
          <div class="surface-card" style="padding: 26px; margin-bottom: 24px;">
            <p class="eyebrow">Opis</p>
            <div class="rich-text"><?= $product['description_html'] ?></div>
          </div>
          <?php endif; ?>

          <?php if (($product['type'] ?? '') === 'course' && !empty($product['learning_points'])): ?>
          <div class="surface-card" style="padding: 26px; margin-bottom: 24px;">
            <h2 class="section-title" style="font-size:2rem;">Czego się nauczysz</h2>
            <ul class="learning-points">
              <?php foreach ($product['learning_points'] as $point): ?>
              <li><?= publicRuntimeEscape((string) $point) ?></li>
              <?php endforeach; ?>
            </ul>
          </div>
          <?php endif; ?>

          <?php if (!empty($product['benefits_json'])): ?>
          <div>
            <h2 class="section-title">Co zyskasz</h2>
            <div class="benefits">
              <?php foreach ($product['benefits_json'] as $benefit): ?>
              <article class="benefit-card">
                <p class="eyebrow">Korzyść</p>
                <h3><?= publicRuntimeEscape((string) ($benefit['title'] ?? '')) ?></h3>
                <p class="muted body-copy" style="margin:0;"><?= publicRuntimeEscape((string) ($benefit['description'] ?? '')) ?></p>
              </article>
              <?php endforeach; ?>
            </div>
          </div>
          <?php endif; ?>

          <?php if (($product['type'] ?? '') === 'course' && !empty($courseModules)): ?>
          <div style="margin-top: 40px;">
            <h2 class="section-title">Program szkolenia</h2>
            <div class="module-list">
              <?php foreach ($courseModules as $module): ?>
              <section class="module">
                <h3><?= publicRuntimeEscape((string) ($module['title'] ?? 'Moduł')) ?></h3>
                <?php if (!empty($module['description'])): ?>
                <p class="muted body-copy" style="margin-top:0;"><?= publicRuntimeEscape((string) $module['description']) ?></p>
                <?php endif; ?>
                <ul class="module-lessons">
                  <?php foreach (($module['lessons'] ?? []) as $lesson): ?>
                  <li>
                    <strong><?= publicRuntimeEscape((string) ($lesson['title'] ?? 'Lekcja')) ?></strong>
                    <?php if (!empty($lesson['duration_minutes'])): ?>
                    <span class="muted">, <?= publicRuntimeEscape((string) $lesson['duration_minutes']) ?> min</span>
                    <?php endif; ?>
                  </li>
                  <?php endforeach; ?>
                </ul>
              </section>
              <?php endforeach; ?>
            </div>
          </div>
          <?php endif; ?>

          <?php if (!empty($product['long_description_html'])): ?>
          <div style="margin-top: 40px;">
            <h2 class="section-title">Szczegóły</h2>
            <div class="surface-card" style="padding: 26px;">
              <div class="rich-text"><?= $product['long_description_html'] ?></div>
            </div>
          </div>
          <?php endif; ?>

          <?php if (!empty($product['faq_json'])): ?>
          <div style="margin-top: 40px;">
            <h2 class="section-title">Najczęstsze pytania</h2>
            <div class="faq-list">
              <?php foreach ($product['faq_json'] as $faq): ?>
              <article class="faq-item" data-faq-item>
                <button type="button" data-faq-toggle aria-expanded="false">
                  <span><?= publicRuntimeEscape((string) $faq['q']) ?></span>
                  <span aria-hidden="true">+</span>
                </button>
                <div class="faq-answer"><?= nl2br(publicRuntimeEscape((string) $faq['a'])) ?></div>
              </article>
              <?php endforeach; ?>
            </div>
          </div>
          <?php endif; ?>
        </div>

        <aside class="sticky-card">
          <div class="checkout-panel">
            <p class="eyebrow">Zakup bez publish</p>
            <h2 style="margin: 12px 0 0; font-size: 1.9rem;">Ta wersja działa bez rebuilda GitHub</h2>
            <p class="muted body-copy">Treść, cena i SEO tej strony są czytane bezpośrednio z produkcyjnej bazy danych przy każdym wejściu.</p>

            <ul class="meta-list" style="margin-top: 18px;">
              <?php if (($product['type'] ?? '') === 'course'): ?>
              <li><?= publicRuntimeEscape((string) count($courseModules)) ?> modułów</li>
              <li><?= publicRuntimeEscape((string) $courseLessonsCount) ?> lekcji</li>
              <?php endif; ?>
              <?php if (!empty($product['duration_label'])): ?>
              <li><?= publicRuntimeEscape((string) $product['duration_label']) ?></li>
              <?php endif; ?>
              <li>Natychmiastowy dostęp po opłaceniu</li>
              <li>Stripe: karta, BLIK, Przelewy24</li>
            </ul>

            <div class="cta-row">
              <button type="button" class="button" data-open-checkout>Kup teraz</button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>

  <div class="checkout-modal" aria-hidden="true" data-checkout-modal>
    <div class="checkout-dialog">
      <button type="button" class="checkout-close" aria-label="Zamknij" data-close-checkout>&times;</button>
      <p class="eyebrow">Zakup</p>
      <h2 style="margin:12px 0 0; font-size:2rem;">Kupujesz: <?= publicRuntimeEscape((string) $product['title']) ?></h2>
      <p class="muted body-copy" style="margin-top:10px;">Płatność korzysta z obecnego backendu checkout. Ta warstwa tylko renderuje publiczną stronę runtime.</p>

      <div class="status-box info hidden" data-checkout-config-message></div>
      <div class="status-box error hidden" data-checkout-error></div>

      <form data-checkout-form>
        <div class="form-grid two">
          <div class="field">
            <label for="checkout-first-name">Imię</label>
            <input id="checkout-first-name" name="first_name" type="text" required>
          </div>
          <div class="field">
            <label for="checkout-last-name">Nazwisko</label>
            <input id="checkout-last-name" name="last_name" type="text" required>
          </div>
        </div>

        <div class="form-grid" style="margin-top:14px;">
          <div class="field">
            <label for="checkout-email">Adres e-mail</label>
            <input id="checkout-email" name="email" type="email" required>
          </div>
        </div>

        <label class="check-row" style="margin-top:14px;">
          <input type="checkbox" name="setPasswordNow" value="1">
          <span>Chcę od razu ustawić hasło do konta.</span>
        </label>

        <div class="form-grid two hidden" data-password-fields style="margin-top:14px;">
          <div class="field">
            <label for="checkout-password">Hasło</label>
            <input id="checkout-password" name="password" type="password" minlength="12">
          </div>
          <div class="field">
            <label for="checkout-password-confirm">Powtórz hasło</label>
            <input id="checkout-password-confirm" name="password_confirm" type="password" minlength="12">
          </div>
        </div>

        <div class="field" style="margin-top:14px;">
          <label for="checkout-coupon">Kod rabatowy</label>
          <input id="checkout-coupon" name="couponCode" type="text" placeholder="Wpisz kod, jeśli go masz">
        </div>

        <div class="form-grid" style="margin-top:14px;">
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="stripe" checked>
            <span><strong>Stripe</strong><br>Karta, BLIK, Przelewy24</span>
          </label>
          <label class="payment-option">
            <input type="radio" name="paymentMethod" value="bank_transfer">
            <span><strong>Przelew tradycyjny</strong><br>Zamówienie zapisze się jako oczekujące.</span>
          </label>
        </div>

        <div class="form-grid" style="margin-top:14px;">
          <label class="check-row">
            <input type="checkbox" name="termsAccepted" value="1" required>
            <span>Akceptuję <a href="<?= publicRuntimeEscape($termsPath) ?>" target="_blank" rel="noopener noreferrer">regulamin sklepu</a>.</span>
          </label>
          <label class="check-row">
            <input type="checkbox" name="digitalContentAccepted" value="1" required>
            <span>Wyrażam zgodę na dostarczenie treści cyfrowej przed upływem terminu odstąpienia od umowy.</span>
          </label>
        </div>

        <div class="checkout-actions">
          <button type="submit" class="button" data-submit-checkout>Przejdź do płatności</button>
          <a href="<?= publicRuntimeEscape($loginPath) ?>" class="button-secondary">Mam już konto</a>
          <a href="<?= publicRuntimeEscape($panelPath) ?>" class="button-secondary hidden" data-checkout-panel-link>Przejdź do panelu</a>
        </div>
      </form>

      <div class="checkout-result hidden" data-bank-result style="margin-top:18px;">
        <h3 style="margin-top:0;">Instrukcje przelewu</h3>
        <div class="body-copy muted" data-bank-result-content></div>
      </div>
    </div>
  </div>

  <script>
    (() => {
      const modal = document.querySelector('[data-checkout-modal]');
      const openButtons = document.querySelectorAll('[data-open-checkout]');
      const closeButtons = document.querySelectorAll('[data-close-checkout]');
      const form = document.querySelector('[data-checkout-form]');
      const errorBox = document.querySelector('[data-checkout-error]');
      const configMessage = document.querySelector('[data-checkout-config-message]');
      const passwordToggle = form?.querySelector('input[name="setPasswordNow"]');
      const passwordFields = document.querySelector('[data-password-fields]');
      const submitButton = document.querySelector('[data-submit-checkout]');
      const bankResult = document.querySelector('[data-bank-result]');
      const bankResultContent = document.querySelector('[data-bank-result-content]');
      const panelLink = document.querySelector('[data-checkout-panel-link]');
      const paymentInputs = Array.from(form?.querySelectorAll('input[name="paymentMethod"]') || []);
      const productId = <?= json_encode((string) $product['id']) ?>;

      const show = (element, visible) => {
        if (!element) return;
        element.classList.toggle('hidden', !visible);
      };

      const setError = (message = '') => {
        if (!errorBox) return;
        errorBox.textContent = message;
        show(errorBox, Boolean(message));
      };

      const openModal = async () => {
        modal?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setError('');
        show(bankResult, false);
        await loadConfig();
      };

      const closeModal = () => {
        modal?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      };

      const loadConfig = async () => {
        try {
          const response = await fetch('/api/checkout/config', { credentials: 'same-origin' });
          const data = await response.json();
          const stripeAvailable = data?.paymentMethods?.stripe?.available !== false;
          const bankAvailable = data?.paymentMethods?.bankTransfer?.available === true;

          paymentInputs.forEach((input) => {
            if (!(input instanceof HTMLInputElement)) return;
            if (input.value === 'stripe') {
              input.disabled = !stripeAvailable;
              if (!stripeAvailable && input.checked) {
                input.checked = false;
              }
            }
            if (input.value === 'bank_transfer') {
              input.disabled = !bankAvailable;
            }
          });

          if (!paymentInputs.some((input) => input.checked && !input.disabled)) {
            const firstAvailable = paymentInputs.find((input) => !input.disabled);
            if (firstAvailable) firstAvailable.checked = true;
          }

          const messages = [];
          if (!stripeAvailable && data?.paymentMethods?.stripe?.reason) messages.push(data.paymentMethods.stripe.reason);
          if (!bankAvailable && data?.paymentMethods?.bankTransfer?.reason) messages.push(data.paymentMethods.bankTransfer.reason);
          if (configMessage) {
            configMessage.textContent = messages.join(' ');
            show(configMessage, messages.length > 0);
          }
        } catch (error) {
          if (configMessage) {
            configMessage.textContent = 'Nie udało się pobrać konfiguracji płatności. Spróbuj ponownie za chwilę.';
            show(configMessage, true);
          }
        }
      };

      openButtons.forEach((button) => button.addEventListener('click', openModal));
      closeButtons.forEach((button) => button.addEventListener('click', closeModal));
      modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
      });

      passwordToggle?.addEventListener('change', () => {
        show(passwordFields, passwordToggle.checked);
      });

      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!(form instanceof HTMLFormElement) || !(submitButton instanceof HTMLButtonElement)) return;

        setError('');
        show(bankResult, false);
        submitButton.disabled = true;

        const formData = new FormData(form);
        const payload = {
          productId,
          paymentMethod: formData.get('paymentMethod') || 'stripe',
          couponCode: String(formData.get('couponCode') || '').trim(),
          termsAccepted: formData.get('termsAccepted') === '1',
          digitalContentAccepted: formData.get('digitalContentAccepted') === '1',
          customer: {
            firstName: String(formData.get('first_name') || '').trim(),
            lastName: String(formData.get('last_name') || '').trim(),
            email: String(formData.get('email') || '').trim(),
            setPasswordNow: formData.get('setPasswordNow') === '1',
            password: String(formData.get('password') || ''),
            passwordConfirm: String(formData.get('password_confirm') || ''),
          },
        };

        try {
          const response = await fetch('/api/checkout/create-session', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data?.error || 'Nie udało się rozpocząć płatności.');
          }

          if (data?.url) {
            window.location.href = data.url;
            return;
          }

          if (data?.bankTransfer && bankResultContent) {
            const transfer = data.bankTransfer;
            const lines = [
              `Kwota: ${Number(transfer.amount || 0).toFixed(2)} PLN`,
              `Odbiorca: ${transfer.accountName || '-'}`,
              transfer.bankName ? `Bank: ${transfer.bankName}` : '',
              `Numer konta: ${transfer.accountNumber || '-'}`,
              `Tytuł przelewu: ${transfer.transferTitle || '-'}`,
              transfer.instructions ? `Dodatkowe informacje: ${transfer.instructions}` : '',
            ].filter(Boolean);
            bankResultContent.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');
            show(bankResult, true);
          }

          if (data?.checkoutIdentity?.requiresEmailConfirmation && panelLink instanceof HTMLElement) {
            panelLink.classList.remove('hidden');
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Wystąpił błąd podczas przygotowania płatności.');
        } finally {
          submitButton.disabled = false;
        }
      });

      document.querySelectorAll('[data-faq-item]').forEach((item) => {
        const toggle = item.querySelector('[data-faq-toggle]');
        if (!(toggle instanceof HTMLButtonElement)) return;
        toggle.addEventListener('click', () => {
          const isOpen = item.getAttribute('data-open') === 'true';
          item.setAttribute('data-open', isOpen ? 'false' : 'true');
          toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        });
      });
    })();
  </script>
</body>
</html>