import { getPool } from '../db/pool.js';

export const notifyUsers = async (userIds, title, message) => {
    const pool = getPool();
    if (!pool || !Array.isArray(userIds) || userIds.length === 0) return;
    const createdAt = new Date().toISOString();
    for (const userId of userIds) {
        await pool.query(
            'INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, false, $4)',
            [userId, title, message, createdAt]
        );
    }
};
