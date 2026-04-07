/* global process */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { readDb, writeDb } from '../services/db.js';
import { signToken } from '../services/jwt.js';
import { generateRawToken, hashToken, sendResetEmail } from '../services/mail.js';

const router = Router();

const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    birthDate: user.birthDate || '',
    emergencyContact: user.emergencyContact || '',
    createdAt: user.createdAt
});

const setAuthCookie = (res, token) => {
    res.cookie('allokine_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

router.post('/register', async (req, res) => {
    const { name = '', email = '', password = '', phone = '', birthDate = '', emergencyContact = '' } = req.body;

    if (name.trim().length < 2 || name.length > 100) {
        return res.status(400).json({ error: 'Nom invalide' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Email invalide' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Mot de passe trop court (min 8)' });
    }

    const db = readDb();
    const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
        return res.status(409).json({ error: 'Email deja utilise' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash,
        role: 'client',
        phone,
        birthDate,
        emergencyContact,
        createdAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDb(db);

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);

    return res.status(201).json({ user: sanitizeUser(user) });
});

router.post('/login', async (req, res) => {
    const { email = '', password = '' } = req.body;
    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

    if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    return res.status(200).json({ user: sanitizeUser(user) });
});

router.post('/logout', (req, res) => {
    res.clearCookie('allokine_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
    return res.status(200).json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
    return res.status(200).json({ user: sanitizeUser(req.auth.user) });
});

router.post('/forgot-password', async (req, res) => {
    const { email = '' } = req.body;
    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());

    if (user) {
        const rawToken = generateRawToken();
        const tokenHash = hashToken(rawToken);
        db.resetTokens.push({
            tokenHash,
            userId: user.id,
            expiresAt: Date.now() + 15 * 60 * 1000
        });
        writeDb(db);
        await sendResetEmail({ to: user.email, token: rawToken });
    }

    return res.status(200).json({ ok: true, message: 'Si le compte existe, un email a ete envoye.' });
});

router.post('/reset-password', async (req, res) => {
    const { token = '', newPassword = '' } = req.body;
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Mot de passe trop court' });
    }

    const db = readDb();
    const tokenHash = hashToken(token);
    const saved = db.resetTokens.find((t) => t.tokenHash === tokenHash && t.expiresAt > Date.now());
    if (!saved) {
        return res.status(400).json({ error: 'Token invalide ou expire' });
    }

    const user = db.users.find((u) => u.id === saved.userId);
    if (!user) {
        return res.status(400).json({ error: 'Utilisateur introuvable' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    db.resetTokens = db.resetTokens.filter((t) => t.tokenHash !== tokenHash);
    writeDb(db);

    return res.status(200).json({ ok: true });
});

export default router;


