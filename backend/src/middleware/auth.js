import { verifyToken } from '../services/jwt.js';
import supabase from '../services/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.allokine_token;
        if (!token) {
            return res.status(401).json({ error: 'Non authentifie' });
        }

        const payload = verifyToken(token);
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.sub)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Session invalide' });
        }

        req.auth = { user };
        return next();
    } catch {
        return res.status(401).json({ error: 'Token invalide' });
    }
};
