import { getPool } from '../db/pool.js';

export async function safeQuery(query, params = []) {
    const pool = getPool();
    if (!pool) return { rows: [] };
    try {
        return await pool.query(query, params);
    } catch (e) {
        console.warn(`SafeQuery Warning: ${e.message}`);
        return { rows: [] };
    }
}
