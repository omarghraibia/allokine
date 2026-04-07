import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sendAppointmentReminderEmail, sendWelcomeEmail } from '../services/mail.js';

const router = Router();

router.post('/welcome', requireAuth, async (req, res) => {
    try {
        await sendWelcomeEmail({
            to: req.auth.user.email,
            name: req.auth.user.name
        });

        return res.status(200).json({ ok: true });
    } catch {
        return res.status(500).json({ error: 'Erreur envoi welcome email' });
    }
});

router.post('/appointment-reminder', requireAuth, async (req, res) => {
    const { to = '', appointment = {}, patientName = '' } = req.body;
    if (!to || !appointment?.date || !appointment?.time) {
        return res.status(400).json({ error: 'Donnees rappel invalides' });
    }

    try {
        await sendAppointmentReminderEmail({
            to,
            appointment,
            patientName
        });

        return res.status(200).json({ ok: true });
    } catch {
        return res.status(500).json({ error: 'Erreur envoi rappel' });
    }
});

export default router;
