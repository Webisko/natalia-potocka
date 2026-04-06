<?php
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendJson(['error' => 'Method not allowed.'], 405);
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];

$name = trim((string)($data['name'] ?? ''));
$email = strtolower(trim((string)($data['email'] ?? '')));
$message = trim((string)($data['message'] ?? ''));
$website = trim((string)($data['website'] ?? ''));
$privacyConsent = filter_var($data['privacyConsent'] ?? false, FILTER_VALIDATE_BOOLEAN);

if ($website !== '') {
    sendJson(['error' => 'Nie udało się wysłać wiadomości.'], 400);
}

if ($name === '' || $email === '' || $message === '') {
    sendJson(['error' => 'Wypełnij wszystkie pola formularza.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(['error' => 'Podaj poprawny adres e-mail.'], 400);
}

if (mb_strlen($message) < 20) {
    sendJson(['error' => 'Wiadomość jest zbyt krótka.'], 400);
}

if (!$privacyConsent) {
    sendJson(['error' => 'Aby wysłać wiadomość, zaznacz zgodę na przetwarzanie danych osobowych.'], 400);
}

$recipient = 'kontakt@nataliapotocka.pl';
$subject = 'Nowa wiadomość ze strony nataliapotocka.pl';
$body = "Imię: {$name}\n";
$body .= "E-mail: {$email}\n";
$body .= 'Zgoda na przetwarzanie danych: tak' . "\n";
$body .= 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n\n";
$body .= "Wiadomość:\n{$message}\n";

$host = $_SERVER['HTTP_HOST'] ?? 'nataliapotocka.pl';
$headers = "From: kontakt@{$host}\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($recipient, $subject, $body, $headers);

if (!$sent) {
    error_log('Contact form mail() failed for ' . $email);
    sendJson(['error' => 'Nie udało się wysłać wiadomości. Spróbuj ponownie później lub napisz bezpośrednio na kontakt@nataliapotocka.pl.'], 500);
}

sendJson(['message' => 'Wiadomość została wysłana.']);