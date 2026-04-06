<?php
$db = new PDO('sqlite:data/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$ids_to_keep = [
    '80177b8b-5a04-45c0-bb0d-bced97fee5a3', // Otulić Połóg
    '46468553-c032-4a30-b42b-32a4331052b7', // Poród Domowy
    'acb4bd23-7e8b-4462-90d4-6583115d08f8', // Głowa w Porodzie
    'ca669bca-e2a1-498d-a157-cb6a1072e13e', // Hipnotyczny Obrót
    '4a9a3abd-f61c-458b-ae7f-0ac50ee6e446', // Test Course
];

$placeholders = implode(',', array_fill(0, count($ids_to_keep), '?'));

// Delete other products
$stmt = $db->prepare("DELETE FROM products WHERE id NOT IN ($placeholders)");
$stmt->execute($ids_to_keep);

// Delete other courses that no longer have a valid product_id
$db->exec("DELETE FROM courses WHERE product_id NOT IN (SELECT id FROM products)");

// Delete other user_purchases - removed since it's stored in users table as JSON/array

// Ensure the Test Course has type 'course'
$db->exec("UPDATE products SET type = 'course' WHERE id = '4a9a3abd-f61c-458b-ae7f-0ac50ee6e446'");

echo "Cleaned up products in database.\n";
