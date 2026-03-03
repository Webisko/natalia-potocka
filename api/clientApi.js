import express from 'express';
import db from './db.js';
import { requireAuth } from './authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// Get my library
router.get('/library', (req, res) => {
    try {
        const user = db.prepare('SELECT purchased_items FROM users WHERE id = ?').get(req.user.id);
        
        if (!user || !user.purchased_items) {
            return res.json([]);
        }

        const productIds = user.purchased_items.split(',').filter(id => id.trim() !== '');
        
        if (productIds.length === 0) return res.json([]);

        // Get products by those IDs, including content_url
        const placeholders = productIds.map(() => '?').join(',');
        const products = db.prepare(`
            SELECT id, title, slug, type, description, content_url, thumbnail_url 
            FROM products 
            WHERE id IN (${placeholders})
        `).all(...productIds);

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
