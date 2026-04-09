/* global process */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import appointmentRoutes from './routes/appointments.js';
import authRoutes from './routes/auth.js';
import notificationRoutes from './routes/notifications.js';

const app = express();

const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.APP_BASE_URL
]
    .flatMap((value) => (value ? value.split(',') : []))
    .map((value) => value.trim())
    .filter(Boolean);

app.use(helmet());
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Origin non autorisee par CORS'));
        },
        credentials: true
    })
);
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

app.use(
    '/api/auth',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 80
    })
);

app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'allokine-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((error, _req, res, next) => {
    if (error?.message === 'Origin non autorisee par CORS') {
        return res.status(403).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erreur serveur' });
});

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

export default app;
