import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

// ── LOGIN ──
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
            maxAge: 7 * 24 * 60 * 60 * 1000
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

// ── REGISTER ──
router.post('/register', async (req, res) => {
    try {
        const { email, password, password_confirm } = req.body;
        if (!email || !password || !password_confirm) {
            return res.status(400).json({ error: 'Wszystkie pola są wymagane.' });
        }
        if (password !== password_confirm) {
            return res.status(400).json({ error: 'Hasła nie są identyczne.' });
        }
        if (password.length < 12) {
            return res.status(400).json({ error: 'Hasło musi mieć co najmniej 12 znaków.' });
        }

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'Konto z tym adresem e-mail już istnieje.' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const confirm_token = crypto.randomBytes(32).toString('hex');

        // Ensure column exists (will be added in migration/seed)
        db.prepare(`INSERT INTO users (email, password_hash, is_admin, email_confirmed, confirm_token) VALUES (?, ?, 0, 0, ?)`).run(email, password_hash, confirm_token);

        // In production we'd send an email; for now log it
        console.log(`\n📧 Email confirmation link for ${email}:`);
        console.log(`   ${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/confirm/${confirm_token}\n`);

        res.status(201).json({
            message: 'Konto zostało utworzone! Sprawdź swoją pocztę, aby potwierdzić adres e-mail.'
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Wystąpił błąd podczas rejestracji.' });
    }
});

// ── CONFIRM EMAIL ──
router.get('/confirm/:token', (req, res) => {
    try {
        const { token } = req.params;
        const user = db.prepare('SELECT * FROM users WHERE confirm_token = ?').get(token);
        if (!user) {
            return res.status(400).send('<h1>Nieprawidłowy link potwierdzający.</h1>');
        }
        db.prepare('UPDATE users SET email_confirmed = 1, confirm_token = NULL WHERE id = ?').run(user.id);
        res.send(`
            <div style="font-family: Georgia, serif; text-align: center; margin-top: 100px; color: #6B5B7B;">
                <h1>✓ E-mail potwierdzony!</h1>
                <p>Twoje konto jest aktywne. Możesz się teraz zalogować.</p>
                <a href="/" style="color: #D4AF37;">Wróć na stronę</a>
            </div>
        `);
    } catch (err) {
        res.status(500).send('<h1>Wystąpił błąd.</h1>');
    }
});

// ── ME ──
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

// ── LOGOUT ──
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Wylogowano.' });
});

export default router;
