import { verifyToken } from '../services/jwt.js';
import { readDb } from '../services/db.js';

export const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies?.allokine_token;
        if (!token) {
            return res.status(401).json({ error: 'Non authentifie' });
        }

        const payload = verifyToken(token);
        const db = readDb();
        const user = db.users.find((u) => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: 'Session invalide' });
        }

        req.auth = { user };
        return next();
    } catch {
        return res.status(401).json({ error: 'Token invalide' });
    }
};
