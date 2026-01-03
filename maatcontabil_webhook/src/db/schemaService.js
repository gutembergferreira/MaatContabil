import { ENSURE_STATEMENTS } from './schema.js';

export const ensureSchema = async (pool) => {
    if (!pool) return;
    for (const stmt of ENSURE_STATEMENTS) {
        try {
            await pool.query(stmt);
        } catch (e) {
            console.warn(`Schema Ensure Warning: ${e.message}`);
        }
    }
};
