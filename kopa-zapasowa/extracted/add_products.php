<?php
$db = new PDO('sqlite:data/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Fetch only sellable product IDs. Services are separate landing pages and must
// never be assigned as purchased products.
$stmt = $db->query("SELECT id FROM products WHERE type != 'service'");
$products = $stmt->fetchAll(PDO::FETCH_COLUMN);

$productIdsString = implode(',', $products);

// Update test user
$stmt = $db->prepare("UPDATE users SET purchased_items = ? WHERE email = 'test@webisko.pl'");
$stmt->execute([$productIdsString]);

echo "Dodano wszystkie produkty użytkownikowi test@webisko.pl: " . count($products) . " produktów.\n";
