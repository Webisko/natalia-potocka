<?php
$db = new PDO('sqlite:data/database.sqlite');
$email = 'klient@example.com';
$password = 'password123';
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
$productId = '5ad92564-8f08-4d98-993f-2a8921979f0f';

// Check if user exists
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    echo "Konto już istnieje. Hasło: password123. Email: klient@example.com\n";
    $stmt = $db->prepare('UPDATE users SET purchased_items = ?, password_hash = ? WHERE id = ?');
    $stmt->execute([$productId, $hash, $user['id']]);
} else {
    $stmt = $db->prepare('INSERT INTO users (id, email, password_hash, is_admin, purchased_items, email_confirmed) VALUES (?, ?, ?, 0, ?, 1)');
    $stmt->execute([bin2hex(random_bytes(16)), $email, $hash, $productId]);
    echo "Konto klienta utworzone: klient@example.com / password123\n";
}
