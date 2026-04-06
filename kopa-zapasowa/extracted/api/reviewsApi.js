import express from 'express';
import db from './db.js';
import { requireAdmin } from './authMiddleware.js';
import { enqueuePublicBuild } from './publicBuildQueue.js';

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
        const maxOrderRow = db.prepare('SELECT MAX(order_index) AS maxOrder FROM reviews').get();
        const normalizedOrderIndex = Number.isFinite(Number(order_index)) ? Number(order_index) : Number(maxOrderRow?.maxOrder ?? -1) + 1;
        const insert = db.prepare('INSERT INTO reviews (author, subtitle, content, thumbnail_url, order_index, is_active) VALUES (?, ?, ?, ?, ?, ?)');
        const info = insert.run(author, subtitle || '', content, thumbnail_url || null, normalizedOrderIndex, is_active ?? 1);
        const build = enqueuePublicBuild(`review created: ${info.lastInsertRowid}`);
        res.json({ id: info.lastInsertRowid, message: `Review created. ${build.message}`, publicBuild: build });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create review' });
    }
});

// Admin: Update review
router.put('/:id', requireAdmin, (req, res) => {
    try {
        const existingReview = db.prepare('SELECT order_index FROM reviews WHERE id = ?').get(req.params.id);
        if (!existingReview) {
            return res.status(404).json({ error: 'Nie znaleziono opinii.' });
        }

        const { author, subtitle, content, thumbnail_url, order_index, is_active } = req.body;
        const update = db.prepare('UPDATE reviews SET author = ?, subtitle = ?, content = ?, thumbnail_url = ?, order_index = ?, is_active = ? WHERE id = ?');
        const normalizedOrderIndex = Number.isFinite(Number(order_index)) ? Number(order_index) : existingReview.order_index;
        update.run(author, subtitle || '', content, thumbnail_url || null, normalizedOrderIndex, is_active, req.params.id);
        const build = enqueuePublicBuild(`review updated: ${req.params.id}`);
        res.json({ message: `Review updated. ${build.message}`, publicBuild: build });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update review' });
    }
});

router.post('/reorder', requireAdmin, (req, res) => {
    try {
        const orderedIds = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];

        if (orderedIds.length === 0) {
            return res.status(400).json({ error: 'Brak nowej kolejności opinii.' });
        }

        const updateOrder = db.prepare('UPDATE reviews SET order_index = ? WHERE id = ?');
        const transaction = db.transaction((ids) => {
            ids.forEach((id, index) => {
                updateOrder.run(index, id);
            });
        });

        transaction(orderedIds);

        const build = enqueuePublicBuild('reviews reordered');
        res.json({ message: `Kolejność opinii została zapisana. ${build.message}`, publicBuild: build });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to reorder reviews' });
    }
});

// Admin: Delete review
router.delete('/:id', requireAdmin, (req, res) => {
    try {
        db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
        const build = enqueuePublicBuild(`review deleted: ${req.params.id}`);
        res.json({ message: `Review deleted. ${build.message}`, publicBuild: build });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

export default router;
