/* global process */
import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'data/db.json');

export const readDb = () => {
    try {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return { users: [], resetTokens: [] };
    }
};

export const writeDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};


