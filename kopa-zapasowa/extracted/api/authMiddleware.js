import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_do_not_use_in_prod';

export function requireAuth(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: 'Brak dostępu - wymagane zalogowanie.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, is_admin }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Nieprawidłowy token autoryzacji.' });
    }
}

export function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Brak uprawnień administratora.' });
        }
        next();
    });
}
