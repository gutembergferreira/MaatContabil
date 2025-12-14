import { Routine, Document, Company, User, Notification, ChatMessage, AuditLog, ServiceRequest, RequestTypeConfig, PaymentConfig, RequestAttachment } from '../types';

// ==========================================
// API ADAPTER (SYNC WITH BACKEND)
// ==========================================

let USERS: User[] = [];
let COMPANIES: Company[] = [];
let REQUESTS: ServiceRequest[] = [];
let DOCUMENTS: Document[] = [];
let NOTIFICATIONS: Notification[] = [];
let CATEGORIES: string[] = [];
let REQUEST_TYPES: RequestTypeConfig[] = [];

// Mapeamento local para chats e logs (cache)
let CHAT_CACHE: Record<string, ChatMessage[]> = {};
let LOG_CACHE: Record<string, AuditLog[]> = {};

let PAYMENT_CONFIG: PaymentConfig = {
  environment: 'sandbox',
  enablePix: false,
  enableGateway: false,
  inter: { clientId: '', clientSecret: '', certificateUploaded: false, pixKey: '' }
};

const API_URL = 'http://localhost:3001/api';

// --- MAIN SYNC FUNCTION ---
export const fetchInitialData = async () => {
    try {
        const res = await fetch(`${API_URL}/sync`);
        if (!res.ok) throw new Error('Failed to sync');
        const data = await res.json();
        
        USERS = data.users;
        COMPANIES = data.companies;
        CATEGORIES = data.categories;
        REQUEST_TYPES = data.requestTypes;
        NOTIFICATIONS = data.notifications;
        
        // Transform Requests (Map Chat/Attachments/Logs)
        REQUESTS = data.requests.map((r: any) => ({
            ...r,
            attachments: data.attachments.filter((a: any) => a.requestId === r.id),
            chat: data.chat.filter((c: any) => c.entityId === r.id),
            auditLog: data.auditLogs.filter((l: any) => l.entityId === r.id)
        }));

        // Transform Documents
        DOCUMENTS = data.documents.map((d: any) => ({
            ...d,
            chat: data.chat.filter((c: any) => c.entityId === d.id),
            auditLog: data.auditLogs.filter((l: any) => l.entityId === d.id),
            attachments: [] // Documents table handled attachments differently in this simple version
        }));

        console.log("Dados sincronizados com o banco de dados com sucesso!");
        return true;
    } catch (e) {
        console.error("Erro ao sincronizar dados com o backend:", e);
        return false;
    }
};

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        
        if (!res.ok) throw new Error('Falha HTTP');
        const data = await res.json();
        if (data.success) {
            // Após login com sucesso, aproveita para sincronizar dados recentes
            await fetchInitialData(); 
            return data.user;
        }
        return null;
    } catch (e) {
        console.warn("Backend offline ou login falhou.", e);
        return null;
    }
};

// --- GETTERS (Leem da memória que foi populada pelo fetchInitialData) ---
export const getUsers = () => USERS;
export const getCompanies = () => COMPANIES;
export const getCategories = () => CATEGORIES;
export const getRequestTypes = () => REQUEST_TYPES;
export const getDocuments = (companyId: string) => DOCUMENTS.filter(d => d.companyId === companyId);
export const getServiceRequests = (companyId?: string, includeDeleted = false) => {
    let reqs = REQUESTS;
    if (companyId) reqs = reqs.filter(r => r.companyId === companyId);
    if (!includeDeleted) reqs = reqs.filter(r => !r.deleted);
    return reqs.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};
