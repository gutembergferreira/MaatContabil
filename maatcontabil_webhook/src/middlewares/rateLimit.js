const DEFAULT_LIMIT = Number(process.env.RATE_LIMIT_MAX || 300);
const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);

export const rateLimit = (options = {}) => {
    const limit = Number(options.max || DEFAULT_LIMIT);
    const windowMs = Number(options.windowMs || DEFAULT_WINDOW_MS);
    const store = new Map();

    return (req, res, next) => {
        const key = req.ip || 'unknown';
        const now = Date.now();
        const entry = store.get(key) || { count: 0, resetAt: now + windowMs };
        if (now > entry.resetAt) {
            entry.count = 0;
            entry.resetAt = now + windowMs;
        }
        entry.count += 1;
        store.set(key, entry);

        if (entry.count > limit) {
            const retryAfter = Math.max(0, Math.ceil((entry.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfter));
            return res.status(429).json({ error: 'Rate limit exceeded' });
        }
        return next();
    };
};
