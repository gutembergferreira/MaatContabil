import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { SQL_SCHEMA } from '../db/schema.js';
import { CERTS_DIR, DB_CONFIG_FILE } from '../config.js';
import { initDbConnection, getPool, saveDbConfig } from '../db/pool.js';

const { Client } = pg;
const resolveSslConfig = () => {
    const sslInsecure = String(process.env.DATABASE_SSL_INSECURE || '').toLowerCase() === 'true';
    if (sslInsecure) {
        console.warn('SSL: modo inseguro habilitado (rejectUnauthorized=false).');
        return { rejectUnauthorized: false };
    }
    const caInline = process.env.DATABASE_SSL_CA || '';
    const caBase64 = process.env.DATABASE_SSL_CA_BASE64 || '';
    const caFile = process.env.DATABASE_SSL_CA_FILE || process.env.PGSSLROOTCERT || '';
    const caPath = caFile
        ? (path.isAbsolute(caFile) ? caFile : path.join(CERTS_DIR, caFile))
        : path.join(CERTS_DIR, 'dbpostgres-ca-certificate.crt');
    const caFromFile = fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : '';
    const ca = caInline || (caBase64 ? Buffer.from(caBase64, 'base64').toString('utf8') : '') || caFromFile;
    if (ca) return { ca, rejectUnauthorized: true };
    return { rejectUnauthorized: false };
};


export const setupDb = async (req, res) => {
    const config = req.body;
    let logs = [];
    const log = (m) => {
        console.log(m);
        logs.push(m);
    };
    try {
        const ssl = config.ssl ? resolveSslConfig() : false;
        const rootClient = new Client({ user: config.user, host: config.host, database: 'postgres', password: config.pass, port: config.port, ssl });
        await rootClient.connect();
        const check = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = '${config.dbName}'`);
        if (check.rowCount === 0) {
            await rootClient.query(`CREATE DATABASE "${config.dbName}"`);
            log(`Banco ${config.dbName} criado.`);
        }
        await rootClient.end();

        const dbClient = new Client({ user: config.user, host: config.host, database: config.dbName, password: config.pass, port: config.port, ssl });
        await dbClient.connect();
        await dbClient.query(SQL_SCHEMA);
        log('Tabelas criadas/atualizadas.');
        await dbClient.query(`ALTER TABLE request_attachments ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);`);
        await dbClient.query(`ALTER TABLE request_attachments ADD COLUMN IF NOT EXISTS entity_id UUID;`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS birth_city VARCHAR(100);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS birth_state VARCHAR(2);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS nationality VARCHAR(80);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS education_level VARCHAR(80);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS contract_type VARCHAR(30);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS weekly_hours INTEGER;`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS shift VARCHAR(50);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS titulo_eleitor_zone VARCHAR(10);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS titulo_eleitor_section VARCHAR(10);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS ctps_series VARCHAR(10);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS ctps_uf VARCHAR(2);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS reservista VARCHAR(30);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS email VARCHAR(255);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_district VARCHAR(100);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_account VARCHAR(30);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(20);`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS dependents_count INTEGER;`);
        await dbClient.query(`ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS dependents_notes TEXT;`);

        const userCount = await dbClient.query('SELECT count(*) FROM users');
        if (userCount.rows[0].count === '0') {
            log('Populando dados iniciais...');
            const compRes = await dbClient.query(`INSERT INTO companies (name, cnpj, address, contact_info, legal_name, trade_name, active) VALUES ('Empresa Demo LTDA', '00.000.000/0001-00', 'Rua Demo, 100', '1199999999', 'Empresa Demo LTDA', 'Empresa Demo', true) RETURNING id`);
            const compId = compRes.rows[0].id;
            await dbClient.query(`INSERT INTO users (full_name, email, password_hash, role, cpf) VALUES ('Carlos Admin', 'admin@maat.com', 'admin', 'admin', '00000000000')`);
            await dbClient.query(`INSERT INTO users (full_name, email, password_hash, role, company_id, cpf) VALUES ('Ana Cliente', 'cliente@demo.com', '123', 'client', '${compId}', '00654321090')`);
            await dbClient.query(`INSERT INTO request_types (name, base_price) VALUES ('2¶¦ Via de Boleto', 0), ('AlteraÇõÇœo Contratual', 150.00), ('CertidÇœo Negativa', 50.00)`);
            await dbClient.query(`INSERT INTO document_categories (name) VALUES ('Boletos'), ('Impostos'), ('Folha de Pagamento'), ('Contratos'), ('Documentos Solicitados')`);
            log('Dados iniciais inseridos.');
        }
        await dbClient.end();
        saveDbConfig(config);
        initDbConnection(config);
        res.json({ success: true, logs });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message, logs });
    }
};

export const status = (req, res) => res.json({ configured: !!getPool() });

export const getAppSettings = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    try {
        const result = await pool.query('SELECT key, value FROM app_settings');
        const settings = {};
        result.rows.forEach((row) => {
            settings[row.key] = row.value;
        });
        return res.json({ apiBaseUrl: settings.api_base_url || '' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

export const setAppSettings = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    const apiBaseUrl = typeof req.body?.apiBaseUrl === 'string' ? req.body.apiBaseUrl : '';
    try {
        await pool.query(
            'INSERT INTO app_settings(key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()',
            ['api_base_url', apiBaseUrl]
        );
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

export const getDbConfig = async (req, res) => {
    const pool = getPool();
    if (!pool) return res.status(500).json({ error: 'DB not connected' });
    try {
        if (fs.existsSync(DB_CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'));
            return res.json({ host: config.host, port: String(config.port || ''), dbName: config.dbName, ssl: !!config.ssl });
        }
        return res.json({});
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
