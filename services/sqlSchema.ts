export const POSTGRES_SCHEMA = `
-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES
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

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'client', 'employee')) NOT NULL,
    company_id UUID REFERENCES companies(id),
    cpf VARCHAR(14),
    phone VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 3. WORK_SITES (Postos de Trabalho / Setores)
CREATE TABLE IF NOT EXISTS work_sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. EMPLOYEES (Funcionários Ativos)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id),
    work_site_id UUID REFERENCES work_sites(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    admission_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Afastado', 'Gozando Ferias', 'Inativo', 'Desligado')),
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

-- 5. HR_ADMISSIONS (Processo de Admissão)
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

-- 6. HR_REQUESTS (Férias, Demissão, Atestados)
CREATE TABLE IF NOT EXISTS hr_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id),
    client_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'Férias', 'Demissão', 'Atestado'
    status VARCHAR(30) DEFAULT 'Solicitado',
    details JSONB, -- Campos flexíveis
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. HR_FIELD_FEEDBACK (Apontamento de Erros)
CREATE TABLE IF NOT EXISTS hr_field_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id UUID NOT NULL, -- ID de hr_admissions ou hr_requests
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

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. SERVICE_REQUESTS, DOCUMENTS, etc (Mantidos)
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
    entity_type VARCHAR(50), -- 'request', 'admission', 'hr_request'
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
`;
