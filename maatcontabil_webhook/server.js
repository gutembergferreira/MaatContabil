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

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

const SQL_SCHEMA = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS companies ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    name VARCHAR(255) NOT NULL, 
    cnpj VARCHAR(20) UNIQUE NOT NULL, 
    address TEXT, 
    contact_info VARCHAR(100), 
    legal_name VARCHAR(255),
    trade_name VARCHAR(255),
    nickname VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    tax_regime VARCHAR(80),
    company_group VARCHAR(80),
    honorarium VARCHAR(50),
    company_code VARCHAR(50),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_zip VARCHAR(10),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    state_registration VARCHAR(80),
    state_registration_date DATE,
    state_registration_uf VARCHAR(2),
    state_exempt BOOLEAN DEFAULT FALSE,
    nire VARCHAR(50),
    other_identifiers VARCHAR(255),
    phones VARCHAR(255),
    website VARCHAR(255),
    municipal_registration VARCHAR(80),
    municipal_registration_date DATE,
    notes TEXT,
    tags TEXT,
    contacts JSONB,
    obligations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    department VARCHAR(50),
    responsible VARCHAR(100),
    expected_minutes INTEGER,
    monthly_due JSONB,
    reminder_days INTEGER,
    reminder_type VARCHAR(30),
    non_business_rule VARCHAR(60),
    saturday_business BOOLEAN DEFAULT FALSE,
    competence_rule VARCHAR(30),
    requires_robot BOOLEAN DEFAULT FALSE,
    has_fine BOOLEAN DEFAULT FALSE,
    alert_guide BOOLEAN DEFAULT TRUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    obligation_id UUID REFERENCES obligations(id),
    obligation_name VARCHAR(255),
    department VARCHAR(50),
    competence VARCHAR(7),
    deadline DATE,
    status VARCHAR(20) DEFAULT 'Pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, obligation_id, competence)
);

CREATE TABLE IF NOT EXISTS users ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    full_name VARCHAR(255) NOT NULL, 
    email VARCHAR(255) UNIQUE NOT NULL, 
    password_hash VARCHAR(255) NOT NULL, 
    role VARCHAR(20) NOT NULL, 
    company_id UUID REFERENCES companies(id), 
    cpf VARCHAR(14), 
    phone VARCHAR(50), 
    photo_url TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    last_login TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS work_sites ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    company_id UUID REFERENCES companies(id), 
    name VARCHAR(100) NOT NULL, 
    description TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS employees ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    company_id UUID REFERENCES companies(id), 
    work_site_id UUID REFERENCES work_sites(id), 
    name VARCHAR(255) NOT NULL, 
    role VARCHAR(100) NOT NULL, 
    admission_date DATE NOT NULL, 
    status VARCHAR(20) DEFAULT 'Ativo', 
    salary DECIMAL(12, 2) NOT NULL, 
    cpf VARCHAR(14) NOT NULL, 
    rg VARCHAR(20), 
    pis VARCHAR(20), 
    birth_date DATE,
    birth_city VARCHAR(100),
    birth_state VARCHAR(2),
    nationality VARCHAR(80),
    mother_name VARCHAR(255),
    father_name VARCHAR(255),
    education_level VARCHAR(80),
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    contract_type VARCHAR(30),
    weekly_hours INTEGER,
    shift VARCHAR(50),
    expected_start_date DATE,
    titulo_eleitor VARCHAR(20),
    titulo_eleitor_zone VARCHAR(10),
    titulo_eleitor_section VARCHAR(10),
    ctps VARCHAR(20),
    ctps_series VARCHAR(10),
    ctps_uf VARCHAR(2),
    reservista VARCHAR(30),
    email VARCHAR(255), 
    phone VARCHAR(50), 
    address_zip VARCHAR(10),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    bank_name VARCHAR(100),
    bank_agency VARCHAR(20),
    bank_account VARCHAR(30),
    bank_account_type VARCHAR(20),
    dependents_count INTEGER,
    dependents_notes TEXT,
    vacation_due DATE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS hr_admissions ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    company_id UUID REFERENCES companies(id), 
    client_id UUID REFERENCES users(id), 
    status VARCHAR(30) DEFAULT 'Novo', 
    full_name VARCHAR(255) NOT NULL, 
    cpf VARCHAR(14) NOT NULL, 
    rg VARCHAR(20), 
    birth_date DATE, 
    birth_city VARCHAR(100),
    birth_state VARCHAR(2),
    nationality VARCHAR(80),
    mother_name VARCHAR(255),
    father_name VARCHAR(255),
    education_level VARCHAR(80),
    gender VARCHAR(20), 
    marital_status VARCHAR(20), 
    role VARCHAR(100), 
    contract_type VARCHAR(30),
    weekly_hours INTEGER,
    shift VARCHAR(50),
    salary DECIMAL(12, 2), 
    work_site_id UUID REFERENCES work_sites(id), 
    expected_start_date DATE, 
    pis VARCHAR(20), 
    titulo_eleitor VARCHAR(20), 
    titulo_eleitor_zone VARCHAR(10),
    titulo_eleitor_section VARCHAR(10),
    ctps VARCHAR(20), 
    ctps_series VARCHAR(10),
    ctps_uf VARCHAR(2),
    reservista VARCHAR(30),
    email VARCHAR(255),
    phone VARCHAR(50),
    address_zip VARCHAR(10),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    bank_name VARCHAR(100),
    bank_agency VARCHAR(20),
    bank_account VARCHAR(30),
    bank_account_type VARCHAR(20),
    dependents_count INTEGER,
    dependents_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS hr_requests ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    employee_id UUID REFERENCES employees(id), 
    company_id UUID REFERENCES companies(id), 
    client_id UUID REFERENCES users(id), 
    type VARCHAR(20) NOT NULL, 
    status VARCHAR(30) DEFAULT 'Solicitado', 
    details JSONB, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS hr_field_feedback ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    target_id UUID NOT NULL, 
    field_name VARCHAR(100) NOT NULL, 
    message TEXT NOT NULL, 
    resolved BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS time_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Em Edicao',
    approved_by UUID,
    approved_at TIMESTAMP,
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_sheet_id UUID REFERENCES time_sheets(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    schedule VARCHAR(50),
    work_hours VARCHAR(20),
    punches JSONB,
    situations JSONB,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS time_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
    author_id UUID,
    author_role VARCHAR(20),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payrolls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id),
    competence VARCHAR(7) NOT NULL,
    status VARCHAR(20) DEFAULT 'Disponivel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    entity_type VARCHAR(50), 
    entity_id UUID NOT NULL, 
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

CREATE TABLE IF NOT EXISTS notifications ( 
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
    user_id UUID REFERENCES users(id), 
    title VARCHAR(255) NOT NULL, 
    message TEXT, 
    is_read BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const upload = multer({ dest: 'certs/' });
const hrUpload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOADS_DIR),
        filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
    })
});
let dbPool = null;

