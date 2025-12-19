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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS
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
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Afastado', 'Desligado')),
    salary DECIMAL(12, 2) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    rg VARCHAR(20),
    pis VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(50),
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
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    
    role VARCHAR(100),
    salary DECIMAL(12, 2),
    work_site_id UUID REFERENCES work_sites(id),
    expected_start_date DATE,
    
    pis VARCHAR(20),
    titulo_eleitor VARCHAR(20),
    ctps VARCHAR(20),
    address TEXT,
    
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