<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';

// /php_api/reviews.php
// GET /php_api/reviews.php?action=list
// GET /php_api/reviews.php?action=all (admin)
// POST, PUT, DELETE omitted for brevity if managed by Cockpit, but let's implement basics

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

if ($method === 'GET') {
    if ($action === 'list') {
        try {
            $stmt = $db->query('SELECT * FROM reviews WHERE is_active = 1 ORDER BY order_index ASC');
            sendJson($stmt->fetchAll());
        } catch (Exception $e) {
            sendJson(['error' => 'Failed to fetch reviews'], 500);
        }
    } elseif ($action === 'all') {
        requireAdmin();
        try {
            $stmt = $db->query('SELECT * FROM reviews ORDER BY order_index ASC');
            sendJson($stmt->fetchAll());
        } catch (Exception $e) {
            sendJson(['error' => 'Failed to fetch reviews'], 500);
        }
    }
} elseif ($method === 'POST') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true);
    try {
        $stmt = $db->prepare('INSERT INTO reviews (author, subtitle, content, thumbnail_url, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['author'] ?? '',
            $data['subtitle'] ?? '',
            $data['content'] ?? '',
            $data['thumbnail_url'] ?? null,
            $data['order_index'] ?? 0,
            $data['is_active'] ?? 1
        ]);
        sendJson(['id' => $db->lastInsertId(), 'message' => 'Review created']);
    } catch (Exception $e) {
        sendJson(['error' => 'Failed to create review'], 500);
    }
} elseif ($method === 'PUT') {
    requireAdmin();
    $id = $_GET['id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    if ($id) {
        try {
            $stmt = $db->prepare('UPDATE reviews SET author = ?, subtitle = ?, content = ?, thumbnail_url = ?, order_index = ?, is_active = ? WHERE id = ?');
            $stmt->execute([
                $data['author'] ?? '',
                $data['subtitle'] ?? '',
                $data['content'] ?? '',
                $data['thumbnail_url'] ?? null,
                $data['order_index'] ?? 0,
                $data['is_active'] ?? 1,
                $id
            ]);
            sendJson(['message' => 'Review updated']);
        } catch (Exception $e) {
            sendJson(['error' => 'Failed to update review'], 500);
        }
    }
} elseif ($method === 'DELETE') {
    requireAdmin();
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            $stmt = $db->prepare('DELETE FROM reviews WHERE id = ?');
            $stmt->execute([$id]);
            sendJson(['message' => 'Review deleted']);
        } catch (Exception $e) {
            sendJson(['error' => 'Failed to delete review'], 500);
        }
    }
}
