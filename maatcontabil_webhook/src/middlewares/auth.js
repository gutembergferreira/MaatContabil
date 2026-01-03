import { getUserForToken } from '../services/tokenStore.js';

const REQUIRE_AUTH = String(process.env.REQUIRE_AUTH || '').toLowerCase() === 'true';
const PUBLIC_PATHS = new Set([
    '/login',
    '/setup-db',
    '/status',
    '/db-config',
    '/app-settings',
    '/cep',
    '/upload-cert',
    '/pix',
    '/health'
]);

export const authMiddleware = (req, res, next) => {
    if (!REQUIRE_AUTH) return next();
    const path = req.path || '';
    if (PUBLIC_PATHS.has(path) || path.startsWith('/cep/')) {
        return next();
    }
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const user = getUserForToken(token);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    return next();
};
