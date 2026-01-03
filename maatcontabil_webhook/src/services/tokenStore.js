import crypto from 'crypto';

const tokens = new Map();

export const createToken = (user) => {
    const token = crypto.randomBytes(24).toString('hex');
    tokens.set(token, { user, createdAt: Date.now() });
    return token;
};

export const getUserForToken = (token) => {
    if (!token) return null;
    const entry = tokens.get(token);
    return entry ? entry.user : null;
};

export const revokeToken = (token) => {
    if (token) tokens.delete(token);
};
