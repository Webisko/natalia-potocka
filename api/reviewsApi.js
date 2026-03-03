import express from 'express';
import db from './db.js';
import { requireAdmin } from './authMiddleware.js';

const router = express.Router();

// Public: Get all active reviews
router.get('/', (req, res) => {
    try {
        const reviews = db.prepare('SELECT * FROM reviews WHERE is_active = 1 ORDER BY order_index ASC').all();
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Admin: Get all reviews
router.get('/all', requireAdmin, (req, res) => {
    try {
        const reviews = db.prepare('SELECT * FROM reviews ORDER BY order_index ASC').all();
        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Admin: Create review
router.post('/', requireAdmin, (req, res) => {
    try {
        const { author, subtitle, content, thumbnail_url, order_index, is_active } = req.body;
        const insert = db.prepare('INSERT INTO reviews (author, subtitle, content, thumbnail_url, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        const info = insert.run(author, subtitle || '', content, thumbnail_url || null, order_index || 0, is_active ?? 1);
        res.json({ id: info.lastInsertRowid, message: 'Review created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

// Admin: Update review
router.put('/:id', requireAdmin, (req, res) => {
    try {
        const { author, subtitle, content, thumbnail_url, order_index, is_active } = req.body;
        const update = db.prepare('UPDATE reviews SET author = ?, subtitle = ?, content = ?, thumbnail_url = ?, order_index = ?, is_active = ? WHERE id = ?');
        update.run(author, subtitle || '', content, thumbnail_url || null, order_index, is_active, req.params.id);
        res.json({ message: 'Review updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update review' });
    }
});

// Admin: Delete review
router.delete('/:id', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
        res.json({ message: 'Review deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

export default router;
