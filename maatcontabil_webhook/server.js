import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import multer from 'multer';
import pg from 'pg'; 
import { fileURLToPath } from 'url';

const { Client, Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_CONFIG_FILE = path.join(__dirname, 'db-config.json');

app.use(cors());
app.use(bodyParser.json());

// --- SCHEMA SQL (Deve ser idêntico ao do Frontend) ---
const SQL_SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    contact_info VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'client')) NOT NULL,
    company_id UUID REFERENCES companies(id),
    cpf VARCHAR(14),
    phone VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    request_type_id UUID REFERENCES request_types(id),
    price DECIMAL(10, 2),
    status VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'N/A',
    txid VARCHAR(255),
    pix_code TEXT,
    pix_expiration TIMESTAMP,
    pix_payload JSONB,
    client_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    reference_date DATE,
    file_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Enviado',
    payment_status VARCHAR(50) DEFAULT 'N/A',
    amount DECIMAL(10, 2),
    competence VARCHAR(20),
    company_id UUID REFERENCES companies(id),
    request_id UUID REFERENCES service_requests(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS request_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20),
    entity_id UUID NOT NULL,
    sender_id UUID REFERENCES users(id),
    sender_name VARCHAR(255),
    role VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50),
    entity_id UUID,
    action VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const upload = multer({ dest: 'certs/' });
let dbPool = null;

// --- DB CONNECTION ---
const initDbConnection = (config) => {
    try {
        dbPool = new Pool({
            user: config.user, host: config.host, database: config.dbName, password: config.pass, port: config.port
        });
        dbPool.query('SELECT NOW()', (err) => {
            if (err) console.error('ERRO DB:', err.message);
            else console.log(`✅ Conectado ao banco: ${config.dbName}`);
        });
    } catch (e) { console.error('Pool Error:', e); }
};

