export const POSTGRES_SCHEMA = `
-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES (Empresas)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    contact_info VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS (Usuários e Admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'client')) NOT NULL,
    company_id UUID REFERENCES companies(id),
    cpf VARCHAR(14), -- Importante para o PIX
    phone VARCHAR(50),
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 3. REQUEST_TYPES (Categorias de Solicitações/Serviços)
CREATE TABLE IF NOT EXISTS request_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE
);

-- 4. DOCUMENT_CATEGORIES (Categorias de Arquivos - NOVA TABELA)
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT TRUE
);

-- 5. SERVICE_REQUESTS (Solicitações com Auditoria PIX)
CREATE TABLE IF NOT EXISTS service_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    request_type_id UUID REFERENCES request_types(id),
    price DECIMAL(10, 2),
    
    status VARCHAR(50) CHECK (status IN ('Pendente Pagamento', 'Pagamento em Análise', 'Solicitada', 'Visualizada', 'Em Resolução', 'Em Validação', 'Resolvido')),
    payment_status VARCHAR(50) DEFAULT 'N/A',
    
    -- PIX Info para Auditoria
    txid VARCHAR(255),
    pix_code TEXT, -- Copia e Cola
    pix_expiration TIMESTAMP,
    pix_payload JSONB, -- Salva o payload enviado/recebido para auditoria
    
    client_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    
    deleted_at TIMESTAMP, -- Soft Delete
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. DOCUMENTS (Arquivos e Relatórios)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- Pode ser FK para document_categories ou string direta
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

-- 7. ATTACHMENTS (Anexos de Pedidos)
CREATE TABLE IF NOT EXISTS request_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. CHAT_MESSAGES (Chat de Pedidos e Documentos)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) CHECK (entity_type IN ('request', 'document')),
    entity_id UUID NOT NULL, -- ID do request ou documento
    sender_id UUID REFERENCES users(id),
    sender_name VARCHAR(255), -- Denormalizado para facilitar display
    role VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. AUDIT_LOGS (Log de Auditoria)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50), -- 'request', 'document'
    entity_id UUID,
    action VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTIFICATIONS (Notificações)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;