import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';
import { requireAdmin, requireAuth } from './authMiddleware.js';

const router = express.Router();

// Helper: get full course with modules and lessons
function getCourseWithModules(courseId) {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId);
    if (!course) return null;
    const modules = db.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index').all(courseId);
    for (const mod of modules) {
        mod.lessons = db.prepare('SELECT * FROM lessons WHERE module_id = ? ORDER BY order_index').all(mod.id);
        for (const lesson of mod.lessons) {
            lesson.attachments = db.prepare('SELECT * FROM lesson_attachments WHERE lesson_id = ?').all(lesson.id);
        }
    }
    course.modules = modules;
    return course;
}

// GET /api/courses - list all (admin)
router.get('/', requireAdmin, (req, res) => {
    try {
        const courses = db.prepare(`
            SELECT c.*, p.title as product_title, p.slug as product_slug
            FROM courses c
            LEFT JOIN products p ON p.id = c.product_id
        `).all();
        res.json(courses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/courses/by-product/:productId - get course for a product (public, content gated by auth)
router.get('/by-product/:productId', (req, res) => {
    try {
        const course = db.prepare('SELECT * FROM courses WHERE product_id = ?').get(req.params.productId);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        const result = getCourseWithModules(course.id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/courses/:id - single course full structure
router.get('/:id', requireAdmin, (req, res) => {
    try {
        const course = getCourseWithModules(req.params.id);
        if (!course) return res.status(404).json({ error: 'Not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/courses - create course
router.post('/', requireAdmin, (req, res) => {
    try {
        const { product_id, title, description, thumbnail_url } = req.body;
        const id = uuidv4();
        db.prepare('INSERT INTO courses (id, product_id, title, description, thumbnail_url) VALUES (?, ?, ?, ?, ?)')
            .run(id, product_id, title, description || '', thumbnail_url || null);
        res.json({ id, message: 'Course created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/courses/:id - update course
router.put('/:id', requireAdmin, (req, res) => {
    try {
        const { title, description, thumbnail_url } = req.body;
        db.prepare('UPDATE courses SET title = ?, description = ?, thumbnail_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(title, description || '', thumbnail_url || null, req.params.id);
        res.json({ message: 'Course updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/courses/:id
router.delete('/:id', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======= MODULES =======
// POST /api/courses/:id/modules
router.post('/:id/modules', requireAdmin, (req, res) => {
    try {
        const { title, description, order_index } = req.body;
        const id = uuidv4();
        db.prepare('INSERT INTO modules (id, course_id, title, description, order_index) VALUES (?, ?, ?, ?, ?)')
            .run(id, req.params.id, title, description || '', order_index || 0);
        res.json({ id, message: 'Module created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/courses/modules/:moduleId
router.put('/modules/:moduleId', requireAdmin, (req, res) => {
    try {
        const { title, description, order_index } = req.body;
        db.prepare('UPDATE modules SET title = ?, description = ?, order_index = ? WHERE id = ?')
            .run(title, description || '', order_index, req.params.moduleId);
        res.json({ message: 'Module updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/courses/modules/:moduleId
router.delete('/modules/:moduleId', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM modules WHERE id = ?').run(req.params.moduleId);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======= LESSONS =======
// POST /api/courses/modules/:moduleId/lessons
router.post('/modules/:moduleId/lessons', requireAdmin, (req, res) => {
    try {
        const { title, description, lesson_type, content_url, content_text, duration_minutes, order_index } = req.body;
        const id = uuidv4();
        db.prepare('INSERT INTO lessons (id, module_id, title, description, lesson_type, content_url, content_text, duration_minutes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(id, req.params.moduleId, title, description || '', lesson_type || 'video', content_url || null, content_text || null, duration_minutes || null, order_index || 0);
        res.json({ id, message: 'Lesson created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/courses/lessons/:lessonId
router.put('/lessons/:lessonId', requireAdmin, (req, res) => {
    try {
        const { title, description, lesson_type, content_url, content_text, duration_minutes, order_index } = req.body;
        db.prepare('UPDATE lessons SET title = ?, description = ?, lesson_type = ?, content_url = ?, content_text = ?, duration_minutes = ?, order_index = ? WHERE id = ?')
            .run(title, description || '', lesson_type || 'video', content_url || null, content_text || null, duration_minutes || null, order_index, req.params.lessonId);
        res.json({ message: 'Lesson updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/courses/lessons/:lessonId
router.delete('/lessons/:lessonId', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.lessonId);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======= ATTACHMENTS =======
// POST /api/courses/lessons/:lessonId/attachments
router.post('/lessons/:lessonId/attachments', requireAdmin, (req, res) => {
    try {
        const { name, url } = req.body;
        const id = uuidv4();
        db.prepare('INSERT INTO lesson_attachments (id, lesson_id, name, url) VALUES (?, ?, ?, ?)')
            .run(id, req.params.lessonId, name, url);
        res.json({ id, message: 'Attachment added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/courses/attachments/:attachmentId
router.delete('/attachments/:attachmentId', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM lesson_attachments WHERE id = ?').run(req.params.attachmentId);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ======= USER PROGRESS =======
// POST /api/courses/progress - mark lesson as completed/uncompleted
router.post('/progress', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const { lesson_id, completed } = req.body;
        const existing = db.prepare('SELECT id FROM user_progress WHERE user_id = ? AND lesson_id = ?').get(userId, lesson_id);
        if (existing) {
            db.prepare('UPDATE user_progress SET completed = ?, completed_at = ? WHERE user_id = ? AND lesson_id = ?')
                .run(completed ? 1 : 0, completed ? new Date().toISOString() : null, userId, lesson_id);
        } else {
            db.prepare('INSERT INTO user_progress (id, user_id, lesson_id, completed, completed_at) VALUES (?, ?, ?, ?, ?)')
                .run(uuidv4(), userId, lesson_id, completed ? 1 : 0, completed ? new Date().toISOString() : null);
        }
        res.json({ message: 'Progress saved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/courses/progress/:courseId - get user progress for a course
router.get('/progress/:courseId', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.courseId);
        if (!course) return res.status(404).json({ error: 'Not found' });

        // Get all lesson IDs in this course
        const lessons = db.prepare(`
            SELECT l.id FROM lessons l
            JOIN modules m ON m.id = l.module_id
            WHERE m.course_id = ?
        `).all(req.params.courseId);
        
        const lessonIds = lessons.map(l => l.id);
        if (lessonIds.length === 0) return res.json({ progress: {}, total: 0, completed: 0 });

        const placeholders = lessonIds.map(() => '?').join(',');
        const progress = db.prepare(`SELECT lesson_id, completed FROM user_progress WHERE user_id = ? AND lesson_id IN (${placeholders})`).all(userId, ...lessonIds);

        const progressMap = {};
        progress.forEach(p => { progressMap[p.lesson_id] = !!p.completed; });

        res.json({
            progress: progressMap,
            total: lessonIds.length,
            completed: progress.filter(p => p.completed).length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
