import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from './db.js';
import { sendPhpMailer } from './phpMailerBridge.js';
import { requireAuth } from './authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_do_not_use_in_prod';
const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

function detectBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`;
}

function normalizeEmailAddress(value) {
    return `${value || ''}`.trim().toLowerCase();
}

function validateStrongPassword(password) {
    if (typeof password !== 'string' || password.length < 12) {
        return 'Hasło musi mieć co najmniej 12 znaków.';
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z\d]/.test(password)) {
        return 'Hasło musi zawierać małą literę, wielką literę, cyfrę oraz znak specjalny.';
    }

    return null;
}

function parseStoredDateTime(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(' ', 'T') + 'Z');
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeBcryptHash(hash) {
    if (typeof hash !== 'string') {
        return hash;
    }

    return hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
}

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

function setAuthCookie(res, user) {
    const token = generateToken(user);
    res.cookie('auth_token', token, AUTH_COOKIE_OPTIONS);
    return token;
}

function buildUserPayload(user) {
    return {
        id: user.id,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        email: user.email,
        phone: user.phone || null,
        is_admin: Boolean(user.is_admin),
        email_confirmed: Boolean(user.email_confirmed),
        pending_email: user.pending_email || null,
        purchased_items: user.purchased_items ? user.purchased_items.split(',').filter(Boolean) : [],
    };
}

function getUserById(userId) {
    return db.prepare(`
        SELECT id, first_name, last_name, email, phone, is_admin, email_confirmed, pending_email, purchased_items
        FROM users
        WHERE id = ?
    `).get(userId);
}

// ── LOGIN ──
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Brak e-maila lub hasła.' });

        const normalizedEmail = `${email}`.trim().toLowerCase();
        const user = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalizedEmail);
        
        if (!user) {
            return res.status(401).json({ error: 'Nie znaleziono konta dla podanego adresu e-mail.' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ error: 'To konto nie ma ustawionego hasła. Użyj opcji „Zapomniałaś hasła?”.' });
        }

        const match = await bcrypt.compare(password, normalizeBcryptHash(user.password_hash));
        if (!match) {
            return res.status(401).json({ error: 'Podane hasło jest nieprawidłowe.' });
        }

        if (!user.email_confirmed) {
            return res.status(403).json({ error: 'Potwierdź adres e-mail, aby zalogować się do swojego konta i uzyskać dostęp do materiałów.' });
        }

        setAuthCookie(res, user);

        res.json({
            message: 'Zalogowano pomyślnie.',
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                is_admin: Boolean(user.is_admin)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Podaj adres e-mail.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);

        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

            db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?')
                .run(resetToken, resetExpires, normalizedEmail);

            const resetUrl = `${detectBaseUrl(req)}/resetowanie-hasla?token=${resetToken}`;
            sendPhpMailer('password_reset', {
                email: normalizedEmail,
                resetUrl,
            }, {
                baseUrl: detectBaseUrl(req),
            });
        }

        res.json({ message: 'Jeśli podany e-mail istnieje w bazie, wysłano na niego link do resetu hasła.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Wystąpił błąd podczas wysyłania linku resetującego.' });
    }
});

router.post('/resetowanie-hasla', async (req, res) => {
    try {
        const { token, password, password_confirm } = req.body;

        if (!token || !password || !password_confirm) {
            return res.status(400).json({ error: 'Wszystkie pola są wymagane.' });
        }
        if (password !== password_confirm) {
            return res.status(400).json({ error: 'Hasła nie są identyczne.' });
        }
        const passwordValidationError = validateStrongPassword(password);
        if (passwordValidationError) {
            return res.status(400).json({ error: passwordValidationError });
        }

        const user = db.prepare('SELECT id, reset_expires FROM users WHERE reset_token = ?').get(token);
        if (!user) {
            return res.status(400).json({ error: 'Nieprawidłowy lub wygasły token.' });
        }

        const resetExpiresAt = parseStoredDateTime(user.reset_expires);
        if (!resetExpiresAt || resetExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({ error: 'Token resetowania hasła wygasł.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?')
            .run(passwordHash, user.id);

        res.json({ message: 'Hasło zostało pomyślnie zmienione. Możesz się zalogować.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Wystąpił błąd podczas resetowania hasła.' });
    }
});

// ── REGISTER ──
router.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, email, password, password_confirm } = req.body;
        if (!first_name || !last_name || !email || !password || !password_confirm) {
            return res.status(400).json({ error: 'Wszystkie pola są wymagane.' });
        }
        if (password !== password_confirm) {
            return res.status(400).json({ error: 'Hasła nie są identyczne.' });
        }
        const passwordValidationError = validateStrongPassword(password);
        if (passwordValidationError) {
            return res.status(400).json({ error: passwordValidationError });
        }

        // Check if user exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'Konto z tym adresem e-mail już istnieje.' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        const confirm_token = crypto.randomBytes(32).toString('hex');
        const userId = crypto.randomUUID();

        db.prepare(`
            INSERT INTO users (id, first_name, last_name, email, password_hash, is_admin, email_confirmed, confirm_token)
            VALUES (?, ?, ?, ?, ?, 0, 0, ?)
        `).run(userId, first_name.trim(), last_name.trim(), email.trim().toLowerCase(), password_hash, confirm_token);

        const confirmUrl = `${detectBaseUrl(req)}/api/auth/confirm/${confirm_token}`;
        sendPhpMailer('account_confirmation', {
            email: email.trim().toLowerCase(),
            confirmUrl,
            context: {
                firstName: first_name.trim(),
            },
        }, {
            baseUrl: detectBaseUrl(req),
        });

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

router.put('/profile', requireAuth, (req, res) => {
    try {
        const firstName = `${req.body?.first_name || ''}`.trim();
        const lastName = `${req.body?.last_name || ''}`.trim();
        const phone = `${req.body?.phone || ''}`.trim();

        if (!firstName || !lastName) {
            return res.status(400).json({ error: 'Imię i nazwisko są wymagane.' });
        }

        db.prepare(`
            UPDATE users
            SET first_name = ?,
                last_name = ?,
                phone = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(firstName, lastName, phone || null, req.user.id);

        const updatedUser = getUserById(req.user.id);
        res.json({
            message: 'Dane konta zostały zapisane.',
            user: buildUserPayload(updatedUser),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/change-password', requireAuth, async (req, res) => {
    try {
        const currentPassword = `${req.body?.current_password || ''}`;
        const nextPassword = `${req.body?.new_password || ''}`;
        const passwordConfirm = `${req.body?.password_confirm || ''}`;

        if (!currentPassword || !nextPassword || !passwordConfirm) {
            return res.status(400).json({ error: 'Wszystkie pola hasła są wymagane.' });
        }

        if (nextPassword !== passwordConfirm) {
            return res.status(400).json({ error: 'Nowe hasła nie są identyczne.' });
        }

        const passwordValidationError = validateStrongPassword(nextPassword);
        if (passwordValidationError) {
            return res.status(400).json({ error: passwordValidationError });
        }

        const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
        if (!user?.password_hash) {
            return res.status(400).json({ error: 'To konto nie ma jeszcze ustawionego hasła.' });
        }

        const passwordMatches = await bcrypt.compare(currentPassword, normalizeBcryptHash(user.password_hash));
        if (!passwordMatches) {
            return res.status(401).json({ error: 'Aktualne hasło jest nieprawidłowe.' });
        }

        const passwordHash = await bcrypt.hash(nextPassword, 12);
        db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, req.user.id);

        res.json({ message: 'Hasło zostało zmienione.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/request-email-change', requireAuth, (req, res) => {
    try {
        const nextEmail = normalizeEmailAddress(req.body?.email);
        if (!nextEmail) {
            return res.status(400).json({ error: 'Podaj nowy adres e-mail.' });
        }

        const currentUser = db.prepare(`
            SELECT id, first_name, email, is_admin, email_confirmed, pending_email, purchased_items, phone
            FROM users
            WHERE id = ?
        `).get(req.user.id);

        if (!currentUser) {
            return res.status(404).json({ error: 'Nie znaleziono konta.' });
        }

        if (normalizeEmailAddress(currentUser.email) === nextEmail) {
            return res.status(400).json({ error: 'To jest już aktualny adres e-mail tego konta.' });
        }

        const conflictingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ?').get(nextEmail, req.user.id);
        if (conflictingUser) {
            return res.status(409).json({ error: 'Konto z tym adresem e-mail już istnieje.' });
        }

        const emailChangeToken = crypto.randomBytes(32).toString('hex');
        db.prepare(`
            UPDATE users
            SET pending_email = ?,
                email_change_token = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(nextEmail, emailChangeToken, req.user.id);

        const confirmUrl = `${detectBaseUrl(req)}/api/auth/confirm-email-change/${emailChangeToken}`;
        sendPhpMailer('email_change_confirmation', {
            email: nextEmail,
            confirmUrl,
            context: {
                firstName: currentUser.first_name || '',
                currentEmail: currentUser.email,
            },
        }, {
            baseUrl: detectBaseUrl(req),
        });

        const updatedUser = getUserById(req.user.id);
        res.json({
            message: 'Wysłano link potwierdzający na nowy adres e-mail.',
            user: buildUserPayload(updatedUser),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/confirm-email-change/:token', (req, res) => {
    try {
        const { token } = req.params;
        const user = db.prepare(`
            SELECT id, first_name, last_name, email, phone, is_admin, email_confirmed, pending_email, email_change_token, purchased_items
            FROM users
            WHERE email_change_token = ?
        `).get(token);

        if (!user || !user.pending_email) {
            return res.status(400).send('<h1>Nieprawidłowy lub wygasły link do zmiany adresu e-mail.</h1>');
        }

        const nextEmail = normalizeEmailAddress(user.pending_email);
        const conflictingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ? AND id != ?').get(nextEmail, user.id);
        if (conflictingUser) {
            return res.status(409).send('<h1>Ten adres e-mail został już użyty przez inne konto.</h1>');
        }

        db.prepare(`
            UPDATE users
            SET email = ?,
                pending_email = NULL,
                email_change_token = NULL,
                email_confirmed = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(nextEmail, user.id);

        const refreshedUser = getUserById(user.id);
        const activeToken = req.cookies?.auth_token;
        if (activeToken) {
            try {
                const decoded = jwt.verify(activeToken, JWT_SECRET);
                if (decoded?.id === user.id) {
                    setAuthCookie(res, refreshedUser);
                }
            } catch {
                // Ignore invalid browser sessions while confirming e-mail change.
            }
        }

        res.send(`
            <div style="font-family: Georgia, serif; text-align: center; margin-top: 100px; color: #6B5B7B;">
                <h1>✓ Adres e-mail został zaktualizowany</h1>
                <p>Od teraz możesz korzystać z konta przy użyciu nowego adresu e-mail.</p>
                <a href="/panel" style="color: #D4AF37;">Przejdź do panelu użytkownika</a>
            </div>
        `);
    } catch (err) {
        res.status(500).send('<h1>Wystąpił błąd podczas potwierdzania nowego adresu e-mail.</h1>');
    }
});

// ── ME ──
router.get('/me', (req, res) => {
    const optionalSession = ['1', 'true', 'yes'].includes(String(req.query.optional || '').toLowerCase());
    const token = req.cookies.auth_token;
    if (!token) {
        if (optionalSession) {
            return res.json({ authenticated: false, user: null });
        }
        return res.status(401).json({ error: 'Nie zalogowano.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.prepare(`
            SELECT id, first_name, last_name, email, phone, is_admin, email_confirmed, pending_email, purchased_items
            FROM users
            WHERE id = ?
        `).get(decoded.id);
        if (!user) return res.status(404).json({ error: 'Podany użytkownik nie istnieje.' });

        const payload = buildUserPayload(user);

        if (optionalSession) {
            return res.json({ authenticated: true, user: payload });
        }

        res.json(payload);
    } catch (err) {
        if (optionalSession) {
            return res.json({ authenticated: false, user: null });
        }
        res.status(401).json({ error: 'Nieprawidłowy lub wygasły token.' });
    }
});

// ── LOGOUT ──
router.post('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ message: 'Wylogowano.' });
});

export default router;