if (fs.existsSync(DB_CONFIG_FILE)) {
    try { initDbConnection(JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'))); } catch (e) {}
}

// --- ROTA: SETUP & SEED ---
app.post('/api/setup-db', async (req, res) => {
    const config = req.body;
    let logs = [];
    const log = (m) => { console.log(m); logs.push(m); };

    try {
        // 1. Create DB if not exists
        const rootClient = new Client({ user: config.user, host: config.host, database: 'postgres', password: config.pass, port: config.port });
        await rootClient.connect();
        const check = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = '${config.dbName}'`);
        if (check.rowCount === 0) {
            await rootClient.query(`CREATE DATABASE "${config.dbName}"`);
            log(`Banco ${config.dbName} criado.`);
        }
        await rootClient.end();

        // 2. Create Tables
        const dbClient = new Client({ user: config.user, host: config.host, database: config.dbName, password: config.pass, port: config.port });
        await dbClient.connect();
        await dbClient.query(SQL_SCHEMA);
        log('Tabelas criadas/atualizadas.');

        // 3. SEEDING (Dados Iniciais)
        const userCount = await dbClient.query('SELECT count(*) FROM users');
        if (userCount.rows[0].count === '0') {
            log('Populando dados iniciais...');
            
            // Seed Companies
            const compRes = await dbClient.query(`INSERT INTO companies (name, cnpj, address, contact_info) VALUES ('Empresa Demo LTDA', '00.000.000/0001-00', 'Rua Demo, 100', '1199999999') RETURNING id`);
            const compId = compRes.rows[0].id;
            
            // Seed Users
            await dbClient.query(`INSERT INTO users (full_name, email, password_hash, role, cpf) VALUES ('Carlos Admin', 'admin@maat.com', 'admin', 'admin', '00000000000')`);
            await dbClient.query(`INSERT INTO users (full_name, email, password_hash, role, company_id, cpf) VALUES ('Ana Cliente', 'cliente@demo.com', '123', 'client', '${compId}', '00654321090')`);
            
            // Seed Request Types
            await dbClient.query(`INSERT INTO request_types (name, base_price) VALUES ('2ª Via de Boleto', 0), ('Alteração Contratual', 150.00), ('Certidão Negativa', 50.00)`);
            
            // Seed Document Categories
            await dbClient.query(`INSERT INTO document_categories (name) VALUES ('Boletos'), ('Impostos'), ('Folha de Pagamento'), ('Contratos'), ('Documentos Solicitados')`);
            
            log('Dados iniciais inseridos.');
        }

        await dbClient.end();
        fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(config, null, 2));
        initDbConnection(config);
        res.json({ success: true, logs });

    } catch (e) {
        res.status(500).json({ success: false, message: e.message, logs });
    }
});

app.get('/api/status', (req, res) => res.json({ configured: !!dbPool }));

// --- ROTA: SYNC (Frontend -> DB) ---
// Esta rota retorna TODOS os dados necessários para o Frontend montar a tela
app.get('/api/sync', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });

    try {
        const companies = await dbPool.query('SELECT id, name, cnpj, address, contact_info as contact FROM companies');
        
        const users = await dbPool.query(`
            SELECT u.id, u.full_name as name, u.email, u.password_hash as password, u.role, u.company_id as "companyId", u.cpf, u.photo_url as "photoUrl"
            FROM users u
        `);

        // Request Types
        const reqTypes = await dbPool.query('SELECT id, name, base_price as price FROM request_types');
        
        // Categories
        const docCats = await dbPool.query('SELECT name FROM document_categories WHERE active = true');

        // Service Requests (Joined with Types for name resolution if needed, but we keep simple)
        const requests = await dbPool.query(`
            SELECT sr.id, sr.protocol, sr.title, sr.description, sr.price, sr.status, sr.payment_status as "paymentStatus", 
                   sr.txid, sr.pix_code as "pixCopiaECola", sr.pix_expiration as "pixExpiration",
                   sr.client_id as "clientId", sr.company_id as "companyId", sr.created_at as "createdAt", 
                   sr.updated_at as "updatedAt", (sr.deleted_at IS NOT NULL) as deleted,
                   rt.name as type, rt.id as "typeId"
            FROM service_requests sr
            LEFT JOIN request_types rt ON sr.request_type_id = rt.id
        `);

        // Attachments
        const attachments = await dbPool.query(`
            SELECT ra.id, ra.request_id as "requestId", ra.file_name as name, ra.file_url as url, u.full_name as "uploadedBy", ra.created_at as "createdAt"
            FROM request_attachments ra
            LEFT JOIN users u ON ra.uploaded_by = u.id
        `);

        // Documents
        const documents = await dbPool.query(`
            SELECT d.id, d.title, d.category, d.reference_date as date, d.company_id as "companyId", d.status, 
                   d.payment_status as "paymentStatus", d.amount, d.competence
            FROM documents d
        `);

        // Chat
        const chat = await dbPool.query(`
            SELECT id, entity_id as "entityId", sender_name as sender, role, message as text, created_at as timestamp 
            FROM chat_messages
        `);

        // Audit Logs
        const logs = await dbPool.query(`
            SELECT id, entity_id as "entityId", action, user_name as user, created_at as timestamp 
            FROM audit_logs
        `);
        
        // Notifications
        const notifs = await dbPool.query(`
            SELECT id, user_id as "userId", title, message, is_read as read, created_at as timestamp 
            FROM notifications
        `);

        res.json({
            companies: companies.rows,
            users: users.rows,
            requestTypes: reqTypes.rows,
            categories: docCats.rows.map(r => r.name),
            requests: requests.rows,
            attachments: attachments.rows,
            documents: documents.rows,
            chat: chat.rows,
            auditLogs: logs.rows,
            notifications: notifs.rows
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// --- ROTA: LOGIN ---
app.post('/api/login', async (req, res) => {
    if (!dbPool) return res.status(500).json({ message: 'DB Disconnected' });
    const { email, password } = req.body;
    try {
        const result = await dbPool.query('SELECT id, full_name as name, email, role, company_id as "companyId", cpf FROM users WHERE email = $1 AND password_hash = $2', [email, password]);
        if (result.rows.length > 0) res.json({ success: true, user: result.rows[0] });
        else res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// --- ROTA: PIX (Mantida a lógica de integração) ---
app.post('/api/pix', async (req, res) => {
    const { clientId, clientSecret, pixKey, amount, protocol, requestData } = req.body;
    const crtPath = path.join(__dirname, 'certs', 'certificado.crt');
    const keyPath = path.join(__dirname, 'certs', 'chave.key');

    if (!fs.existsSync(crtPath) || !fs.existsSync(keyPath)) return res.status(400).json({ error: 'Certificados não encontrados.' });

    try {
        const agent = new https.Agent({ cert: fs.readFileSync(crtPath), key: fs.readFileSync(keyPath) });
        const INTER_URL = 'https://cdpj.partners.bancointer.com.br';

        // 1. Auth
        const auth = await axios.post(`${INTER_URL}/oauth/v2/token`, 
            new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: 'cob.write', grant_type: 'client_credentials' }), 
            { httpsAgent: agent }
        );

        // 2. Cob
        const cleanCpf = (requestData.cpf || '').replace(/\D/g, '');
        const cob = await axios.post(`${INTER_URL}/pix/v2/cob`, {
            calendario: { expiracao: 3600 },
            devedor: { cpf: cleanCpf, nome: requestData.name },
            valor: { original: amount.toFixed(2) },
            chave: pixKey,
            solicitacaoPagador: `Servico ${protocol}`
        }, { httpsAgent: agent, headers: { Authorization: `Bearer ${auth.data.access_token}` } });

        res.json({ txid: cob.data.txid, pixCopiaECola: cob.data.pixCopiaECola });

    } catch (error) {
        console.error('PIX Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Falha Inter', details: error.response?.data });
    }
});

// --- ROTA: UPLOAD CERTIFICADOS ---
app.post('/api/upload-cert', upload.fields([{ name: 'crt' }, { name: 'key' }]), (req, res) => {
    if (!fs.existsSync(path.join(__dirname, 'certs'))) fs.mkdirSync(path.join(__dirname, 'certs'));
    if (req.files['crt']) fs.renameSync(req.files['crt'][0].path, path.join(__dirname, 'certs', 'certificado.crt'));
    if (req.files['key']) fs.renameSync(req.files['key'][0].path, path.join(__dirname, 'certs', 'chave.key'));
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));