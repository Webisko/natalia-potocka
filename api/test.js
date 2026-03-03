import express from 'express';
const router = express.Router();
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

router.get('/seed', (req, res) => {
    try {
        const productId1 = uuidv4();
        const productId2 = uuidv4();

        const insertProduct = db.prepare(`
            INSERT OR IGNORE INTO products (id, title, slug, description, price, stripe_price_id, type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        insertProduct.run(productId1, 'Test Course', 'test-course', 'A test video course', 99.99, 'price_test_course_id', 'video');
        insertProduct.run(productId2, 'Test Meditation', 'test-meditation', 'A test audio meditation', 19.99, 'price_test_meditation_id', 'audio');

        res.json({
            status: 'seeded',
            products: [
                { id: productId1, title: 'Test Course' },
                { id: productId2, title: 'Test Meditation' }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/seed-admin', async (req, res) => {
    try {
        const email = 'admin@example.com';
        const password = 'password123';
        
        let user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        const hash = await bcrypt.hash(password, 10);
        
        if (user) {
            db.prepare('UPDATE users SET password_hash = ?, is_admin = 1 WHERE id = ?').run(hash, user.id);
        } else {
            db.prepare('INSERT INTO users (id, email, password_hash, is_admin) VALUES (?, ?, ?, 1)').run(uuidv4(), email, hash);
        }
        
        res.json({ message: 'Admin account seeded: admin@example.com / password123' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users', (req, res) => {
    try {
        const users = db.prepare('SELECT id, email, purchased_items, created_at FROM users').all();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
