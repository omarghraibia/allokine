/* global process */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import './config/loadEnv.js';
import appointmentRoutes from './routes/appointments.js';
import authRoutes from './routes/auth.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
        credentials: true
    })
);
app.use(express.json({ limit: '2mb' }));
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

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
    console.log(`AlloKine backend running on http://localhost:${port}`);
});
