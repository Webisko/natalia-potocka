import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_do_not_use_in_prod';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Brak e-maila lub hasła.' });

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        
        if (!user || !user.password_hash) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Nieprawidłowe dane logowania.' });
        }

        const token = generateToken(user);
        
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            message: 'Zalogowano pomyślnie.',
            user: {
                id: user.id,
                email: user.email,
                is_admin: Boolean(user.is_admin)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/me', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'Nie zalogowano.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare('SELECT id, email, is_admin, purchased_items FROM users WHERE id = ?').get(decoded.id);
        if (!user) return res.status(404).json({ error: 'Podany użytkownik nie istnieje.' });

        res.json({
            id: user.id,
            email: user.email,
            is_admin: Boolean(user.is_admin),
            purchased_items: user.purchased_items ? user.purchased_items.split(',') : []
        });
    } catch (err) {
        res.status(401).json({ error: 'Nieprawidłowy lub wygasły token.' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Wylogowano.' });
});

export default router;
