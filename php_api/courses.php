<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authMiddleware.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

function normalizePurchasedItems(?string $value): array {
    if (!$value) {
        return [];
    }

    return array_values(array_filter(array_map('trim', explode(',', $value))));
}

function userHasProductAccess(string $userId, string $productId): bool {
    global $db;
    $stmt = $db->prepare('SELECT purchased_items, is_admin FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) {
        return false;
    }
    if (!empty($user['is_admin'])) {
        return true;
    }

    return in_array($productId, normalizePurchasedItems($user['purchased_items'] ?? null), true);
}

function requirePurchasedProductAccess(array $user, string $productId): void {
    if (!empty($user['is_admin'])) {
        return;
    }

    if (!userHasProductAccess($user['id'], $productId)) {
        sendJson(['error' => 'Brak dostępu do treści tego produktu.'], 403);
    }
}

function getCourseWithModules(PDO $db, string $courseId): ?array {
    $stmt = $db->prepare('SELECT * FROM courses WHERE id = ?');
    $stmt->execute([$courseId]);
    $course = $stmt->fetch();
    if (!$course) {
        return null;
    }

    $stmtModules = $db->prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index');
    $stmtModules->execute([$courseId]);
    $modules = $stmtModules->fetchAll();

    foreach ($modules as &$module) {
        $stmtLessons = $db->prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index');
        $stmtLessons->execute([$module['id']]);
        $module['lessons'] = $stmtLessons->fetchAll();

        foreach ($module['lessons'] as &$lesson) {
            $stmtAttachments = $db->prepare('SELECT * FROM lesson_attachments WHERE lesson_id = ?');
            $stmtAttachments->execute([$lesson['id']]);
            $lesson['attachments'] = $stmtAttachments->fetchAll();
        }
        unset($lesson);
    }
    unset($module);

    $course['modules'] = $modules;
    return $course;
}

