<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';

// /php_api/client.php?action=library

$user = requireAuth();

$action = $_GET['action'] ?? '';

if ($action === 'library') {
    try {
        $stmt = $db->prepare('SELECT purchased_items FROM users WHERE id = :id');
        $stmt->execute([':id' => $user['id']]);
        $row = $stmt->fetch();

        if (!$row || empty($row['purchased_items'])) {
            sendJson([]);
        }

        $items = explode(',', $row['purchased_items']);
        $productIds = [];
        foreach ($items as $item) {
            $item = trim($item);
            if ($item !== '') {
                $productIds[] = $item;
            }
        }

        if (empty($productIds)) {
            sendJson([]);
        }

        $placeholders = rtrim(str_repeat('?,', count($productIds)), ',');
        $stmt = $db->prepare("SELECT id, title, slug, type, description, content_url, allow_download, thumbnail_url FROM products WHERE id IN (" . $placeholders . ") AND type != 'service'");
        $stmt->execute($productIds);
        $products = $stmt->fetchAll();

        sendJson($products);
    } catch (Exception $e) {
        sendJson(['error' => $e->getMessage()], 500);
    }
} else {
    sendJson(['error' => 'Unknown action'], 400);
}
