import express from 'express';
import db from './db.js';
import { requireAdmin } from './authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.use(requireAdmin); // Protect all routes in this file

// List all products for admin (including hidden fields like content_url)
router.get('/products', (req, res) => {
    try {
        const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new product
router.post('/products', (req, res) => {
    try {
        const { title, slug, description, price, stripe_price_id, type, content_url, thumbnail_url, meta_title, meta_desc } = req.body;
        const id = uuidv4();
        
        db.prepare(`
            INSERT INTO products (id, title, slug, description, price, stripe_price_id, type, content_url, thumbnail_url, meta_title, meta_desc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, title, slug, description, price, stripe_price_id, type, content_url, thumbnail_url, meta_title, meta_desc);

        res.status(201).json({ id, message: 'Produkt utworzony' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
router.put('/products/:id', (req, res) => {
    try {
        const { title, slug, description, price, stripe_price_id, type, content_url, thumbnail_url, meta_title, meta_desc } = req.body;
        
        db.prepare(`
            UPDATE products 
            SET title = ?, slug = ?, description = ?, price = ?, stripe_price_id = ?, type = ?, content_url = ?, thumbnail_url = ?, meta_title = ?, meta_desc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(title, slug, description, price, stripe_price_id, type, content_url, thumbnail_url, meta_title, meta_desc, req.params.id);

        res.json({ message: 'Produkt zaktualizowany' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
router.delete('/products/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
        res.json({ message: 'Produkt usunięty' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manual grant access
router.post('/grant-access', (req, res) => {
    try {
        const { email, product_id } = req.body;
        if (!email || !product_id) return res.status(400).json({ error: 'Brak emaila lub ID produktu' });

        const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id);
        if (!product) return res.status(404).json({ error: 'Produkt nie znaleziony' });

        let user = db.prepare('SELECT id, purchased_items FROM users WHERE email = ?').get(email);
        
        if (user) {
            let purchases = user.purchased_items ? user.purchased_items.split(',') : [];
            if (!purchases.includes(product_id)) {
                purchases.push(product_id);
                db.prepare('UPDATE users SET purchased_items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(purchases.join(','), user.id);
            }
            res.json({ message: 'Dostęp nadany istniejącemu użytkownikowi.' });
        } else {
            const newUserId = uuidv4();
            db.prepare('INSERT INTO users (id, email, password_hash, purchased_items) VALUES (?, ?, ?, ?)').run(newUserId, email, null, product_id);
            res.json({ message: 'Utworzono nowego użytkownika i nadano mu dostęp. Przypomnij mu o zresetowaniu hasła!' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
