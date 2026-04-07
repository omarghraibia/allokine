/* global process */
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import supabase from '../services/supabaseClient.js';
import { signToken } from '../services/jwt.js';
import { generateRawToken, hashToken, sendResetEmail } from '../services/mail.js';

const router = Router();

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

    const passwordHash = await bcrypt.hash(password, 12);

    // Vérifier si l'email existe déjà
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

    if (!checkError && existingUser) {
        return res.status(409).json({ error: 'Email deja utilise' });
    }

    // Insérer le nouvel utilisateur
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
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Mot de passe trop court' });
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

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', saved.user_id);

    if (updateError) {
        return res.status(500).json({ error: 'Erreur lors de la mise a jour du mot de passe' });
    }

    // Supprimer le token
    await supabase
        .from('reset_tokens')
        .delete()
        .eq('token_hash', tokenHash);

    return res.status(200).json({ ok: true });
});

export default router;