if ($method === 'GET') {
    if ($action === 'list') {
        requireAdmin();
        try {
            $stmt = $db->query('SELECT c.*, p.title AS product_title, p.slug AS product_slug FROM courses c LEFT JOIN products p ON p.id = c.product_id');
            sendJson($stmt->fetchAll());
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'get') {
        requireAdmin();
        $courseId = (string) ($_GET['courseId'] ?? '');
        try {
            $course = getCourseWithModules($db, $courseId);
            if (!$course) {
                sendJson(['error' => 'Not found'], 404);
            }
            sendJson($course);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'by-product') {
        $user = requireAuth();
        $productId = (string) ($_GET['productId'] ?? '');
        requirePurchasedProductAccess($user, $productId);

        try {
            $stmt = $db->prepare('SELECT id FROM courses WHERE product_id = ?');
            $stmt->execute([$productId]);
            $courseId = $stmt->fetchColumn();
            if (!$courseId) {
                sendJson(['error' => 'Course not found'], 404);
            }
            sendJson(getCourseWithModules($db, (string) $courseId));
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'progress') {
        $user = requireAuth();
        $courseId = (string) ($_GET['courseId'] ?? '');

        try {
            $stmtCourse = $db->prepare('SELECT product_id FROM courses WHERE id = ?');
            $stmtCourse->execute([$courseId]);
            $course = $stmtCourse->fetch();
            if (!$course) {
                sendJson(['error' => 'Not found'], 404);
            }

            requirePurchasedProductAccess($user, (string) $course['product_id']);

            $stmtLessons = $db->prepare('SELECT l.id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE m.course_id = ?');
            $stmtLessons->execute([$courseId]);
            $lessons = $stmtLessons->fetchAll();
            $lessonIds = array_column($lessons, 'id');
            if (empty($lessonIds)) {
                sendJson(['progress' => new stdClass(), 'total' => 0, 'completed' => 0]);
            }

            $placeholders = implode(',', array_fill(0, count($lessonIds), '?'));
            $params = array_merge([$user['id']], $lessonIds);
            $stmtProgress = $db->prepare("SELECT lesson_id, completed FROM user_progress WHERE user_id = ? AND lesson_id IN ($placeholders)");
            $stmtProgress->execute($params);

            $progressMap = [];
            $completedCount = 0;
            foreach ($stmtProgress->fetchAll() as $progressRow) {
                $progressMap[$progressRow['lesson_id']] = !empty($progressRow['completed']);
                if (!empty($progressRow['completed'])) {
                    $completedCount++;
                }
            }

            sendJson([
                'progress' => (object) $progressMap,
                'total' => count($lessonIds),
                'completed' => $completedCount,
            ]);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?: [];

    if ($action === 'create') {
        requireAdmin();
        try {
            $id = bin2hex(random_bytes(16));
            $stmt = $db->prepare('INSERT INTO courses (id, product_id, title, description, thumbnail_url) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$id, $data['product_id'] ?? '', $data['title'] ?? '', $data['description'] ?? '', $data['thumbnail_url'] ?? null]);
            sendJson(['id' => $id, 'message' => 'Course created'], 201);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'module-create') {
        requireAdmin();
        $courseId = (string) ($_GET['courseId'] ?? '');
        try {
            $id = bin2hex(random_bytes(16));
            $stmt = $db->prepare('INSERT INTO modules (id, course_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$id, $courseId, $data['title'] ?? '', $data['description'] ?? '', $data['order_index'] ?? 0]);
            sendJson(['id' => $id, 'message' => 'Module created'], 201);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'lesson-create') {
        requireAdmin();
        $moduleId = (string) ($_GET['moduleId'] ?? '');
        try {
            $id = bin2hex(random_bytes(16));
            $stmt = $db->prepare('INSERT INTO lessons (id, module_id, title, description, lesson_type, content_url, content_text, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$id, $moduleId, $data['title'] ?? '', $data['description'] ?? '', $data['lesson_type'] ?? 'video', $data['content_url'] ?? null, $data['content_text'] ?? null, $data['duration_minutes'] ?? null, $data['order_index'] ?? 0]);
            sendJson(['id' => $id, 'message' => 'Lesson created'], 201);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'attachment-create') {
        requireAdmin();
        $lessonId = (string) ($_GET['lessonId'] ?? '');
        try {
            $id = bin2hex(random_bytes(16));
            $stmt = $db->prepare('INSERT INTO lesson_attachments (id, lesson_id, name, url) VALUES (?, ?, ?, ?)');
            $stmt->execute([$id, $lessonId, $data['name'] ?? '', $data['url'] ?? '']);
            sendJson(['id' => $id, 'message' => 'Attachment added'], 201);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'progress') {
        $user = requireAuth();
        $lessonId = (string) ($data['lesson_id'] ?? '');
        $completed = !empty($data['completed']) ? 1 : 0;
        try {
            $stmtLesson = $db->prepare('SELECT c.product_id FROM lessons l JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id WHERE l.id = ?');
            $stmtLesson->execute([$lessonId]);
            $lesson = $stmtLesson->fetch();
            if (!$lesson) {
                sendJson(['error' => 'Nie znaleziono lekcji.'], 404);
            }

            requirePurchasedProductAccess($user, (string) $lesson['product_id']);

            $stmtExisting = $db->prepare('SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ?');
            $stmtExisting->execute([$user['id'], $lessonId]);
            if ($stmtExisting->fetch()) {
                $stmtUpdate = $db->prepare('UPDATE user_progress SET completed = ?, completed_at = ? WHERE user_id = ? AND lesson_id = ?');
                $stmtUpdate->execute([$completed, $completed ? gmdate('c') : null, $user['id'], $lessonId]);
            } else {
                $stmtInsert = $db->prepare('INSERT INTO user_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, ?, ?)');
                $stmtInsert->execute([bin2hex(random_bytes(16)), $user['id'], $lessonId, $completed, $completed ? gmdate('c') : null]);
            }

            sendJson(['message' => 'Progress saved']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }
}

if ($method === 'PUT') {
    requireAdmin();
    $data = json_decode(file_get_contents('php://input'), true) ?: [];

    if ($action === 'update') {
        $courseId = (string) ($_GET['courseId'] ?? '');
        try {
            $stmt = $db->prepare('UPDATE courses SET title = ?, description = ?, thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
            $stmt->execute([$data['title'] ?? '', $data['description'] ?? '', $data['thumbnail_url'] ?? null, $courseId]);
            sendJson(['message' => 'Course updated']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'module-update') {
        $moduleId = (string) ($_GET['moduleId'] ?? '');
        try {
            $stmt = $db->prepare('UPDATE modules SET title = ?, description = ?, order_index = ? WHERE id = ?');
            $stmt->execute([$data['title'] ?? '', $data['description'] ?? '', $data['order_index'] ?? 0, $moduleId]);
            sendJson(['message' => 'Module updated']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'lesson-update') {
        $lessonId = (string) ($_GET['lessonId'] ?? '');
        try {
            $stmt = $db->prepare('UPDATE lessons SET title = ?, description = ?, lesson_type = ?, content_url = ?, content_text = ?, duration_minutes = ?, order_index = ? WHERE id = ?');
            $stmt->execute([$data['title'] ?? '', $data['description'] ?? '', $data['lesson_type'] ?? 'video', $data['content_url'] ?? null, $data['content_text'] ?? null, $data['duration_minutes'] ?? null, $data['order_index'] ?? 0, $lessonId]);
            sendJson(['message' => 'Lesson updated']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }
}

if ($method === 'DELETE') {
    requireAdmin();

    if ($action === 'delete') {
        $courseId = (string) ($_GET['courseId'] ?? '');
        try {
            $stmt = $db->prepare('DELETE FROM courses WHERE id = ?');
            $stmt->execute([$courseId]);
            sendJson(['message' => 'Deleted']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'module-delete') {
        $moduleId = (string) ($_GET['moduleId'] ?? '');
        try {
            $stmt = $db->prepare('DELETE FROM modules WHERE id = ?');
            $stmt->execute([$moduleId]);
            sendJson(['message' => 'Deleted']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'lesson-delete') {
        $lessonId = (string) ($_GET['lessonId'] ?? '');
        try {
            $stmt = $db->prepare('DELETE FROM lessons WHERE id = ?');
            $stmt->execute([$lessonId]);
            sendJson(['message' => 'Deleted']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }

    if ($action === 'attachment-delete') {
        $attachmentId = (string) ($_GET['attachmentId'] ?? '');
        try {
            $stmt = $db->prepare('DELETE FROM lesson_attachments WHERE id = ?');
            $stmt->execute([$attachmentId]);
            sendJson(['message' => 'Deleted']);
        } catch (Exception $e) {
            sendJson(['error' => $e->getMessage()], 500);
        }
    }
}

sendJson(['error' => 'Unknown action'], 400);