export const getDeletedServiceRequests = () => REQUESTS.filter(r => r.deleted);
export const getNotifications = (userId: string) => NOTIFICATIONS.filter(n => n.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
export const getAllNotifications = () => NOTIFICATIONS;

// --- MOCK MUTATIONS (In a real full app, these would be POST/PUT calls to API) ---
// For now, we simulate updates in memory for UI responsiveness, but data resets on reload if not fully wired to POST endpoints.
// To fully implement CRUD, each of these functions needs to fetch(`${API_URL}/...`)

export const addServiceRequest = (req: ServiceRequest) => { 
    REQUESTS = [req, ...REQUESTS]; 
    // TODO: fetch(`${API_URL}/requests`, { method: 'POST', body: JSON.stringify(req) })
};
export const updateServiceRequest = (req: ServiceRequest) => { 
    REQUESTS = REQUESTS.map(r => r.id === req.id ? req : r);
};
export const addDocument = (d: Document) => { DOCUMENTS = [d, ...DOCUMENTS]; };
export const updateDocument = (d: Document) => { DOCUMENTS = DOCUMENTS.map(doc => doc.id === d.id ? d : doc); };
export const addCompany = (c: Company) => { COMPANIES = [...COMPANIES, c]; };
export const updateCompany = (c: Company) => { COMPANIES = COMPANIES.map(x => x.id === c.id ? c : x); };
export const deleteCompany = (id: string) => { COMPANIES = COMPANIES.filter(x => x.id !== id); };
export const addUser = (u: User) => { USERS = [...USERS, u]; };
export const updateUser = (u: User) => { USERS = USERS.map(x => x.id === u.id ? u : x); };
export const deleteUser = (id: string) => { USERS = USERS.filter(x => x.id !== id); };

// --- CONFIG ---
export const getPaymentConfig = () => {
    const saved = localStorage.getItem('maat_payment_config');
    if (saved) return JSON.parse(saved);
    return PAYMENT_CONFIG;
};
export const updatePaymentConfig = (config: PaymentConfig) => { 
    PAYMENT_CONFIG = config; 
    localStorage.setItem('maat_payment_config', JSON.stringify(config));
};

// --- PIX & INTEGRATIONS ---
export const testPixConnection = async () => {
     // Check if backend is reachable
     try {
         const res = await fetch(`${API_URL}/status`);
         if(res.ok) return { success: true, message: 'Backend conectado.', logs: []};
         return { success: false, message: 'Backend offline', logs: []};
     } catch(e) { return { success: false, message: 'Erro conexão', logs: []}; }
};

export const generatePixCharge = async (reqId: string, amount: number) => { 
    if (!PAYMENT_CONFIG.inter.clientId) throw new Error('Client ID não configurado.');
    const req = REQUESTS.find(r => r.id === reqId);
    const clientUser = USERS.find(u => u.id === req?.clientId);
    const rawCpf = clientUser?.cpf || '00000000000'; 
    const payerCpf = rawCpf.replace(/\D/g, ''); 
    const payerName = clientUser?.name || 'Cliente Maat';

    try {
        const res = await fetch(`${API_URL}/pix`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                amount, protocol: 'REQ_' + reqId, pixKey: PAYMENT_CONFIG.inter.pixKey, 
                clientId: PAYMENT_CONFIG.inter.clientId, clientSecret: PAYMENT_CONFIG.inter.clientSecret, 
                requestData: { name: payerName, cpf: payerCpf } 
            })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.details?.error_description || data.error || 'Erro PIX');
        return data;
    } catch (error: any) {
        console.error("Erro PIX:", error);
        throw error;
    }
}
export const simulateWebhookPayment = (txid: string) => true;

// --- HELPERS (Keep for compilation compat) ---
export const deleteDocument = (id: string) => { DOCUMENTS = DOCUMENTS.filter(d => d.id !== id); };
export const addDocumentMessage = (docId: string, msg: ChatMessage) => {};
export const addAuditLog = (docId: string, log: AuditLog) => {};
export const softDeleteServiceRequest = (id: string, user: string) => {};
export const restoreServiceRequest = (id: string, user: string) => {};
export const addRequestAttachment = (reqId: string, attachment: RequestAttachment) => {};
export const deleteRequestAttachment = (reqId: string, attId: string, user: string) => {};
export const addRequestMessage = (reqId: string, msg: ChatMessage) => {};
export const addNotification = (n: Notification) => {};
export const updateNotification = (n: Notification) => {};
export const deleteNotification = (id: string) => {};
export const markNotificationRead = (id: string) => {};
export const addCategory = (cat: string) => {};
export const deleteCategory = (cat: string) => {};
export const addRequestType = (t: RequestTypeConfig) => {};
export const deleteRequestType = (id: string) => {};

// Mocks estáticos apenas para placeholders visuais se o banco falhar
export const MOCK_ROUTINES: Routine[] = [
  { id: '1', title: 'Fechamento Folha', clientName: 'Empresa Demo', department: 'Pessoal', deadline: '2024-06-05', status: 'Pendente', competence: '05/2024' }
];
export const MOCK_EMPLOYEES = [
  { id: 'e1', name: 'João Silva', role: 'Vigilante', admissionDate: '2022-01-15', status: 'Ativo', worksite: 'Posto Alpha', vacationDue: '2024-08-15' },
];
export const CURRENT_CLIENT = { 
    id: 'c1', name: 'Empresa Demo LTDA', 
    financials: { revenueMonth: 28500.00, revenueYear: 342000.00, receivables: 5200.00, payables: 3100.00, nextTaxDeadline: '20/06' } 
};
