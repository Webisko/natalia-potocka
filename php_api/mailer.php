<?php

function mailer_read_setting(string $key): string {
    global $db;

    if (!isset($db)) {
        return '';
    }

    $stmt = $db->prepare('SELECT value FROM settings WHERE key = ?');
    $stmt->execute([$key]);
    return trim((string) ($stmt->fetchColumn() ?: ''));
}

function mailer_detect_base_url(): string {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    return ($isHttps ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function mailer_detect_host(): string {
    $host = strtolower(trim((string) ($_SERVER['HTTP_HOST'] ?? 'localhost')));
    $host = preg_replace('/:\d+$/', '', $host) ?: 'localhost';
    return $host;
}

function mailer_resolve_sender_email(): string {
    $configured = trim(mailer_read_setting('notify_email'));
    if ($configured !== '' && filter_var($configured, FILTER_VALIDATE_EMAIL)) {
        return $configured;
    }

    $host = mailer_detect_host();
    if ($host === 'localhost') {
        return 'no-reply@localhost';
    }

    return 'kontakt@' . $host;
}

function mailer_resolve_admin_email(): string {
    $configured = trim(mailer_read_setting('notify_email'));
    if ($configured !== '' && filter_var($configured, FILTER_VALIDATE_EMAIL)) {
        return $configured;
    }

    return mailer_resolve_sender_email();
}

function mailer_brand_name(): string {
    return 'Natalia Potocka';
}

function mailer_encode_header(string $value): string {
    if ($value === '') {
        return '';
    }

    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($value, 'UTF-8', 'B', "\r\n");
    }

    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function mailer_escape(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function mailer_format_price(float $value): string {
    return number_format($value, 2, ',', ' ') . ' PLN';
}

function mailer_plain_text(string $html): string {
    $text = preg_replace('/<\s*br\s*\/?>/i', "\n", $html);
    $text = preg_replace('/<\/(p|div|h1|h2|h3|li|tr|section)>/i', "$0\n", (string) $text);
    $text = strip_tags((string) $text);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $text = preg_replace("/\n{3,}/", "\n\n", (string) $text);
    return trim((string) $text);
}

function mailer_send_message(string $to, string $subject, string $html, ?string $plainText = null, array $options = []): bool {
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        error_log('[mailer] Invalid recipient: ' . $to);
        return false;
    }

    $fromEmail = $options['fromEmail'] ?? mailer_resolve_sender_email();
    $fromName = $options['fromName'] ?? mailer_brand_name();
    $replyTo = $options['replyTo'] ?? $fromEmail;
    $plainText = trim((string) ($plainText ?? mailer_plain_text($html)));
    $boundary = '=_np_' . bin2hex(random_bytes(12));

    $headers = [];
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'From: ' . mailer_encode_header($fromName) . ' <' . $fromEmail . '>';
    $headers[] = 'Reply-To: ' . $replyTo;
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';

    $body = [];
    $body[] = '--' . $boundary;
    $body[] = 'Content-Type: text/plain; charset=UTF-8';
    $body[] = 'Content-Transfer-Encoding: 8bit';
    $body[] = '';
    $body[] = $plainText;
    $body[] = '';
    $body[] = '--' . $boundary;
    $body[] = 'Content-Type: text/html; charset=UTF-8';
    $body[] = 'Content-Transfer-Encoding: 8bit';
    $body[] = '';
    $body[] = $html;
    $body[] = '';
    $body[] = '--' . $boundary . '--';

    $sent = @mail($to, mailer_encode_header($subject), implode("\r\n", $body), implode("\r\n", $headers));

    if (!$sent) {
        error_log('[mailer] mail() failed for ' . $to . ' subject=' . $subject);
    }

    return $sent;
}

function mailer_render_button(string $url, string $label): string {
    return '<a href="' . mailer_escape($url) . '" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#d6a55b;color:#fffaf5;text-decoration:none;font-weight:700;font-size:15px;line-height:1.2;">' . mailer_escape($label) . '</a>';
}

function mailer_render_kv_rows(array $rows): string {
    $html = '';

    foreach ($rows as $label => $value) {
        if ($value === null || $value === '') {
            continue;
        }

        $html .= '<tr>';
        $html .= '<td style="padding:10px 0;color:#6f6172;font-size:13px;vertical-align:top;width:34%;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">' . mailer_escape((string) $label) . '</td>';
        $html .= '<td style="padding:10px 0;color:#433846;font-size:15px;vertical-align:top;">' . nl2br(mailer_escape((string) $value)) . '</td>';
        $html .= '</tr>';
    }

    return $html;
}

function mailer_render_layout(array $payload): string {
    $brand = mailer_brand_name();
    $baseUrl = mailer_detect_base_url();
    $preheader = trim((string) ($payload['preheader'] ?? ''));
    $eyebrow = trim((string) ($payload['eyebrow'] ?? 'Natalia Potocka'));
    $heading = trim((string) ($payload['heading'] ?? ''));
    $intro = trim((string) ($payload['intro'] ?? ''));
    $bodyHtml = trim((string) ($payload['bodyHtml'] ?? ''));
    $detailsHtml = trim((string) ($payload['detailsHtml'] ?? ''));
    $noticeHtml = trim((string) ($payload['noticeHtml'] ?? ''));
    $footerHtml = trim((string) ($payload['footerHtml'] ?? 'Masz pytania? Odpowiedz na tę wiadomość lub skontaktuj się przez stronę.'));
    $actions = is_array($payload['actions'] ?? null) ? $payload['actions'] : [];

    $actionHtml = '';
    foreach ($actions as $action) {
        $url = trim((string) ($action['url'] ?? ''));
        $label = trim((string) ($action['label'] ?? ''));
        if ($url === '' || $label === '') {
            continue;
        }
        $actionHtml .= '<td style="padding:0 12px 12px 0;">' . mailer_render_button($url, $label) . '</td>';
    }
    if ($actionHtml !== '') {
        $actionHtml = '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;"><tr>' . $actionHtml . '</tr></table>';
    }

    return '<!DOCTYPE html>'
        . '<html lang="pl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' . mailer_escape($heading) . '</title></head>'
        . '<body style="margin:0;padding:0;background:#f6eee8;font-family:Georgia, Times New Roman, serif;color:#433846;">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">' . mailer_escape($preheader) . '</div>'
        . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6eee8;padding:28px 12px;">'
        . '<tr><td align="center">'
        . '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:680px;">'
        . '<tr><td style="padding:0 0 18px 0;text-align:center;color:#7f6a76;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;">' . mailer_escape($eyebrow) . '</td></tr>'
        . '<tr><td style="background:linear-gradient(180deg,#fff9f3 0%,#fffdf9 100%);border:1px solid #eadccf;border-radius:30px;overflow:hidden;box-shadow:0 12px 40px rgba(92,63,77,0.08);">'
        . '<div style="padding:42px 42px 18px;background:radial-gradient(circle at top left,#f5e6d8 0,#fff9f3 58%,#fffdf9 100%);">'
        . '<div style="font-size:13px;line-height:1.4;color:#b1845a;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">' . mailer_escape($brand) . '</div>'
        . '<h1 style="margin:16px 0 14px;font-size:34px;line-height:1.15;color:#433846;font-weight:400;">' . mailer_escape($heading) . '</h1>'
        . '<p style="margin:0;font-size:17px;line-height:1.75;color:#5d505c;">' . nl2br(mailer_escape($intro)) . '</p>'
        . $actionHtml
        . '</div>'
        . '<div style="padding:0 42px 36px;">'
        . ($noticeHtml !== '' ? '<div style="margin:0 0 24px;padding:18px 20px;border-radius:22px;background:#f4ebe4;border:1px solid #ead7c3;color:#5d505c;font-size:14px;line-height:1.7;">' . $noticeHtml . '</div>' : '')
        . ($bodyHtml !== '' ? '<div style="font-size:15px;line-height:1.8;color:#433846;">' . $bodyHtml . '</div>' : '')
        . ($detailsHtml !== '' ? '<div style="margin-top:28px;padding:24px 26px;border-radius:24px;background:#fffaf6;border:1px solid #eadccf;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' . $detailsHtml . '</table></div>' : '')
        . '<div style="margin-top:28px;padding-top:20px;border-top:1px solid #eadccf;font-size:13px;line-height:1.7;color:#7b6e79;">' . $footerHtml . '<br><a href="' . mailer_escape($baseUrl) . '" style="color:#b1845a;text-decoration:none;">' . mailer_escape($baseUrl) . '</a></div>'
        . '</div>'
        . '</td></tr></table>'
        . '</td></tr></table></body></html>';
}

function mailer_send_account_confirmation(string $email, string $confirmUrl, array $context = []): bool {
    $firstName = trim((string) ($context['firstName'] ?? ''));
    $heading = 'Potwierdź swój adres e-mail';
    $intro = ($firstName !== '' ? $firstName . ', ' : '') . 'Twoje konto jest prawie gotowe. Potwierdź adres e-mail, aby aktywować dostęp do materiałów i bezpiecznie korzystać z platformy.';

    $html = mailer_render_layout([
        'preheader' => 'Potwierdź adres e-mail i aktywuj konto.',
        'heading' => $heading,
        'intro' => $intro,
        'bodyHtml' => '<p style="margin:0 0 16px;">Po kliknięciu przycisku konto zostanie aktywowane. Jeśli ta wiadomość dotarła do Ciebie omyłkowo, możesz ją po prostu zignorować.</p>',
        'actions' => [
            ['url' => $confirmUrl, 'label' => 'Potwierdź adres e-mail'],
        ],
        'footerHtml' => 'Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br>' . mailer_escape($confirmUrl),
    ]);

    return mailer_send_message($email, $heading, $html);
}

function mailer_send_password_reset(string $email, string $resetUrl, array $context = []): bool {
    $firstName = trim((string) ($context['firstName'] ?? ''));
    $heading = 'Ustaw nowe hasło';
    $intro = ($firstName !== '' ? $firstName . ', ' : '') . 'otrzymaliśmy prośbę o ustawienie nowego hasła do Twojego konta.';

    $html = mailer_render_layout([
        'preheader' => 'Ustaw nowe hasło do swojego konta.',
        'heading' => $heading,
        'intro' => $intro,
        'bodyHtml' => '<p style="margin:0 0 16px;">Link do zmiany hasła jest ważny przez ograniczony czas. Jeśli nie prosiłaś o zmianę hasła, zignoruj tę wiadomość.</p>',
        'actions' => [
            ['url' => $resetUrl, 'label' => 'Ustaw nowe hasło'],
        ],
        'footerHtml' => 'Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br>' . mailer_escape($resetUrl),
    ]);

    return mailer_send_message($email, $heading, $html);
}

function mailer_send_email_change_confirmation(string $email, string $confirmUrl, array $context = []): bool {
    $firstName = trim((string) ($context['firstName'] ?? ''));
    $currentEmail = trim((string) ($context['currentEmail'] ?? ''));
    $heading = 'Potwierdź nowy adres e-mail';
    $intro = ($firstName !== '' ? $firstName . ', ' : '') . 'aby zakończyć zmianę danych konta, potwierdź nowy adres e-mail.';

    $bodyHtml = '<p style="margin:0 0 16px;">Po kliknięciu przycisku nowy adres zostanie przypisany do Twojego konta. Do tego momentu nadal działa Twój obecny login.</p>';
    if ($currentEmail !== '') {
        $bodyHtml .= '<p style="margin:0;">Aktualny adres konta: <strong>' . mailer_escape($currentEmail) . '</strong></p>';
    }

    $html = mailer_render_layout([
        'preheader' => 'Potwierdź nowy adres e-mail dla swojego konta.',
        'heading' => $heading,
        'intro' => $intro,
        'bodyHtml' => $bodyHtml,
        'actions' => [
            ['url' => $confirmUrl, 'label' => 'Potwierdź nowy adres'],
        ],
        'footerHtml' => 'Jeśli to nie Ty prosiłaś o zmianę, zignoruj tę wiadomość. Jeśli przycisk nie działa, skopiuj i wklej ten link do przeglądarki:<br>' . mailer_escape($confirmUrl),
    ]);

    return mailer_send_message($email, $heading, $html);
}

function mailer_send_order_success_customer(array $order): bool {
    $heading = 'Płatność została przyjęta';
    $intro = 'Dziękuję. Twoje zamówienie zostało opłacone, a produkt został przypisany do Twojego konta.';
    $actions = [];

    if (!empty($order['libraryUrl'])) {
        $actions[] = ['url' => (string) $order['libraryUrl'], 'label' => 'Przejdź do biblioteki'];
    }
    if (!empty($order['confirmUrl'])) {
        $actions[] = ['url' => (string) $order['confirmUrl'], 'label' => 'Potwierdź adres e-mail'];
    }
    if (!empty($order['resetUrl'])) {
        $actions[] = ['url' => (string) $order['resetUrl'], 'label' => 'Ustaw hasło'];
    }

    $notice = '';
    if (!empty($order['confirmUrl'])) {
        $notice = 'Aby wejść do materiałów, potwierdź adres e-mail. Po potwierdzeniu konto będzie w pełni aktywne.';
    }

    $bodyHtml = '<p style="margin:0 0 16px;">W panelu klienta znajdziesz zakupione materiały oraz dalsze kroki. Jeśli kupowałaś po raz pierwszy i nie ustawiłaś jeszcze hasła, zrobisz to z poziomu przycisku poniżej.</p>';

    $details = mailer_render_kv_rows([
        'Produkt' => (string) ($order['productTitle'] ?? ''),
        'Kwota' => isset($order['amountTotal']) ? mailer_format_price((float) $order['amountTotal']) : '',
        'Numer zamówienia' => (string) ($order['orderId'] ?? ''),
        'E-mail' => (string) ($order['customerEmail'] ?? ''),
        'Kod rabatowy' => (string) ($order['couponCode'] ?? ''),
    ]);

    $html = mailer_render_layout([
        'preheader' => 'Płatność zakończyła się powodzeniem.',
        'heading' => $heading,
        'intro' => $intro,
        'noticeHtml' => $notice,
        'bodyHtml' => $bodyHtml,
        'detailsHtml' => $details,
        'actions' => $actions,
    ]);

    return mailer_send_message((string) $order['customerEmail'], $heading . ' • ' . (string) ($order['productTitle'] ?? 'zamówienie'), $html);
}

function mailer_send_order_success_admin(array $order): bool {
    $heading = 'Nowe opłacone zamówienie';
    $intro = 'System zarejestrował opłacone zamówienie produktu cyfrowego i nadał dostęp do materiałów.';

    $details = mailer_render_kv_rows([
        'Produkt' => (string) ($order['productTitle'] ?? ''),
        'Kwota' => isset($order['amountTotal']) ? mailer_format_price((float) $order['amountTotal']) : '',
        'Numer zamówienia' => (string) ($order['orderId'] ?? ''),
        'E-mail klientki' => (string) ($order['customerEmail'] ?? ''),
        'Typ płatności' => 'Stripe',
        'Kod rabatowy' => (string) ($order['couponCode'] ?? ''),
    ]);

    $html = mailer_render_layout([
        'eyebrow' => 'Powiadomienie administracyjne',
        'preheader' => 'Opłacone zamówienie zostało zapisane.',
        'heading' => $heading,
        'intro' => $intro,
        'detailsHtml' => $details,
        'actions' => !empty($order['adminUrl']) ? [['url' => (string) $order['adminUrl'], 'label' => 'Otwórz panel administratora']] : [],
    ]);

    return mailer_send_message(mailer_resolve_admin_email(), $heading . ' • ' . (string) ($order['productTitle'] ?? 'zamówienie'), $html);
}

function mailer_send_order_failed_customer(array $order): bool {
    $heading = 'Płatność nie została zakończona';
    $intro = 'Nie udało się potwierdzić płatności za wybrany produkt. Dostęp nie został jeszcze nadany.';

    $details = mailer_render_kv_rows([
        'Produkt' => (string) ($order['productTitle'] ?? ''),
        'Kwota' => isset($order['amountTotal']) ? mailer_format_price((float) $order['amountTotal']) : '',
        'Numer sesji płatności' => (string) ($order['sessionId'] ?? ''),
        'E-mail' => (string) ($order['customerEmail'] ?? ''),
    ]);

    $html = mailer_render_layout([
        'preheader' => 'Płatność nie została zakończona powodzeniem.',
        'heading' => $heading,
        'intro' => $intro,
        'noticeHtml' => 'Jeśli nadal chcesz kupić materiał, możesz ponowić płatność z poziomu strony produktu albo skontaktować się z nami, jeśli problem się powtarza.',
        'detailsHtml' => $details,
        'actions' => !empty($order['retryUrl']) ? [['url' => (string) $order['retryUrl'], 'label' => 'Spróbuj ponownie']] : [],
    ]);

    return mailer_send_message((string) $order['customerEmail'], $heading . ' • ' . (string) ($order['productTitle'] ?? 'zamówienie'), $html);
}

function mailer_send_order_failed_admin(array $order): bool {
    $heading = 'Nieudana płatność';
    $intro = 'Stripe zwrócił informację o nieudanej płatności. Zamówienie nie zostało sfinalizowane.';

    $details = mailer_render_kv_rows([
        'Produkt' => (string) ($order['productTitle'] ?? ''),
        'Kwota' => isset($order['amountTotal']) ? mailer_format_price((float) $order['amountTotal']) : '',
        'Numer sesji płatności' => (string) ($order['sessionId'] ?? ''),
        'E-mail klientki' => (string) ($order['customerEmail'] ?? ''),
        'Typ płatności' => 'Stripe',
    ]);

    $html = mailer_render_layout([
        'eyebrow' => 'Powiadomienie administracyjne',
        'preheader' => 'Nieudana próba płatności Stripe.',
        'heading' => $heading,
        'intro' => $intro,
        'detailsHtml' => $details,
        'actions' => !empty($order['adminUrl']) ? [['url' => (string) $order['adminUrl'], 'label' => 'Otwórz panel administratora']] : [],
    ]);

    return mailer_send_message(mailer_resolve_admin_email(), $heading . ' • ' . (string) ($order['productTitle'] ?? 'zamówienie'), $html);
}

function mailer_send_bank_transfer_customer(array $order): bool {
    $heading = 'Instrukcja przelewu tradycyjnego';
    $intro = 'Zamówienie zostało zapisane. Aby aktywować dostęp do materiału, wykonaj przelew zgodnie z poniższymi danymi.';
    $actions = [];

    if (!empty($order['confirmUrl'])) {
        $actions[] = ['url' => (string) $order['confirmUrl'], 'label' => 'Potwierdź adres e-mail'];
    }
    if (!empty($order['resetUrl'])) {
        $actions[] = ['url' => (string) $order['resetUrl'], 'label' => 'Ustaw hasło'];
    }

    $bodyHtml = '<p style="margin:0 0 16px;">Po zaksięgowaniu wpłaty dostęp zostanie nadany ręcznie. Zachowaj tę wiadomość do momentu zakończenia płatności.</p>';
    if (!empty($order['bankInstructions'])) {
        $bodyHtml .= '<p style="margin:0;">' . nl2br(mailer_escape((string) $order['bankInstructions'])) . '</p>';
    }

    $details = mailer_render_kv_rows([
        'Produkt' => (string) ($order['productTitle'] ?? ''),
        'Kwota' => isset($order['amountTotal']) ? mailer_format_price((float) $order['amountTotal']) : '',
        'Numer zamówienia' => (string) ($order['orderId'] ?? ''),
        'Odbiorca' => (string) ($order['bankAccountName'] ?? ''),
        'Bank' => (string) ($order['bankName'] ?? ''),
        'Numer konta' => (string) ($order['bankAccountNumber'] ?? ''),
        'Tytuł przelewu' => (string) ($order['bankTransferTitle'] ?? ''),
    ]);

    $html = mailer_render_layout([
        'preheader' => 'Dane do przelewu za zamówiony produkt cyfrowy.',
        'heading' => $heading,
        'intro' => $intro,
        'noticeHtml' => !empty($order['confirmUrl']) ? 'Jeśli kupujesz po raz pierwszy, potwierdź adres e-mail. Dzięki temu po zaksięgowaniu wpłaty szybciej aktywujesz konto i dostęp.' : '',
        'bodyHtml' => $bodyHtml,
        'detailsHtml' => $details,
        'actions' => $actions,
    ]);

    return mailer_send_message((string) $order['customerEmail'], $heading . ' • ' . (string) ($order['productTitle'] ?? 'zamówienie'), $html);
}

function mailer_send_bank_transfer_admin(array $order): bool {
    $heading = 'Nowe zamówienie z przelewem tradycyjnym';
    $intro = 'Klientka wybrała przelew tradycyjny. Zamówienie oczekuje na zaksięgowanie i ręczne nadanie dostępu.';

    $details = mailer_render_kv_rows([
        'Produkt' => (string) ($order['productTitle'] ?? ''),
        'Kwota' => isset($order['amountTotal']) ? mailer_format_price((float) $order['amountTotal']) : '',
        'Numer zamówienia' => (string) ($order['orderId'] ?? ''),
        'E-mail klientki' => (string) ($order['customerEmail'] ?? ''),
        'Typ płatności' => 'Przelew tradycyjny',
        'Tytuł przelewu' => (string) ($order['bankTransferTitle'] ?? ''),
    ]);

    $html = mailer_render_layout([
        'eyebrow' => 'Powiadomienie administracyjne',
        'preheader' => 'Nowe zamówienie oczekujące na przelew tradycyjny.',
        'heading' => $heading,
        'intro' => $intro,
        'detailsHtml' => $details,
        'actions' => !empty($order['adminUrl']) ? [['url' => (string) $order['adminUrl'], 'label' => 'Otwórz panel administratora']] : [],
    ]);

    return mailer_send_message(mailer_resolve_admin_email(), $heading . ' • ' . (string) ($order['productTitle'] ?? 'zamówienie'), $html);
}