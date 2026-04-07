/* global process */
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const createTransporter = () => {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    return nodemailer.createTransport({ jsonTransport: true });
};

const transporter = createTransporter();

export const generateRawToken = () => crypto.randomBytes(32).toString('hex');

export const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const sendResetEmail = async ({ to, token }) => {
    const appBaseUrl = process.env.APP_BASE_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetLink = `${appBaseUrl.replace(/\/$/, '')}/login?resetToken=${token}`;
    const message = {
        to,
        from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'security@allokine.tn',
        subject: 'AlloKine - Reinitialisation du mot de passe',
        text: `Utilisez ce lien pour reinitialiser votre mot de passe: ${resetLink}`
    };

    const info = await transporter.sendMail(message);

    if (info.message) {
        console.log('[MAIL OUTPUT]', info.message);
    }

    console.log('[MAIL RESET LINK]', resetLink);
};

export const sendWelcomeEmail = async ({ to, name }) => {
    const info = await transporter.sendMail({
        to,
        from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'security@allokine.tn',
        subject: 'Bienvenue sur AlloKine',
        text: `Bonjour ${name}, votre compte AlloKine est maintenant actif.`
    });

    if (info.message) {
        console.log('[MAIL OUTPUT]', info.message);
    }
};

export const sendAppointmentReminderEmail = async ({ to, appointment, patientName }) => {
    const info = await transporter.sendMail({
        to,
        from: process.env.MAIL_FROM || process.env.GMAIL_USER || 'security@allokine.tn',
        subject: `Rappel rendez-vous ${appointment.date} ${appointment.time}`,
        text: `Bonjour ${patientName || ''}, rappel de votre rendez-vous AlloKine le ${appointment.date} a ${appointment.time}.`
    });

    if (info.message) {
        console.log('[MAIL OUTPUT]', info.message);
    }
};
