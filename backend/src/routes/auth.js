/* global process */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../services/supabaseClient.js';
import { signToken } from '../services/jwt.js';
import { generateRawToken, hashToken, sendResetEmail } from '../services/mail.js';

const router = Router();

const validatePassword = (password) => {
    const errors = [];

    if (password.length < 8) errors.push('Le mot de passe doit contenir au moins 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Le mot de passe doit contenir au moins une majuscule');
    if (!/[0-9]/.test(password)) errors.push('Le mot de passe doit contenir au moins un chiffre');
    if (!/[!@#$%^&*]/.test(password)) {
        errors.push('Le mot de passe doit contenir un caractere special (!@#$%^&*)');
    }

    return errors;
};

const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    birthDate: user.birth_date || '',
    emergencyContact: user.emergency_contact || '',
    createdAt: user.created_at
});

const getCookieOptions = () => {
    const sameSite = process.env.COOKIE_SAME_SITE || 'lax';
    const secure = process.env.COOKIE_SECURE
        ? process.env.COOKIE_SECURE === 'true'
        : process.env.NODE_ENV === 'production' || sameSite === 'none';

    return {
        httpOnly: true,
        secure,
        sameSite,
        domain: process.env.COOKIE_DOMAIN || undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
};

const setAuthCookie = (res, token) => {
    res.cookie('allokine_token', token, getCookieOptions());
};

const clearAuthCookie = (res) => {
    const cookieOptions = getCookieOptions();
    res.clearCookie('allokine_token', {
        httpOnly: cookieOptions.httpOnly,
        sameSite: cookieOptions.sameSite,
        secure: cookieOptions.secure,
        domain: cookieOptions.domain
    });
};

const findOrCreateUserByEmail = async ({ email, name = '', phone = '', birthDate = '', emergencyContact = '' }) => {
    const normalizedEmail = email.toLowerCase();

    const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

    if (!existingError && existingUser) {
        return existingUser;
    }

    const passwordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);
    const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert({
            name: name.trim() || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            password_hash: passwordHash,
            role: 'client',
            phone,
            birth_date: birthDate,
            emergency_contact: emergencyContact
        })
        .select()
        .single();

    if (createError) {
        throw createError;
    }

    return createdUser;
};

router.post('/register', async (req, res) => {
    const { name = '', email = '', password = '', phone = '', birthDate = '', emergencyContact = '' } = req.body;

    if (name.trim().length < 2 || name.length > 100) {
        return res.status(400).json({ error: 'Nom invalide' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Email invalide' });
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
        return res.status(400).json({ error: passwordErrors[0], errors: passwordErrors });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

    if (!checkError && existingUser) {
        return res.status(409).json({ error: 'Email deja utilise' });
    }

    const { data: user, error } = await supabase
        .from('users')
        .insert({
            name: name.trim(),
            email: email.toLowerCase(),
            password_hash: passwordHash,
            role: 'client',
            phone,
            birth_date: birthDate,
            emergency_contact: emergencyContact
        })
        .select()
        .single();

    if (error) {
        console.error('Erreur inscription Supabase:', error);
        return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);

    return res.status(201).json({ user: sanitizeUser(user) });
});

router.post('/login', async (req, res) => {
    const { email = '', password = '' } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
        return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = signToken({ sub: user.id, role: user.role });
    setAuthCookie(res, token);
    return res.status(200).json({ user: sanitizeUser(user) });
});

router.post('/oauth/exchange', async (req, res) => {
    const { accessToken = '' } = req.body;
    if (!accessToken) {
        return res.status(400).json({ error: 'Access token manquant' });
    }

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user?.email) {
        return res.status(401).json({ error: 'Session OAuth invalide' });
    }

    try {
        const providerUser = data.user;
        const user = await findOrCreateUserByEmail({
            email: providerUser.email,
            name:
                providerUser.user_metadata?.full_name ||
                providerUser.user_metadata?.name ||
                providerUser.email.split('@')[0]
        });

        const token = signToken({ sub: user.id, role: user.role });
        setAuthCookie(res, token);

        return res.status(200).json({ user: sanitizeUser(user) });
    } catch (createError) {
        console.error('Erreur OAuth exchange:', createError);
        return res.status(500).json({ error: 'Erreur lors de la connexion sociale' });
    }
});

router.post('/logout', (req, res) => {
    clearAuthCookie(res);
    return res.status(200).json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
    return res.status(200).json({ user: sanitizeUser(req.auth.user) });
});

router.post('/forgot-password', async (req, res) => {
    const { email = '' } = req.body;

    const { data: user } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single();

    if (user) {
        const rawToken = generateRawToken();
        const tokenHash = hashToken(rawToken);

        const { error: insertError } = await supabase
            .from('reset_tokens')
            .insert({
                user_id: user.id,
                token_hash: tokenHash,
                expires_at: Date.now() + 15 * 60 * 1000
            });

        if (!insertError) {
            await sendResetEmail({ to: user.email, token: rawToken });
        }
    }

    return res.status(200).json({ ok: true, message: 'Si le compte existe, un email a ete envoye.' });
});

router.post('/reset-password', async (req, res) => {
    const { token = '', newPassword = '' } = req.body;

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
        return res.status(400).json({ error: passwordErrors[0], errors: passwordErrors });
    }

    const tokenHash = hashToken(token);

    const { data: saved, error: tokenError } = await supabase
        .from('reset_tokens')
        .select('user_id')
        .eq('token_hash', tokenHash)
        .gt('expires_at', Date.now())
        .single();

    if (tokenError || !saved) {
        return res.status(400).json({ error: 'Token invalide ou expire' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', saved.user_id);

    if (updateError) {
        return res.status(500).json({ error: 'Erreur lors de la mise a jour du mot de passe' });
    }

    await supabase
        .from('reset_tokens')
        .delete()
        .eq('token_hash', tokenHash);

    return res.status(200).json({ ok: true });
});

export default router;
