import { getPool } from '../db/pool.js';

export const markRead = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing notification id' });
    try {
        await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const upsertNotifications = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { notifications } = req.body;
    if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(400).json({ error: 'Missing notifications payload' });
    }
    try {
        for (const n of notifications) {
            if (!n.id || !n.userId || !n.title) continue;
            await pool.query(
                'INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES ($1, $2, $3, $4, false, $5) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message',
                [n.id, n.userId, n.title, n.message || '', n.timestamp || new Date().toISOString()]
            );
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const updateNotification = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    const { title, message } = req.body;
    try {
        await pool.query('UPDATE notifications SET title = $1, message = $2 WHERE id = $3', [title || '', message || '', id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteNotification = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
        await pool.query('DELETE FROM request_attachments WHERE entity_type = $1 AND entity_id = $2', ['notification', id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
