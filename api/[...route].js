import app from '../backend/src/app.js';

export default function handler(req, res) {
    if (req.url?.startsWith('/api/')) {
        req.url = req.url.replace(/^\/api/, '') || '/';
    }

    return app(req, res);
}