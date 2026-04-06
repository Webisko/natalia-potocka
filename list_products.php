<?php
$db = new PDO('sqlite:data/database.sqlite');
$stmt = $db->query("SELECT id, title, type, thumbnail_url, content_url FROM products");
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach($products as $p) {
    echo "ID: {$p['id']}\nTitle: {$p['title']}\nType: {$p['type']}\nThumb: {$p['thumbnail_url']}\n\n";
}
