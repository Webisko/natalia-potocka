<?php
$db = new PDO('sqlite:data/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Ustal hasła
$adminPass = password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]);
$testPass = password_hash('test1234', PASSWORD_BCRYPT, ['cost' => 12]);

// Produkt demo dla usera testowego musi istnieć w aktualnej bazie.
$productStmt = $db->query("SELECT id FROM products WHERE slug = 'test-course' LIMIT 1");
$productId = $productStmt->fetchColumn() ?: null;

if (!$productId) {
    $fallbackStmt = $db->query("SELECT id FROM products WHERE type IN ('course', 'video', 'audio') ORDER BY created_at DESC LIMIT 1");
    $productId = $fallbackStmt->fetchColumn() ?: null;
}

$users = [
    [
        'email' => 'admin@webisko.pl',
        'hash' => $adminPass,
        'is_admin' => 1,
        'purchases' => null
    ],
    [
        'email' => 'test@webisko.pl',
        'hash' => $testPass,
        'is_admin' => 0,
        'purchases' => $productId
    ]
];

foreach ($users as $u) {
    // Usun starych ewentualnie
    $stmt = $db->prepare("DELETE FROM users WHERE email = ?");
    $stmt->execute([$u['email']]);
    
    // Dodaj na nowo
    $stmt = $db->prepare('INSERT INTO users (id, email, password_hash, is_admin, purchased_items, email_confirmed) VALUES (?, ?, ?, ?, ?, 1)');
    $stmt->execute([bin2hex(random_bytes(16)), $u['email'], $u['hash'], $u['is_admin'], $u['purchases']]);
    echo "Stworzono/Zaktualizowano: " . $u['email'] . "\n";
}

// Opcjonalnie usuwamy stare przykłady i dawny testowy login managera
$db->exec("DELETE FROM users WHERE email IN ('admin@example.com', 'klient@example.com', 'manager@webisko.pl')");
echo "Usunieto stare konta testowe.\n";

if ($productId) {
    echo "Testowe konto klientki otrzymalo produkt ID: $productId\n";
} else {
    echo "Uwaga: nie znaleziono produktu do przypisania testowej klientce.\n";
}
