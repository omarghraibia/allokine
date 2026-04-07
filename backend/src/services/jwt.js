/* global process */
import jwt from 'jsonwebtoken';
import '../config/loadEnv.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('JWT_SECRET manquant dans backend/.env');
    process.exit(1);
}

export const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