const ensureSchema = async () => {
    if (!dbPool) return;
    const statements = [
        `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS obligations (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, nickname VARCHAR(100), department VARCHAR(50), responsible VARCHAR(100), expected_minutes INTEGER, monthly_due JSONB, reminder_days INTEGER, reminder_type VARCHAR(30), non_business_rule VARCHAR(60), saturday_business BOOLEAN DEFAULT FALSE, competence_rule VARCHAR(30), requires_robot BOOLEAN DEFAULT FALSE, has_fine BOOLEAN DEFAULT FALSE, alert_guide BOOLEAN DEFAULT TRUE, active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS monthly_routines (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), company_id UUID REFERENCES companies(id), obligation_id UUID REFERENCES obligations(id), obligation_name VARCHAR(255), department VARCHAR(50), competence VARCHAR(7), deadline DATE, status VARCHAR(20) DEFAULT 'Pendente', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE (company_id, obligation_id, competence));`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS nickname VARCHAR(255);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_regime VARCHAR(80);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_group VARCHAR(80);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS honorarium VARCHAR(50);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_code VARCHAR(50);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_district VARCHAR(100);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS state_registration VARCHAR(80);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS state_registration_date DATE;`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS state_registration_uf VARCHAR(2);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS state_exempt BOOLEAN DEFAULT FALSE;`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS nire VARCHAR(50);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS other_identifiers VARCHAR(255);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS phones VARCHAR(255);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS website VARCHAR(255);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS municipal_registration VARCHAR(80);`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS municipal_registration_date DATE;`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT;`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS tags TEXT;`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS contacts JSONB;`,
        `ALTER TABLE companies ADD COLUMN IF NOT EXISTS obligations JSONB;`,
        `CREATE TABLE IF NOT EXISTS time_sheets (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), employee_id UUID REFERENCES employees(id), company_id UUID REFERENCES companies(id), period_start DATE NOT NULL, period_end DATE NOT NULL, status VARCHAR(20) DEFAULT 'Em Edicao', approved_by UUID, approved_at TIMESTAMP, signed_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS time_entries (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), time_sheet_id UUID REFERENCES time_sheets(id) ON DELETE CASCADE, entry_date DATE NOT NULL, schedule VARCHAR(50), work_hours VARCHAR(20), punches JSONB, situations JSONB, notes TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS time_comments (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE, author_id UUID, author_role VARCHAR(20), message TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
        `CREATE TABLE IF NOT EXISTS payrolls (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), employee_id UUID REFERENCES employees(id), company_id UUID REFERENCES companies(id), competence VARCHAR(7) NOT NULL, status VARCHAR(20) DEFAULT 'Disponivel', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`,
        `ALTER TABLE request_attachments ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);`,
        `ALTER TABLE request_attachments ADD COLUMN IF NOT EXISTS entity_id UUID;`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_city VARCHAR(100);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_state VARCHAR(2);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(80);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS education_level VARCHAR(80);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(20);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS contract_type VARCHAR(30);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS weekly_hours INTEGER;`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift VARCHAR(50);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS expected_start_date DATE;`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor VARCHAR(20);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_zone VARCHAR(10);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS titulo_eleitor_section VARCHAR(10);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps VARCHAR(20);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_series VARCHAR(10);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS ctps_uf VARCHAR(2);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS reservista VARCHAR(30);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_district VARCHAR(100);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account VARCHAR(30);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(20);`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS dependents_count INTEGER;`,
        `ALTER TABLE employees ADD COLUMN IF NOT EXISTS dependents_notes TEXT;`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS birth_city VARCHAR(100);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS birth_state VARCHAR(2);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS nationality VARCHAR(80);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS education_level VARCHAR(80);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS contract_type VARCHAR(30);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS weekly_hours INTEGER;`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS shift VARCHAR(50);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS titulo_eleitor_zone VARCHAR(10);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS titulo_eleitor_section VARCHAR(10);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS ctps_series VARCHAR(10);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS ctps_uf VARCHAR(2);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS reservista VARCHAR(30);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_zip VARCHAR(10);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_district VARCHAR(100);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_agency VARCHAR(20);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_account VARCHAR(30);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS bank_account_type VARCHAR(20);`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS dependents_count INTEGER;`,
        `ALTER TABLE hr_admissions ADD COLUMN IF NOT EXISTS dependents_notes TEXT;`
    ];
    for (const stmt of statements) {
        try {

            await dbPool.query(stmt);
        } catch (e) {
            console.warn(`Schema Ensure Warning: ${e.message}`);
        }
    }
};

const getCompetenceKey = (date = new Date()) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}`;
};

const parseDueDay = (value) => {
    if (!value) return null;
    const match = String(value).match(/\d+/);
    if (!match) return null;
    const day = Number(match[0]);
    if (Number.isNaN(day) || day < 1 || day > 31) return null;
    return day;
};

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));

const notifyUsers = async (userIds, title, message) => {
    if (!dbPool || !Array.isArray(userIds) || userIds.length === 0) return;
    const createdAt = new Date().toISOString();
    for (const userId of userIds) {
        await dbPool.query(
            'INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, false, $4)',
            [userId, title, message, createdAt]
        );
    }
};

const ensureMonthlyRoutines = async (companyId, obligationIds) => {
    if (!dbPool || !companyId || !Array.isArray(obligationIds) || obligationIds.length === 0) return;
    const now = new Date();
    const competence = getCompetenceKey(now);
    const monthKey = String(now.getMonth() + 1);
    const year = now.getFullYear();
    const month = now.getMonth();
    const idValues = obligationIds.filter((item) => isUuid(item));
    const nameValues = obligationIds.filter((item) => !isUuid(item));

    let obligationsRes;
    if (idValues.length > 0 && nameValues.length > 0) {
        obligationsRes = await dbPool.query(
            `SELECT id, name, department, monthly_due
             FROM obligations
             WHERE id = ANY($1::uuid[]) OR name = ANY($2::text[])`,
            [idValues, nameValues]
        );
    } else if (idValues.length > 0) {
        obligationsRes = await dbPool.query(
            'SELECT id, name, department, monthly_due FROM obligations WHERE id = ANY($1::uuid[])',
            [idValues]
        );
    } else {
        obligationsRes = await dbPool.query(
            'SELECT id, name, department, monthly_due FROM obligations WHERE name = ANY($1::text[])',
            [nameValues]
        );
    }

    for (const obligation of obligationsRes.rows) {
        const monthlyDue = obligation.monthly_due || {};
        const dueValue = monthlyDue[monthKey];
        if (!dueValue || String(dueValue).toLowerCase().includes('nao')) continue;
        const day = parseDueDay(dueValue);
        if (!day) continue;
        const deadline = new Date(year, month, day);
        const insertRes = await dbPool.query(
            `INSERT INTO monthly_routines (id, company_id, obligation_id, obligation_name, department, competence, deadline, status)
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, 'Pendente')
             ON CONFLICT (company_id, obligation_id, competence) DO NOTHING
             RETURNING id`,
            [companyId, obligation.id, obligation.name, obligation.department || null, competence, deadline]
        );
        if (insertRes.rowCount > 0) {
            const adminRes = await dbPool.query(`SELECT id FROM users WHERE role = 'admin'`);
            const adminIds = adminRes.rows.map((row) => row.id);
            await notifyUsers(
                adminIds,
                'Nova obrigacao mensal',
                `Obrigacao ${obligation.name} gerada para a competencia ${competence}.`
            );
        }
    }
};

const initDbConnection = (config) => {
    try {

        dbPool = new Pool({
            user: config.user, host: config.host, database: config.dbName, password: config.pass, port: config.port
        });
        dbPool.query('SELECT NOW()')
            .then(() => {
                console.log(`Conectado ao banco: ${config.dbName}`);
                return ensureSchema();
            })
            .catch((err) => {
                console.error('ERRO DB:', err.message);
            });
    } catch (e) { console.error('Pool Error:', e); }
};

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const buildVacationDue = (startDate) => {
    if (!startDate) return null;
    const base = new Date(startDate);
    if (Number.isNaN(base.getTime())) return null;
    const next = new Date(base);
    next.setFullYear(base.getFullYear() + 1);
    return next.toISOString().slice(0, 10);
};

