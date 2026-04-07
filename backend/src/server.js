/* global process */
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import supabase from './services/supabaseClient.js';

dotenv.config();

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

const ensureSeedDoctor = async () => {
    const { data: existingDoctor, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'docteur')
        .single();

    if (existingDoctor && !selectError) return;

    const passwordHash = await bcrypt.hash('admin123', 12);
    const { error: insertError } = await supabase
        .from('users')
        .insert({
            name: 'Dr. Fethi Ghraibia',
            email: 'omar_oumay@hotmail.com',
            password_hash: passwordHash,
            role: 'docteur',
            phone: '+216 98 561 586'
        });

    if (insertError) {
        console.error('Erreur creation doctor seed:', insertError.message);
    } else {
        console.log('✓ Doctor seed creee avec succes');
    }
};

await ensureSeedDoctor();

app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'allokine-backend' });
});

app.use('/api/auth', authRoutes);

app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
    console.log(`AlloKine backend running on http://localhost:${port}`);
});


