import express from 'express';
import db from './db.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        const products = db.prepare('SELECT id, title, slug, price, type, thumbnail_url, description FROM products').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:slug', (req, res) => {
    try {
        const product = db.prepare('SELECT id, title, slug, description, price, type, content_url, thumbnail_url, meta_title, meta_desc, stripe_price_id FROM products WHERE slug = ?').get(req.params.slug);
        
        if (!product) return res.status(404).json({ error: 'Product not found' });
        
        let publicProduct = { ...product };
        delete publicProduct.content_url;
        
        res.json(publicProduct);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