const upsertEmployeeFromAdmission = async (adm, existingStatus) => {
    const cpfDigits = normalizeDigits(adm.cpf);
    const fallbackStatus = existingStatus || 'Ativo';
    const admissionDate = adm.expectedStartDate || new Date().toISOString().slice(0, 10);
    const vacationDue = buildVacationDue(admissionDate);
    const employeeId = adm.employeeId || adm.id;

    const query = `
        INSERT INTO employees (
            id, company_id, work_site_id, name, role, admission_date, status, salary, cpf, rg, pis,
            birth_date, birth_city, birth_state, nationality, mother_name, father_name, education_level, gender, marital_status,
            contract_type, weekly_hours, shift, expected_start_date,
            titulo_eleitor, titulo_eleitor_zone, titulo_eleitor_section, ctps, ctps_series, ctps_uf, reservista,
            email, phone,
            address_zip, address_street, address_number, address_complement, address_district, address_city, address_state, address,
            emergency_contact_name, emergency_contact_phone,
            bank_name, bank_agency, bank_account, bank_account_type,
            dependents_count, dependents_notes,
            vacation_due
        )
        VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
            $12,$13,$14,$15,$16,$17,$18,$19,$20,
            $21,$22,$23,$24,
            $25,$26,$27,$28,$29,$30,$31,
            $32,$33,
            $34,$35,$36,$37,$38,$39,$40,$41,
            $42,$43,
            $44,$45,$46,$47,
            $48,$49,
            $50
        )
        ON CONFLICT (id) DO UPDATE SET
            work_site_id = EXCLUDED.work_site_id,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            admission_date = EXCLUDED.admission_date,
            status = EXCLUDED.status,
            salary = EXCLUDED.salary,
            cpf = EXCLUDED.cpf,
            rg = EXCLUDED.rg,
            pis = EXCLUDED.pis,
            birth_date = EXCLUDED.birth_date,
            birth_city = EXCLUDED.birth_city,
            birth_state = EXCLUDED.birth_state,
            nationality = EXCLUDED.nationality,
            mother_name = EXCLUDED.mother_name,
            father_name = EXCLUDED.father_name,
            education_level = EXCLUDED.education_level,
            gender = EXCLUDED.gender,
            marital_status = EXCLUDED.marital_status,
            contract_type = EXCLUDED.contract_type,
            weekly_hours = EXCLUDED.weekly_hours,
            shift = EXCLUDED.shift,
            expected_start_date = EXCLUDED.expected_start_date,
            titulo_eleitor = EXCLUDED.titulo_eleitor,
            titulo_eleitor_zone = EXCLUDED.titulo_eleitor_zone,
            titulo_eleitor_section = EXCLUDED.titulo_eleitor_section,
            ctps = EXCLUDED.ctps,
            ctps_series = EXCLUDED.ctps_series,
            ctps_uf = EXCLUDED.ctps_uf,
            reservista = EXCLUDED.reservista,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            address_zip = EXCLUDED.address_zip,
            address_street = EXCLUDED.address_street,
            address_number = EXCLUDED.address_number,
            address_complement = EXCLUDED.address_complement,
            address_district = EXCLUDED.address_district,
            address_city = EXCLUDED.address_city,
            address_state = EXCLUDED.address_state,
            address = EXCLUDED.address,
            emergency_contact_name = EXCLUDED.emergency_contact_name,
            emergency_contact_phone = EXCLUDED.emergency_contact_phone,
            bank_name = EXCLUDED.bank_name,
            bank_agency = EXCLUDED.bank_agency,
            bank_account = EXCLUDED.bank_account,
            bank_account_type = EXCLUDED.bank_account_type,
            dependents_count = EXCLUDED.dependents_count,
            dependents_notes = EXCLUDED.dependents_notes,
            vacation_due = EXCLUDED.vacation_due,
            updated_at = CURRENT_TIMESTAMP
    `;

    await dbPool.query(query, [
        employeeId,
        adm.companyId,
        adm.workSiteId,
        adm.fullName,
        adm.role || 'Funcionario',
        admissionDate,
        fallbackStatus,
        adm.salary || 0,
        cpfDigits || adm.cpf,
        adm.rg || null,
        adm.pis || null,
        adm.birthDate || null,
        adm.birthCity || null,
        adm.birthState || null,
        adm.nationality || null,
        adm.motherName || null,
        adm.fatherName || null,
        adm.educationLevel || null,
        adm.gender || null,
        adm.maritalStatus || null,
        adm.contractType || null,
        adm.weeklyHours || null,
        adm.shift || null,
        adm.expectedStartDate || null,
        adm.tituloEleitor || null,
        adm.tituloEleitorZone || null,
        adm.tituloEleitorSection || null,
        adm.ctps || null,
        adm.ctpsSeries || null,
        adm.ctpsUf || null,
        adm.reservista || null,
        adm.email || null,
        adm.phone || null,
        adm.addressZip || null,
        adm.addressStreet || null,
        adm.addressNumber || null,
        adm.addressComplement || null,
        adm.addressDistrict || null,
        adm.addressCity || null,
        adm.addressState || null,
        adm.address || null,
        adm.emergencyContactName || null,
        adm.emergencyContactPhone || null,
        adm.bankName || null,
        adm.bankAgency || null,
        adm.bankAccount || null,
        adm.bankAccountType || null,
        adm.dependentsCount || null,
        adm.dependentsNotes || null,
        vacationDue
    ]);
};

