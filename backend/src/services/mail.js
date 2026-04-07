import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({ jsonTransport: true });

export const generateRawToken = () => crypto.randomBytes(32).toString('hex');

export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const sendResetEmail = async ({ to, token }) => {
    const resetLink = `http://localhost:5173/login?resetToken=${token}`;
    const message = {
        to,
        from: 'security@allokine.tn',
        subject: 'AlloKine - Reinitialisation du mot de passe',
        text: `Utilisez ce lien pour reinitialiser votre mot de passe: ${resetLink}`
    };

    const info = await transporter.sendMail(message);
    console.log('[MAIL-SIM RESET PASSWORD]', info.message);
};
