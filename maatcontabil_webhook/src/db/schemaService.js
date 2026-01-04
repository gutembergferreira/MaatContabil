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

    try {
        const userCount = await pool.query('SELECT count(*) FROM users');
        if (userCount.rows[0]?.count === '0') {
            const compRes = await pool.query(
                `INSERT INTO companies (name, cnpj, address, contact_info, legal_name, trade_name, active)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [
                    'Empresa Demo LTDA',
                    '00.000.000/0001-00',
                    'Rua Demo, 100',
                    '1199999999',
                    'Empresa Demo LTDA',
                    'Empresa Demo',
                    true
                ]
            );
            const compId = compRes.rows[0]?.id;
            await pool.query(
                'INSERT INTO users (full_name, email, password_hash, role, cpf) VALUES ($1, $2, $3, $4, $5)',
                ['Carlos Admin', 'admin@maat.com', 'admin', 'admin', '00000000000']
            );
            if (compId) {
                await pool.query(
                    'INSERT INTO users (full_name, email, password_hash, role, company_id, cpf) VALUES ($1, $2, $3, $4, $5, $6)',
                    ['Ana Cliente', 'cliente@demo.com', '123', 'client', compId, '00654321090']
                );
            }
            await pool.query(
                'INSERT INTO request_types (name, base_price) VALUES ($1, $2), ($3, $4), ($5, $6)',
                ['2ª Via de Boleto', 0, 'Alteracao Contratual', 150.0, 'Certidao Negativa', 50.0]
            );
            await pool.query(
                'INSERT INTO document_categories (name) VALUES ($1), ($2), ($3), ($4), ($5)',
                ['Boletos', 'Impostos', 'Folha de Pagamento', 'Contratos', 'Documentos Solicitados']
            );
            console.log('Dados iniciais inseridos.');
        }
    } catch (e) {
        console.warn(`Schema Ensure Warning: ${e.message}`);
    }
};