if (fs.existsSync(DB_CONFIG_FILE)) {
    try {
 initDbConnection(JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'))); } catch (e) {}
}

app.post('/api/setup-db', async (req, res) => {
    const config = req.body;
    let logs = [];
    const log = (m) => { console.log(m); logs.push(m); };
    try {

        const rootClient = new Client({ user: config.user, host: config.host, database: 'postgres', password: config.pass, port: config.port });
        await rootClient.connect();
        const check = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = '${config.dbName}'`);
        if (check.rowCount === 0) { await rootClient.query(`CREATE DATABASE "${config.dbName}"`); log(`Banco ${config.dbName} criado.`); }
        await rootClient.end();
        const dbClient = new Client({ user: config.user, host: config.host, database: config.dbName, password: config.pass, port: config.port });
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
            await dbClient.query(`INSERT INTO request_types (name, base_price) VALUES ('2ª Via de Boleto', 0), ('Alteração Contratual', 150.00), ('Certidão Negativa', 50.00)`);
            await dbClient.query(`INSERT INTO document_categories (name) VALUES ('Boletos'), ('Impostos'), ('Folha de Pagamento'), ('Contratos'), ('Documentos Solicitados')`);
            log('Dados iniciais inseridos.');
        }
        await dbClient.end();
        fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(config, null, 2));
        initDbConnection(config);
        res.json({ success: true, logs });
    } catch (e) { res.status(500).json({ success: false, message: e.message, logs }); }
});

app.get('/api/status', (req, res) => res.json({ configured: !!dbPool }));

app.get('/api/app-settings', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    try {
        const result = await dbPool.query('SELECT key, value FROM app_settings');
        const settings = {};
        result.rows.forEach((row) => {
            settings[row.key] = row.value;
        });
        return res.json({ apiBaseUrl: settings.api_base_url || '' });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.post('/api/app-settings', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const apiBaseUrl = typeof req.body?.apiBaseUrl === 'string' ? req.body.apiBaseUrl : '';
    try {
        await dbPool.query(
            'INSERT INTO app_settings(key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()',
            ['api_base_url', apiBaseUrl]
        );
        return res.json({ success: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

app.get('/api/db-config', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    try {
        if (fs.existsSync(DB_CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(DB_CONFIG_FILE, 'utf8'));
            return res.json({ host: config.host, port: String(config.port || ''), dbName: config.dbName, ssl: !!config.ssl });
        }
        return res.json({});
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
});

async function safeQuery(query, params = []) {
    if (!dbPool) return { rows: [] };
    try {

        return await dbPool.query(query, params);
    } catch (e) {
        console.warn(`SafeQuery Warning: ${e.message}`);
        return { rows: [] };
    }
}

app.get('/api/sync', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    try {

        const companies = await safeQuery(`SELECT id,
            COALESCE(NULLIF(name, ''), legal_name, trade_name) as name,
            cnpj,
            address,
            COALESCE(NULLIF(contact_info, ''), phones) as contact,
            legal_name as "legalName",
            trade_name as "tradeName",
            nickname,
            active,
            tax_regime as "taxRegime",
            company_group as "companyGroup",
            honorarium,
            company_code as "companyCode",
            address_street as "addressStreet",
            address_number as "addressNumber",
            address_complement as "addressComplement",
            address_zip as "addressZip",
            address_district as "addressDistrict",
            address_city as "addressCity",
            address_state as "addressState",
            state_registration as "stateRegistration",
            state_registration_date as "stateRegistrationDate",
            state_registration_uf as "stateRegistrationUf",
            state_exempt as "stateExempt",
            nire,
            other_identifiers as "otherIdentifiers",
            phones,
            website,
            municipal_registration as "municipalRegistration",
            municipal_registration_date as "municipalRegistrationDate",
            notes,
            tags,
            contacts,
            obligations
            FROM companies`);
        const users = await safeQuery('SELECT id, full_name as name, email, password_hash as password, role, company_id as "companyId", cpf, photo_url as "photoUrl" FROM users');
        const reqTypes = await safeQuery('SELECT id, name, base_price as price FROM request_types');
        const docCats = await safeQuery('SELECT name FROM document_categories WHERE active = true');
        const requests = await safeQuery('SELECT sr.*, rt.name as type FROM service_requests sr LEFT JOIN request_types rt ON sr.request_type_id = rt.id');
        const attachments = await safeQuery('SELECT id, entity_type as "entityType", entity_id as "entityId", file_name as name, file_url as url, uploaded_by as "uploadedBy", created_at as "createdAt" FROM request_attachments');
        const documents = await safeQuery(`SELECT id,
            title,
            category,
            reference_date as date,
            file_url as url,
            status,
            payment_status as "paymentStatus",
            amount,
            competence,
            company_id as "companyId",
            request_id as "requestId",
            created_at as "createdAt"
            FROM documents`);
        const chat = await safeQuery('SELECT entity_id as "entityId", sender_name as sender, role, message as text, created_at as timestamp FROM chat_messages');
        const notifs = await safeQuery('SELECT id, user_id as "userId", title, message, is_read as read, created_at as timestamp FROM notifications');
        const obligations = await safeQuery(`SELECT id,
            name,
            nickname,
            department,
            responsible,
            expected_minutes as "expectedMinutes",
            monthly_due as "monthlyDue",
            reminder_days as "reminderDays",
            reminder_type as "reminderType",
            non_business_rule as "nonBusinessRule",
            saturday_business as "saturdayBusiness",
            competence_rule as "competenceRule",
            requires_robot as "requiresRobot",
            has_fine as "hasFine",
            alert_guide as "alertGuide",
            active
            FROM obligations
            ORDER BY name`);
        const routines = await safeQuery(`SELECT mr.id,
            mr.company_id as "companyId",
            c.name as "companyName",
            mr.obligation_id as "obligationId",
            mr.obligation_name as "obligationName",
            mr.department,
            mr.competence,
            mr.deadline,
            mr.status,
            mr.created_at as "createdAt",
            mr.updated_at as "updatedAt"
            FROM monthly_routines mr
            LEFT JOIN companies c ON c.id = mr.company_id`);
        
        const workSites = await safeQuery('SELECT id, company_id as "companyId", name, description FROM work_sites');
        const employees = await safeQuery(`SELECT id,
            company_id as "companyId",
            work_site_id as "workSiteId",
            name,
            role,
            admission_date as "admissionDate",
            status,
            salary,
            cpf,
            rg,
            pis,
            birth_date as "birthDate",
            birth_city as "birthCity",
            birth_state as "birthState",
            nationality,
            mother_name as "motherName",
            father_name as "fatherName",
            education_level as "educationLevel",
            gender,
            marital_status as "maritalStatus",
            contract_type as "contractType",
            weekly_hours as "weeklyHours",
            shift,
            expected_start_date as "expectedStartDate",
            titulo_eleitor as "tituloEleitor",
            titulo_eleitor_zone as "tituloEleitorZone",
            titulo_eleitor_section as "tituloEleitorSection",
            ctps,
            ctps_series as "ctpsSeries",
            ctps_uf as "ctpsUf",
            reservista,
            email,
            phone,
            address_zip as "addressZip",
            address_street as "addressStreet",
            address_number as "addressNumber",
            address_complement as "addressComplement",
            address_district as "addressDistrict",
            address_city as "addressCity",
            address_state as "addressState",
            address,
            emergency_contact_name as "emergencyContactName",
            emergency_contact_phone as "emergencyContactPhone",
            bank_name as "bankName",
            bank_agency as "bankAgency",
            bank_account as "bankAccount",
            bank_account_type as "bankAccountType",
            dependents_count as "dependentsCount",
            dependents_notes as "dependentsNotes",
            vacation_due as "vacationDue"
            FROM employees`);
        const timeSheets = await safeQuery('SELECT id, employee_id as "employeeId", company_id as "companyId", period_start as "periodStart", period_end as "periodEnd", status, approved_by as "approvedBy", approved_at as "approvedAt", signed_at as "signedAt", created_at as "createdAt", updated_at as "updatedAt" FROM time_sheets');
        const timeEntries = await safeQuery('SELECT id, time_sheet_id as "timeSheetId", entry_date as "entryDate", schedule, work_hours as "workHours", punches, situations, notes, updated_at as "updatedAt" FROM time_entries');
        const timeComments = await safeQuery('SELECT id, time_entry_id as "timeEntryId", author_id as "authorId", author_role as "authorRole", message, created_at as "createdAt" FROM time_comments');
        const payrolls = await safeQuery('SELECT id, employee_id as "employeeId", company_id as "companyId", competence, status, created_at as "createdAt", updated_at as "updatedAt" FROM payrolls');
        const hrAdmissions = await safeQuery(`
            SELECT 
                id, company_id as "companyId", client_id as "clientId", status, 
                full_name as "fullName", cpf, rg, birth_date as "birthDate",
                birth_city as "birthCity", birth_state as "birthState", nationality,
                mother_name as "motherName", father_name as "fatherName", education_level as "educationLevel",
                gender, marital_status as "maritalStatus", role, contract_type as "contractType",
                weekly_hours as "weeklyHours", shift, salary, work_site_id as "workSiteId", 
                expected_start_date as "expectedStartDate", pis, titulo_eleitor as "tituloEleitor",
                titulo_eleitor_zone as "tituloEleitorZone", titulo_eleitor_section as "tituloEleitorSection",
                ctps, ctps_series as "ctpsSeries", ctps_uf as "ctpsUf", reservista,
                email, phone, address_zip as "addressZip", address_street as "addressStreet",
                address_number as "addressNumber", address_complement as "addressComplement",
                address_district as "addressDistrict", address_city as "addressCity", address_state as "addressState",
                address, emergency_contact_name as "emergencyContactName", emergency_contact_phone as "emergencyContactPhone",
                bank_name as "bankName", bank_agency as "bankAgency", bank_account as "bankAccount",
                bank_account_type as "bankAccountType", dependents_count as "dependentsCount",
                dependents_notes as "dependentsNotes", created_at as "createdAt", updated_at as "updatedAt" 
            FROM hr_admissions
        `);
        const hrRequests = await safeQuery('SELECT id, employee_id as "employeeId", company_id as "companyId", client_id as "clientId", type, status, details, created_at as "createdAt", updated_at as "updatedAt" FROM hr_requests');
        const fieldFeedback = await safeQuery('SELECT id, target_id as "targetId", field_name as "fieldName", message, resolved FROM hr_field_feedback');

        res.json({
            companies: companies.rows,
            users: users.rows,
            requestTypes: reqTypes.rows,
            categories: docCats.rows.map(r => r.name),
            requests: requests.rows,
            attachments: attachments.rows,
            documents: documents.rows,
            chat: chat.rows,
            notifications: notifs.rows,
            obligations: obligations.rows,
            routines: routines.rows,
            workSites: workSites.rows,
            employees: employees.rows,
            timeSheets: timeSheets.rows,
            timeEntries: timeEntries.rows,
            timeComments: timeComments.rows,
            payrolls: payrolls.rows,
            hrAdmissions: hrAdmissions.rows,
            hrRequests: hrRequests.rows,
            fieldFeedback: fieldFeedback.rows
        });
    } catch (e) { 
        console.error("Sync Error:", e);
        res.status(500).json({ error: e.message }); 
    }
});

app.post('/api/notifications/read', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing notification id' });
    try {
        await dbPool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/notifications', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { notifications } = req.body;
    if (!Array.isArray(notifications) || notifications.length === 0) {
        return res.status(400).json({ error: 'Missing notifications payload' });
    }
    try {
        for (const n of notifications) {
            if (!n.id || !n.userId || !n.title) continue;
            await dbPool.query(
                'INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES ($1, $2, $3, $4, false, $5) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, message = EXCLUDED.message',
                [n.id, n.userId, n.title, n.message || '', n.timestamp || new Date().toISOString()]
            );
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/notifications/:id', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    const { title, message } = req.body;
    try {
        await dbPool.query('UPDATE notifications SET title = $1, message = $2 WHERE id = $3', [title || '', message || '', id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/notifications/:id', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        await dbPool.query('DELETE FROM notifications WHERE id = $1', [id]);
        await dbPool.query('DELETE FROM request_attachments WHERE entity_type = $1 AND entity_id = $2', ['notification', id]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/company', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const {
        id, name, cnpj, address, contact,
        legalName, tradeName, nickname, active, taxRegime, companyGroup, honorarium, companyCode,
        addressStreet, addressNumber, addressComplement, addressZip, addressDistrict, addressCity, addressState,
        stateRegistration, stateRegistrationDate, stateRegistrationUf, stateExempt,
        nire, otherIdentifiers, phones, website, municipalRegistration, municipalRegistrationDate,
        notes, tags, contacts, obligations
    } = req.body;
    const safeId = isUuid(id) ? id : null;
    const safeName = name || legalName || tradeName || '';
    const safeContact = contact || phones || '';
    try {
        const query = `
            INSERT INTO companies (
                id, name, cnpj, address, contact_info,
                legal_name, trade_name, nickname, active, tax_regime, company_group, honorarium, company_code,
                address_street, address_number, address_complement, address_zip, address_district, address_city, address_state,
                state_registration, state_registration_date, state_registration_uf, state_exempt,
                nire, other_identifiers, phones, website, municipal_registration, municipal_registration_date,
                notes, tags, contacts, obligations
            )
            VALUES (
                COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5,
                $6, $7, $8, $9, $10, $11, $12, $13,
                $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24,
                $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                cnpj = EXCLUDED.cnpj,
                address = EXCLUDED.address,
                contact_info = EXCLUDED.contact_info,
                legal_name = EXCLUDED.legal_name,
                trade_name = EXCLUDED.trade_name,
                nickname = EXCLUDED.nickname,
                active = EXCLUDED.active,
                tax_regime = EXCLUDED.tax_regime,
                company_group = EXCLUDED.company_group,
                honorarium = EXCLUDED.honorarium,
                company_code = EXCLUDED.company_code,
                address_street = EXCLUDED.address_street,
                address_number = EXCLUDED.address_number,
                address_complement = EXCLUDED.address_complement,
                address_zip = EXCLUDED.address_zip,
                address_district = EXCLUDED.address_district,
                address_city = EXCLUDED.address_city,
                address_state = EXCLUDED.address_state,
                state_registration = EXCLUDED.state_registration,
                state_registration_date = EXCLUDED.state_registration_date,
                state_registration_uf = EXCLUDED.state_registration_uf,
                state_exempt = EXCLUDED.state_exempt,
                nire = EXCLUDED.nire,
                other_identifiers = EXCLUDED.other_identifiers,
                phones = EXCLUDED.phones,
                website = EXCLUDED.website,
                municipal_registration = EXCLUDED.municipal_registration,
                municipal_registration_date = EXCLUDED.municipal_registration_date,
                notes = EXCLUDED.notes,
                tags = EXCLUDED.tags,
                contacts = EXCLUDED.contacts,
                obligations = EXCLUDED.obligations,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;
        const result = await dbPool.query(query, [
            safeId,
            safeName,
            cnpj || '',
            address || '',
            safeContact,
            legalName || null,
            tradeName || null,
            nickname || null,
            active !== undefined ? !!active : true,
            taxRegime || null,
            companyGroup || null,
            honorarium || null,
            companyCode || null,
            addressStreet || null,
            addressNumber || null,
            addressComplement || null,
            addressZip || null,
            addressDistrict || null,
            addressCity || null,
            addressState || null,
            stateRegistration || null,
            stateRegistrationDate || null,
            stateRegistrationUf || null,
            stateExempt !== undefined ? !!stateExempt : false,
            nire || null,
            otherIdentifiers || null,
            phones || null,
            website || null,
            municipalRegistration || null,
            municipalRegistrationDate || null,
            notes || null,
            tags || null,
            contacts ? JSON.stringify(contacts) : null,
            obligations ? JSON.stringify(obligations) : null
        ]);
        await ensureMonthlyRoutines(result.rows[0]?.id, obligations || []);
        res.json({ success: true, id: result.rows[0]?.id });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/company/:id', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        await dbPool.query('DELETE FROM companies WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/obligations', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const {
        id, name, nickname, department, responsible, expectedMinutes,
        monthlyDue, reminderDays, reminderType, nonBusinessRule, saturdayBusiness,
        competenceRule, requiresRobot, hasFine, alertGuide, active
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing obligation name' });
        const safeId = isUuid(id) ? id : null;
try {
        const query = `
            INSERT INTO obligations (
                id, name, nickname, department, responsible, expected_minutes,
                monthly_due, reminder_days, reminder_type, non_business_rule, saturday_business,
                competence_rule, requires_robot, has_fine, alert_guide, active
            )
            VALUES (
                COALESCE($1, uuid_generate_v4()), $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16
            )
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                nickname = EXCLUDED.nickname,
                department = EXCLUDED.department,
                responsible = EXCLUDED.responsible,
                expected_minutes = EXCLUDED.expected_minutes,
                monthly_due = EXCLUDED.monthly_due,
                reminder_days = EXCLUDED.reminder_days,
                reminder_type = EXCLUDED.reminder_type,
                non_business_rule = EXCLUDED.non_business_rule,
                saturday_business = EXCLUDED.saturday_business,
                competence_rule = EXCLUDED.competence_rule,
                requires_robot = EXCLUDED.requires_robot,
                has_fine = EXCLUDED.has_fine,
                alert_guide = EXCLUDED.alert_guide,
                active = EXCLUDED.active,
                updated_at = CURRENT_TIMESTAMP
        `;
        await dbPool.query(query, [
            safeId,
            name,
            nickname || null,
            department || null,
            responsible || null,
            expectedMinutes || null,
            monthlyDue ? JSON.stringify(monthlyDue) : null,
            reminderDays || null,
            reminderType || null,
            nonBusinessRule || null,
            saturdayBusiness === true,
            competenceRule || null,
            requiresRobot === true,
            hasFine === true,
            alertGuide !== false,
            active !== false
        ]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/obligations/:id', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        await dbPool.query('DELETE FROM obligations WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/monthly-routines', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'Missing routine data' });
    try {
        await dbPool.query(
            `UPDATE monthly_routines SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [status, id]
        );
        const routineRes = await dbPool.query(
            `SELECT mr.company_id as "companyId", mr.obligation_name as "obligationName", mr.competence, c.name as "companyName"
             FROM monthly_routines mr
             LEFT JOIN companies c ON c.id = mr.company_id
             WHERE mr.id = $1`,
            [id]
        );
        if (routineRes.rows.length > 0) {
            const routine = routineRes.rows[0];
            const clientRes = await dbPool.query(
                `SELECT id FROM users WHERE role = 'client' AND company_id = $1`,
                [routine.companyId]
            );
            const adminRes = await dbPool.query(`SELECT id FROM users WHERE role = 'admin'`);
            const clientIds = clientRes.rows.map((row) => row.id);
            const adminIds = adminRes.rows.map((row) => row.id);
            const message = `Obrigacao ${routine.obligationName} (${routine.companyName || 'Empresa'}) - ${routine.competence}: ${status}.`;
            await notifyUsers([...clientIds, ...adminIds], 'Status de obrigacao atualizado', message);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/monthly-routines/attachment', hrUpload.single('file'), async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { routineId, companyId, category, title, referenceDate } = req.body;
    if (!routineId || !category) return res.status(400).json({ error: 'Missing routine or category' });
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado.' });
    try {
        const routineRes = await dbPool.query(
            'SELECT obligation_name as "obligationName", competence, company_id as "companyId" FROM monthly_routines WHERE id = $1',
            [routineId]
        );
        const routine = routineRes.rows[0] || {};
        const effectiveCompanyId = companyId || routine.companyId;
        const fileUrl = `/uploads/${req.file.filename}`;
        const fileName = req.file.originalname;
        const docTitle = title || `${routine.obligationName || 'Obrigacao'} - ${routine.competence || ''}`.trim();
        const docDate = referenceDate || new Date().toISOString().split('T')[0];

        const docQuery = `
            INSERT INTO documents (
                id, title, category, reference_date, file_url, status, payment_status, amount, competence, company_id, request_id
            )
            VALUES (
                uuid_generate_v4(), $1, $2, $3, $4, 'Enviado', 'N/A', NULL, $5, $6, NULL
            )
        `;
        await dbPool.query(docQuery, [
            docTitle,
            category,
            docDate,
            fileUrl,
            routine.competence || null,
            effectiveCompanyId
        ]);

        const attachQuery = `
            INSERT INTO request_attachments (id, entity_type, entity_id, file_name, file_url, uploaded_by)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
            RETURNING id
        `;
        const attachResult = await dbPool.query(attachQuery, [
            'monthly_routine',
            routineId,
            fileName,
            fileUrl,
            null
        ]);

        res.json({
            success: true,
            attachment: {
                id: attachResult.rows[0]?.id,
                entityType: 'monthly_routine',
                entityId: routineId,
                name: fileName,
                url: fileUrl
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/admission', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { 
        id, companyId, clientId, status, fullName, cpf, rg, birthDate, birthCity, birthState, nationality,
        motherName, fatherName, educationLevel, gender, maritalStatus, role, contractType, weeklyHours, shift,
        salary, workSiteId, expectedStartDate, pis, tituloEleitor, tituloEleitorZone, tituloEleitorSection,
        ctps, ctpsSeries, ctpsUf, reservista, email, phone, addressZip, addressStreet, addressNumber,
        addressComplement, addressDistrict, addressCity, addressState, address, emergencyContactName,
        emergencyContactPhone, bankName, bankAgency, bankAccount, bankAccountType, dependentsCount, dependentsNotes
    } = req.body;
    const now = new Date().toISOString();

    try {
        const existing = await dbPool.query('SELECT id FROM hr_admissions WHERE id = $1', [id]);
        const isNew = existing.rows.length === 0;

        const query = `
            INSERT INTO hr_admissions (
                id, company_id, client_id, status, full_name, cpf, rg, birth_date, birth_city, birth_state,
                nationality, mother_name, father_name, education_level, gender, marital_status, role, contract_type,
                weekly_hours, shift, salary, work_site_id, expected_start_date, pis, titulo_eleitor,
                titulo_eleitor_zone, titulo_eleitor_section, ctps, ctps_series, ctps_uf, reservista, email, phone,
                address_zip, address_street, address_number, address_complement, address_district, address_city,
                address_state, address, emergency_contact_name, emergency_contact_phone, bank_name, bank_agency,
                bank_account, bank_account_type, dependents_count, dependents_notes
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29, $30, $31, $32, $33,
                $34, $35, $36, $37, $38, $39,
                $40, $41, $42, $43, $44, $45,
                $46, $47, $48, $49
            )
            ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            full_name = EXCLUDED.full_name,
            cpf = EXCLUDED.cpf,
            rg = EXCLUDED.rg,
            birth_date = EXCLUDED.birth_date,
            birth_city = EXCLUDED.birth_city,
            birth_state = EXCLUDED.birth_state,
            nationality = EXCLUDED.nationality,
            mother_name = EXCLUDED.mother_name,
            father_name = EXCLUDED.father_name,
            education_level = EXCLUDED.education_level,
            gender = EXCLUDED.gender,
            marital_status = EXCLUDED.marital_status,
            role = EXCLUDED.role,
            contract_type = EXCLUDED.contract_type,
            weekly_hours = EXCLUDED.weekly_hours,
            shift = EXCLUDED.shift,
            salary = EXCLUDED.salary,
            work_site_id = EXCLUDED.work_site_id,
            expected_start_date = EXCLUDED.expected_start_date,
            pis = EXCLUDED.pis,
            titulo_eleitor = EXCLUDED.titulo_eleitor,
            titulo_eleitor_zone = EXCLUDED.titulo_eleitor_zone,
            titulo_eleitor_section = EXCLUDED.titulo_eleitor_section,
            ctps = EXCLUDED.ctps,
            ctps_series = EXCLUDED.ctps_series,
            ctps_uf = EXCLUDED.ctps_uf,
            reservista = EXCLUDED.reservista,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            address_zip = EXCLUDED.address_zip,
            address_street = EXCLUDED.address_street,
            address_number = EXCLUDED.address_number,
            address_complement = EXCLUDED.address_complement,
            address_district = EXCLUDED.address_district,
            address_city = EXCLUDED.address_city,
            address_state = EXCLUDED.address_state,
            address = EXCLUDED.address,
            emergency_contact_name = EXCLUDED.emergency_contact_name,
            emergency_contact_phone = EXCLUDED.emergency_contact_phone,
            bank_name = EXCLUDED.bank_name,
            bank_agency = EXCLUDED.bank_agency,
            bank_account = EXCLUDED.bank_account,
            bank_account_type = EXCLUDED.bank_account_type,
            dependents_count = EXCLUDED.dependents_count,
            dependents_notes = EXCLUDED.dependents_notes,
            updated_at = CURRENT_TIMESTAMP
        `;
        await dbPool.query(query, [
            id, companyId, clientId, status, fullName, cpf, rg, birthDate, birthCity, birthState,
            nationality, motherName, fatherName, educationLevel, gender, maritalStatus, role, contractType,
            weeklyHours, shift, salary, workSiteId, expectedStartDate, pis, tituloEleitor,
            tituloEleitorZone, tituloEleitorSection, ctps, ctpsSeries, ctpsUf, reservista, email, phone,
            addressZip, addressStreet, addressNumber, addressComplement, addressDistrict, addressCity, addressState,
            address, emergencyContactName, emergencyContactPhone, bankName, bankAgency, bankAccount, bankAccountType,
            dependentsCount, dependentsNotes
        ]);

        if (status === 'Validado' || status === 'Finalizado') {
            const cpfDigits = normalizeDigits(cpf);
            const employeeLookup = await dbPool.query(
                `SELECT id, status FROM employees WHERE regexp_replace(cpf, '\\D', '', 'g') = $1 LIMIT 1`,
                [cpfDigits]
            );
            const existingEmployee = employeeLookup.rows[0];
            await upsertEmployeeFromAdmission({ 
                id,
                employeeId: existingEmployee?.id,
                companyId,
                workSiteId,
                fullName,
                role,
                expectedStartDate,
                salary,
                cpf,
                rg,
                pis,
                birthDate,
                birthCity,
                birthState,
                nationality,
                motherName,
                fatherName,
                educationLevel,
                gender,
                maritalStatus,
                contractType,
                weeklyHours,
                shift,
                tituloEleitor,
                tituloEleitorZone,
                tituloEleitorSection,
                ctps,
                ctpsSeries,
                ctpsUf,
                reservista,
                email,
                phone,
                addressZip,
                addressStreet,
                addressNumber,
                addressComplement,
                addressDistrict,
                addressCity,
                addressState,
                address,
                emergencyContactName,
                emergencyContactPhone,
                bankName,
                bankAgency,
                bankAccount,
                bankAccountType,
                dependentsCount,
                dependentsNotes
            }, existingEmployee?.status);
        }

        if (isNew) {
            const admins = await dbPool.query("SELECT id FROM users WHERE role = 'admin'");
            for (const admin of admins.rows) {
                await dbPool.query(
                    'INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES (uuid_generate_v4(), $1, $2, $3, false, $4)',
                    [admin.id, 'Nova admissao', `Nova solicitacao de admissao para ${fullName}.`, now]
                );
            }
        }

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/request', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, employeeId, companyId, clientId, type, status, details } = req.body;
    try {

        const query = `
            INSERT INTO hr_requests (id, employee_id, company_id, client_id, type, status, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, details = EXCLUDED.details, updated_at = CURRENT_TIMESTAMP
        `;
        await dbPool.query(query, [id, employeeId, companyId, clientId, type, status, details]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/feedback', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, targetId, fieldName, message, resolved } = req.body;
    try {

        const query = `
            INSERT INTO hr_field_feedback (id, target_id, field_name, message, resolved)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE SET resolved = EXCLUDED.resolved
        `;
        await dbPool.query(query, [id, targetId, fieldName, message, resolved]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/worksite', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, companyId, name, description } = req.body;
    try {

        await dbPool.query('INSERT INTO work_sites (id, company_id, name, description) VALUES ($1, $2, $3, $4)', [id, companyId, name, description]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/employee', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const {
        id, companyId, workSiteId, name, role, admissionDate, status, salary, cpf, rg, pis,
        birthDate, birthCity, birthState, nationality, motherName, fatherName, educationLevel, gender, maritalStatus,
        contractType, weeklyHours, shift, expectedStartDate,
        tituloEleitor, tituloEleitorZone, tituloEleitorSection, ctps, ctpsSeries, ctpsUf, reservista,
        email, phone,
        addressZip, addressStreet, addressNumber, addressComplement, addressDistrict, addressCity, addressState, address,
        emergencyContactName, emergencyContactPhone,
        bankName, bankAgency, bankAccount, bankAccountType,
        dependentsCount, dependentsNotes,
        vacationDue
    } = req.body;
    try {

        const query = `
            INSERT INTO employees (
                id, company_id, work_site_id, name, role, admission_date, status, salary, cpf, rg, pis,
                birth_date, birth_city, birth_state, nationality, mother_name, father_name, education_level, gender, marital_status,
                contract_type, weekly_hours, shift, expected_start_date,
                titulo_eleitor, titulo_eleitor_zone, titulo_eleitor_section, ctps, ctps_series, ctps_uf, reservista,
                email, phone,
                address_zip, address_street, address_number, address_complement, address_district, address_city, address_state, address,
                emergency_contact_name, emergency_contact_phone,
                bank_name, bank_agency, bank_account, bank_account_type,
                dependents_count, dependents_notes,
                vacation_due
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
                $12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,
                $25,$26,$27,$28,$29,$30,$31,
                $32,$33,
                $34,$35,$36,$37,$38,$39,$40,$41,
                $42,$43,
                $44,$45,$46,$47,
                $48,$49,
                $50
            )
            ON CONFLICT (id) DO UPDATE SET
                work_site_id = EXCLUDED.work_site_id,
                name = EXCLUDED.name,
                role = EXCLUDED.role,
                admission_date = EXCLUDED.admission_date,
                status = EXCLUDED.status,
                salary = EXCLUDED.salary,
                cpf = EXCLUDED.cpf,
                rg = EXCLUDED.rg,
                pis = EXCLUDED.pis,
                birth_date = EXCLUDED.birth_date,
                birth_city = EXCLUDED.birth_city,
                birth_state = EXCLUDED.birth_state,
                nationality = EXCLUDED.nationality,
                mother_name = EXCLUDED.mother_name,
                father_name = EXCLUDED.father_name,
                education_level = EXCLUDED.education_level,
                gender = EXCLUDED.gender,
                marital_status = EXCLUDED.marital_status,
                contract_type = EXCLUDED.contract_type,
                weekly_hours = EXCLUDED.weekly_hours,
                shift = EXCLUDED.shift,
                expected_start_date = EXCLUDED.expected_start_date,
                titulo_eleitor = EXCLUDED.titulo_eleitor,
                titulo_eleitor_zone = EXCLUDED.titulo_eleitor_zone,
                titulo_eleitor_section = EXCLUDED.titulo_eleitor_section,
                ctps = EXCLUDED.ctps,
                ctps_series = EXCLUDED.ctps_series,
                ctps_uf = EXCLUDED.ctps_uf,
                reservista = EXCLUDED.reservista,
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                address_zip = EXCLUDED.address_zip,
                address_street = EXCLUDED.address_street,
                address_number = EXCLUDED.address_number,
                address_complement = EXCLUDED.address_complement,
                address_district = EXCLUDED.address_district,
                address_city = EXCLUDED.address_city,
                address_state = EXCLUDED.address_state,
                address = EXCLUDED.address,
                emergency_contact_name = EXCLUDED.emergency_contact_name,
                emergency_contact_phone = EXCLUDED.emergency_contact_phone,
                bank_name = EXCLUDED.bank_name,
                bank_agency = EXCLUDED.bank_agency,
                bank_account = EXCLUDED.bank_account,
                bank_account_type = EXCLUDED.bank_account_type,
                dependents_count = EXCLUDED.dependents_count,
                dependents_notes = EXCLUDED.dependents_notes,
                vacation_due = EXCLUDED.vacation_due,
                updated_at = CURRENT_TIMESTAMP
        `;
        await dbPool.query(query, [
            id, companyId, workSiteId, name, role, admissionDate, status, salary, cpf, rg, pis,
            birthDate, birthCity, birthState, nationality, motherName, fatherName, educationLevel, gender, maritalStatus,
            contractType, weeklyHours, shift, expectedStartDate,
            tituloEleitor, tituloEleitorZone, tituloEleitorSection, ctps, ctpsSeries, ctpsUf, reservista,
            email, phone,
            addressZip, addressStreet, addressNumber, addressComplement, addressDistrict, addressCity, addressState, address,
            emergencyContactName, emergencyContactPhone,
            bankName, bankAgency, bankAccount, bankAccountType,
            dependentsCount, dependentsNotes,
            vacationDue
        ]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/time-sheet', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, employeeId, companyId, periodStart, periodEnd, status, approvedBy, approvedAt, signedAt } = req.body;
    try {
        await dbPool.query(
            `INSERT INTO time_sheets (id, employee_id, company_id, period_start, period_end, status, approved_by, approved_at, signed_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (id) DO UPDATE SET
                period_start = EXCLUDED.period_start,
                period_end = EXCLUDED.period_end,
                status = EXCLUDED.status,
                approved_by = EXCLUDED.approved_by,
                approved_at = EXCLUDED.approved_at,
                signed_at = EXCLUDED.signed_at,
                updated_at = CURRENT_TIMESTAMP`,
            [id, employeeId, companyId, periodStart, periodEnd, status, approvedBy || null, approvedAt || null, signedAt || null]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/time-entry', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, timeSheetId, entryDate, schedule, workHours, punches, situations, notes } = req.body;
    try {
        await dbPool.query(
            `INSERT INTO time_entries (id, time_sheet_id, entry_date, schedule, work_hours, punches, situations, notes)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
             ON CONFLICT (id) DO UPDATE SET
                schedule = EXCLUDED.schedule,
                work_hours = EXCLUDED.work_hours,
                punches = EXCLUDED.punches,
                situations = EXCLUDED.situations,
                notes = EXCLUDED.notes,
                updated_at = CURRENT_TIMESTAMP`,
            [id, timeSheetId, entryDate, schedule || null, workHours || null, JSON.stringify(punches || []), JSON.stringify(situations || []), notes || null]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/time-comment', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, timeEntryId, authorId, authorRole, message, createdAt } = req.body;
    try {
        await dbPool.query(
            `INSERT INTO time_comments (id, time_entry_id, author_id, author_role, message, created_at)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, timeEntryId, authorId, authorRole, message || '', createdAt || new Date().toISOString()]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/time-approve', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { timeSheetId, approvedBy } = req.body;
    try {
        await dbPool.query(
            `UPDATE time_sheets SET status = 'Aprovado', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [approvedBy || null, timeSheetId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/time-sign', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { timeSheetId } = req.body;
    try {
        await dbPool.query(
            `UPDATE time_sheets SET status = 'Assinado', signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [timeSheetId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/payroll', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, employeeId, companyId, competence, status } = req.body;
    try {
        await dbPool.query(
            `INSERT INTO payrolls (id, employee_id, company_id, competence, status)
             VALUES ($1,$2,$3,$4,$5)
             ON CONFLICT (id) DO UPDATE SET
                competence = EXCLUDED.competence,
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP`,
            [id, employeeId, companyId, competence, status || 'Disponivel']
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/hr/attachment', hrUpload.single('file'), async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id, entityType, entityId, uploadedBy, name } = req.body;
    if (!req.file) return res.status(400).json({ error: 'Arquivo năo enviado.' });
    try {

        const fileUrl = `/uploads/${req.file.filename}`;
        const fileName = name || req.file.originalname;
        const query = `
            INSERT INTO request_attachments (id, entity_type, entity_id, file_name, file_url, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await dbPool.query(query, [id, entityType, entityId, fileName, fileUrl, uploadedBy || null]);
        res.json({ 
            success: true, 
            attachment: {
                id,
                entityType,
                entityId,
                name: fileName,
                url: fileUrl,
                uploadedBy,
                createdAt: new Date().toISOString()
            }
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/hr/attachment/file/:id', async (req, res) => {
    if (!dbPool) return res.status(500).json({ error: 'DB not connected' });
    const { id } = req.params;
    try {
        const result = await dbPool.query(
            'SELECT file_url as url, file_name as name FROM request_attachments WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Arquivo não encontrado' });
        const { url, name } = result.rows[0];
        const safeUrl = typeof url === 'string' ? url.replace(/^\/+/, '') : '';
        const filePath = path.join(__dirname, safeUrl);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado' });
        res.setHeader('Content-Disposition', `inline; filename="${name || 'arquivo'}"`);
        return res.sendFile(filePath);
    } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get('/api/cep/:cep', async (req, res) => {
    const { cep } = req.params;
    const cleanCep = String(cep || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) return res.status(400).json({ error: 'CEP invalido' });
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cleanCep}/json/`, {
            timeout: 8000,
            validateStatus: () => true
        });
        if (response.status >= 400) {
            throw new Error('ViaCEP falhou');
        }
        if (response.data?.erro) return res.status(404).json({ error: 'CEP nao encontrado' });
        return res.json(response.data);
    } catch (e) {
        try {
            const fallback = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
                timeout: 8000,
                validateStatus: () => true
            });
            if (fallback.status >= 400) {
                return res.status(502).json({ error: 'Falha ao consultar CEP' });
            }
            return res.json({
                cep: fallback.data?.cep || cleanCep,
                logradouro: fallback.data?.street || '',
                bairro: fallback.data?.neighborhood || '',
                localidade: fallback.data?.city || '',
                uf: fallback.data?.state || ''
            });
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Falha ao consultar CEP';
            return res.status(500).json({ error: message });
        }
    }
});

app.post('/api/login', async (req, res) => {
    if (!dbPool) return res.status(500).json({ message: 'DB Disconnected' });
    const { email, password } = req.body;
    try {

        const result = await dbPool.query('SELECT id, full_name as name, email, role, company_id as "companyId", cpf FROM users WHERE email = $1 AND password_hash = $2', [email, password]);
        if (result.rows.length > 0) return res.json({ success: true, user: result.rows[0] });

        const cpfDigits = String(email || '').replace(/\D/g, '');
        if (cpfDigits.length >= 11) {
            const employeeRes = await dbPool.query(
                `SELECT e.id, e.company_id as "companyId", e.name, e.cpf, e.status,
                        COALESCE(e.birth_date, a.birth_date) as "birthDate",
                        to_char(COALESCE(e.birth_date, a.birth_date), 'DDMMYYYY') as "birthDateBr",
                        to_char(COALESCE(e.birth_date, a.birth_date), 'YYYYMMDD') as "birthDateIso"
                 FROM employees e
                 LEFT JOIN hr_admissions a ON regexp_replace(a.cpf, '\\D', '', 'g') = regexp_replace(e.cpf, '\\D', '', 'g')
                 WHERE regexp_replace(e.cpf, '\\D', '', 'g') = $1
                   AND e.status NOT IN ('Inativo', 'Desligado')
                 ORDER BY e.updated_at DESC NULLS LAST
                 LIMIT 1`,
                [cpfDigits]
            );
            if (employeeRes.rows.length > 0) {
                const employee = employeeRes.rows[0];
                const passDigits = String(password || '').replace(/\D/g, '');
                const birthDigits = String(employee.birthDate || '').replace(/\D/g, '');
                const birthBr = String(employee.birthDateBr || '').replace(/\D/g, '');
                const birthIso = String(employee.birthDateIso || '').replace(/\D/g, '');
                const isBirthMatch = passDigits && (
                    passDigits === birthDigits ||
                    passDigits === birthBr ||
                    passDigits === birthIso
                );
                if (isBirthMatch && employee.status !== 'Desligado' && employee.status !== 'Inativo') {
                    return res.json({
                        success: true,
                        user: {
                            id: employee.id,
                            name: employee.name,
                            email: '',
                            role: 'employee',
                            companyId: employee.companyId,
                            cpf: employee.cpf,
                            employeeId: employee.id
                        }
                    });
                }
            }
        }

        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/api/pix', async (req, res) => {
    const { clientId, clientSecret, pixKey, amount, protocol, requestData } = req.body;
    const crtPath = path.join(__dirname, 'certs', 'certificado.crt');
    const keyPath = path.join(__dirname, 'certs', 'chave.key');
    if (!fs.existsSync(crtPath) || !fs.existsSync(keyPath)) return res.status(400).json({ error: 'Certificados não encontrados.' });
    try {

        const agent = new https.Agent({ cert: fs.readFileSync(crtPath), key: fs.readFileSync(keyPath) });
        const auth = await axios.post('https://cdpj.partners.bancointer.com.br/oauth/v2/token', new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: 'cob.write', grant_type: 'client_credentials' }), { httpsAgent: agent });
        const cleanCpf = (requestData.cpf || '').replace(/\D/g, '');
        const cob = await axios.post('https://cdpj.partners.bancointer.com.br/pix/v2/cob', {
            calendario: { expiracao: 3600 },
            devedor: { cpf: cleanCpf, name: requestData.name },
            valor: { original: amount.toFixed(2) },
            chave: pixKey,
            solicitacaoPagador: `Servico ${protocol}`
        }, { httpsAgent: agent, headers: { Authorization: `Bearer ${auth.data.access_token}` } });
        res.json({ txid: cob.data.txid, pixCopiaECola: cob.data.pixCopiaECola });
    } catch (error) { res.status(500).json({ error: 'Falha Inter', details: error.response?.data }); }
});

app.post('/api/upload-cert', upload.fields([{ name: 'crt' }, { name: 'key' }]), (req, res) => {
    if (!fs.existsSync(path.join(__dirname, 'certs'))) fs.mkdirSync(path.join(__dirname, 'certs'));
    if (req.files['crt']) fs.renameSync(req.files['crt'][0].path, path.join(__dirname, 'certs', 'certificado.crt'));
    if (req.files['key']) fs.renameSync(req.files['key'][0].path, path.join(__dirname, 'certs', 'chave.key'));
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
