import { ENSURE_STATEMENTS, SQL_SCHEMA } from './schema.js';

export const ensureSchema = async (pool) => {
    if (!pool) return;
    const schemaSql = SQL_SCHEMA.replace(/CREATE EXTENSION IF NOT EXISTS "uuid-ossp";?/i, '').trim();

    try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (e) {
        console.warn(`Schema Ensure Warning: ${e.message}`);
        try {
            await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
            await pool.query('CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid AS $$ SELECT gen_random_uuid(); $$ LANGUAGE SQL');
        } catch (inner) {
            console.warn(`Schema Ensure Warning: ${inner.message}`);
        }
    }

    try {
        await pool.query(schemaSql);
    } catch (e) {
        console.warn(`Schema Ensure Warning: ${e.message}`);
    }
    for (const stmt of ENSURE_STATEMENTS) {
        try {
            await pool.query(stmt);
        } catch (e) {
            console.warn(`Schema Ensure Warning: ${e.message}`);
        }
    }
};
