/* global process */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('JWT_SECRET manquant. Configurez JWT_SECRET dans Vercel ou dans le fichier .env.');
}

const getJwtSecret = () => {
    if (!JWT_SECRET) {
        const error = new Error('Configuration JWT manquante');
        error.statusCode = 500;
        error.expose = true;
        throw error;
    }

    return JWT_SECRET;
};

export const signToken = (payload) => {
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());
