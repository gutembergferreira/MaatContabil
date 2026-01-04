import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { CERTS_DIR, DB_CONFIG_FILE, DATABASE_SSL, DATABASE_SSLMODE } from '../config.js';
import { ensureSchema } from './schemaService.js';

const { Pool } = pg;
let dbPool = null;

export const getPool = () => dbPool;
export const isConnected = () => !!dbPool;

export const initDbConnection = (config) => {
    try {
        dbPool = new Pool({
            user: config.user,
            host: config.host,
            database: config.dbName,
            password: config.pass,
            port: config.port,
            ssl: config.ssl ? resolveSslOptions('', true) : false
        });
        dbPool
            .query('SELECT NOW()')
            .then(() => {
                console.log(`Conectado ao banco: ${config.dbName}`);
                return ensureSchema(dbPool);
            })
            .catch((err) => {
                console.error('ERRO DB:', err.message);
            });
    } catch (e) {
        console.error('Pool Error:', e);
    }
};

const resolveSslOptions = (connectionString = '', forceSsl = false) => {
    const caInline = process.env.DATABASE_SSL_CA || '';
    const caBase64 = process.env.DATABASE_SSL_CA_BASE64 || '';
    const caFile = process.env.DATABASE_SSL_CA_FILE || process.env.PGSSLROOTCERT || '';
    const caPath = caFile
        ? (path.isAbsolute(caFile) ? caFile : path.join(CERTS_DIR, caFile))
        : path.join(CERTS_DIR, 'dbpostgres-ca-certificate.crt');
    const caFromFile = fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : '';
    const ca = caInline || (caBase64 ? Buffer.from(caBase64, 'base64').toString('utf8') : '') || caFromFile;
    if (ca) {
        return { ca, rejectUnauthorized: true };
    }
    const sslMode = String(DATABASE_SSLMODE || '').toLowerCase();
    const wantsSsl = forceSsl
        || DATABASE_SSL
        || sslMode === 'require'
        || sslMode === 'verify-full'
        || /sslmode=require/i.test(connectionString)
        || /sslmode=verify-full/i.test(connectionString);
    if (!wantsSsl) return false;
    return { rejectUnauthorized: false };
};

export const initDbConnectionFromUrl = (connectionString) => {
    if (!connectionString) return;
    try {
        dbPool = new Pool({
            connectionString,
            ssl: resolveSslOptions(connectionString)
        });
        dbPool
            .query('SELECT NOW()')
            .then(() => {
                console.log('Conectado ao banco via DATABASE_URL');
                return ensureSchema(dbPool);
            })
            .catch((err) => {
                console.error('ERRO DB:', err.message);
            });
    } catch (e) {
        console.error('Pool Error:', e);
    }
};

export const loadDbConfig = () => {
    if (!fs.existsSync(DB_CONFIG_FILE)) return null;
    try {
        return JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'));
    } catch (e) {
        return null;
    }
};

export const saveDbConfig = (config) => {
    fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(config, null, 2));
};
