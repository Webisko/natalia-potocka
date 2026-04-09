<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';

function getReviewSetting(string $key, string $fallback = ''): string
{
    global $db;

    $stmt = $db->prepare('SELECT value FROM settings WHERE key = ? LIMIT 1');
    $stmt->execute([$key]);
    $value = $stmt->fetchColumn();

    return $value === false ? $fallback : (string) $value;
}

function saveReviewSetting(string $key, string $value): void
{
    global $db;

    $stmt = $db->prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');
    $stmt->execute([$key, $value]);
}

function markReviewPublicContentDirty(): void
{
    $currentVersion = (int) getReviewSetting('site_publish_content_version', '0');
    $currentStatus = trim(getReviewSetting('site_publish_status', ''));
    $nextVersion = $currentVersion + 1;
    $status = in_array($currentStatus, ['requested', 'running'], true) ? $currentStatus : 'pending';
    $message = in_array($currentStatus, ['requested', 'running'], true)
        ? 'Trwa już aktualizacja strony. Nowsze zmiany zostaną pokazane zaraz po jej zakończeniu.'
        : 'Są publiczne zmiany oczekujące na automatyczne odświeżenie strony.';

    saveReviewSetting('site_publish_content_version', (string) $nextVersion);
    saveReviewSetting('site_publish_status', $status);
    saveReviewSetting('site_publish_last_change_at', gmdate('c'));
    saveReviewSetting('site_publish_last_change_source', 'reviews');
    saveReviewSetting('site_publish_last_message', $message);
}

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
    if (isset($_GET['id']) && $_GET['id'] === 'reorder') {
        $data = json_decode(file_get_contents('php://input'), true);
        $orderedIds = array_values(array_filter(array_map('strval', $data['orderedIds'] ?? [])));

        if (count($orderedIds) === 0) {
            sendJson(['error' => 'Brak opinii do zapisania.'], 400);
        }

        try {
            $db->beginTransaction();
            $stmt = $db->prepare('UPDATE reviews SET order_index = ? WHERE id = ?');

            foreach ($orderedIds as $index => $reviewId) {
                $stmt->execute([$index, $reviewId]);
            }

            $db->commit();
            markReviewPublicContentDirty();
            sendJson(['message' => 'Kolejność opinii została zapisana.']);
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }

            sendJson(['error' => 'Nie udało się zapisać kolejności opinii.'], 500);
        }
    }

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
        markReviewPublicContentDirty();
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
            markReviewPublicContentDirty();
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
            markReviewPublicContentDirty();
            sendJson(['message' => 'Review deleted']);
        } catch (Exception $e) {
            sendJson(['error' => 'Failed to delete review'], 500);
        }
    }
}
