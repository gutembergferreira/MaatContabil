import { Routine, Document, Company, User, Notification, ChatMessage, AuditLog, ServiceRequest, RequestTypeConfig, PaymentConfig, RequestAttachment, Employee, WorkSite, HRAdmission, HRRequest, HRFieldFeedback, TimeSheet, TimeEntry, TimeComment, Payroll, ObligationDefinition, MonthlyRoutine } from '../types';
import { getApiUrl, getApiBaseUrl, loadApiBaseFromServer, saveApiBaseToServer, clearApiBaseOnServer } from './apiConfig';

let USERS: User[] = [];
let COMPANIES: Company[] = [];
let REQUESTS: ServiceRequest[] = [];
let DOCUMENTS: Document[] = [];
let NOTIFICATIONS: Notification[] = [];
let CATEGORIES: string[] = [];
let REQUEST_TYPES: RequestTypeConfig[] = [];

// HR STATE
let WORK_SITES: WorkSite[] = [];
let EMPLOYEES: Employee[] = [];
let HR_ADMISSIONS: HRAdmission[] = [];
let HR_REQUESTS: HRRequest[] = [];
let FIELD_FEEDBACK: HRFieldFeedback[] = [];
let HR_ATTACHMENTS: RequestAttachment[] = [];
let NOTIF_ATTACHMENTS: RequestAttachment[] = [];
let EMPLOYEE_ATTACHMENTS: RequestAttachment[] = [];
let TIME_SHEETS: TimeSheet[] = [];
let TIME_ENTRIES: TimeEntry[] = [];
let TIME_COMMENTS: TimeComment[] = [];
let PAYROLLS: Payroll[] = [];
let OBLIGATIONS: ObligationDefinition[] = [];
let MONTHLY_ROUTINES: MonthlyRoutine[] = [];
let ROUTINE_ATTACHMENTS: RequestAttachment[] = [];

export { getApiUrl, getApiBaseUrl, loadApiBaseFromServer, saveApiBaseToServer, clearApiBaseOnServer };

const createId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const fetchInitialData = async () => {
    try {
        const res = await fetch(`${getApiUrl()}/sync`);
        if (!res.ok) throw new Error('Failed to sync');
        const data = await res.json();
        
        USERS = data.users;
        COMPANIES = data.companies;
        CATEGORIES = data.categories;
        REQUEST_TYPES = data.requestTypes;
        NOTIFICATIONS = data.notifications;
        
        WORK_SITES = data.workSites;
        EMPLOYEES = data.employees;
        HR_ADMISSIONS = data.hrAdmissions || [];
        HR_REQUESTS = data.hrRequests || [];
        FIELD_FEEDBACK = data.fieldFeedback || [];
        TIME_SHEETS = data.timeSheets || [];
        TIME_ENTRIES = (data.timeEntries || []).map((entry: any) => ({
            ...entry,
            punches: Array.isArray(entry.punches) ? entry.punches : entry.punches ? JSON.parse(entry.punches) : [],
            situations: Array.isArray(entry.situations) ? entry.situations : entry.situations ? JSON.parse(entry.situations) : []
        }));
        TIME_COMMENTS = data.timeComments || [];
        PAYROLLS = data.payrolls || [];
        OBLIGATIONS = (data.obligations || []).map((ob: any) => ({
            ...ob,
            monthlyDue: typeof ob.monthlyDue === 'string' ? JSON.parse(ob.monthlyDue) : ob.monthlyDue
        }));
        MONTHLY_ROUTINES = data.routines || [];
        HR_ATTACHMENTS = data.attachments.filter((a: any) => a.entityType === 'admission' || a.entityType === 'hr_request' || a.entityType === 'payroll' || a.entityType === 'time_sheet');
        ROUTINE_ATTACHMENTS = data.attachments.filter((a: any) => a.entityType === 'monthly_routine');
        NOTIF_ATTACHMENTS = data.attachments.filter((a: any) => a.entityType === 'notification');
        EMPLOYEE_ATTACHMENTS = data.attachments.filter((a: any) => a.entityType === 'employee_photo');

        REQUESTS = data.requests.map((r: any) => ({
            ...r,
            attachments: data.attachments.filter((a: any) => a.entityId === r.id && (a.entityType === 'request' || !a.entityType)),
            chat: data.chat.filter((c: any) => c.entityId === r.id),
            auditLog: []
        }));

        DOCUMENTS = data.documents.map((d: any) => ({
            ...d,
            chat: data.chat.filter((c: any) => c.entityId === d.id),
            auditLog: [],
            attachments: data.attachments.filter((a: any) => a.entityId === d.id && a.entityType === 'document')
        }));

        console.log("Dados sincronizados com o banco de dados.");
        return true;
    } catch (e) {
        console.error("Erro ao sincronizar dados:", e);
        return false;
    }
};

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
    try {
        const res = await fetch(`${getApiUrl()}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        if (!res.ok) throw new Error('Falha HTTP');
        const data = await res.json();
        if (data.success) {
            await fetchInitialData(); 
            return data.user;
        }
        return null;
    } catch (e) { return null; }
};

// GETTERS
export const getUsers = () => USERS;
export const getCompanies = () => COMPANIES;
export const getCategories = () => CATEGORIES;
export const getRequestTypes = () => REQUEST_TYPES;
export const getDocuments = (companyId?: string) => {
    if (!companyId || companyId === 'all') return DOCUMENTS;
    return DOCUMENTS.filter(d => d.companyId === companyId);
};

export const getServiceRequests = (companyId?: string, includeDeleted = false) => {
    let reqs = REQUESTS;
    if (companyId) reqs = reqs.filter(r => r.companyId === companyId);
    if (!includeDeleted) reqs = reqs.filter(r => !r.deleted);
    return reqs;
};

export const getDeletedServiceRequests = () => REQUESTS.filter(r => r.deleted);
export const getNotifications = (userId: string) => NOTIFICATIONS.filter(n => n.userId === userId);
export const getAllNotifications = () => NOTIFICATIONS;
export const getObligations = () => OBLIGATIONS;
export const getMonthlyRoutines = () => MONTHLY_ROUTINES;

// HR GETTERS
export const getWorkSites = (companyId?: string) => {
    if (!companyId || companyId === 'all') return WORK_SITES;
    return WORK_SITES.filter(s => s.companyId === companyId);
};
export const getEmployees = (companyId?: string) => {
    if (!companyId || companyId === 'all') return EMPLOYEES;
    return EMPLOYEES.filter(e => e.companyId === companyId);
};
export const getHRAdmissions = (companyId?: string) => {
    if (!companyId || companyId === 'all') return HR_ADMISSIONS;
    return HR_ADMISSIONS.filter(a => a.companyId === companyId);
};
export const getHRRequests = (companyId?: string) => {
    if (!companyId || companyId === 'all') return HR_REQUESTS;
    return HR_REQUESTS.filter(r => r.companyId === companyId);
};
export const getFieldFeedback = (targetId: string) => FIELD_FEEDBACK.filter(f => f.targetId === targetId);
export const getHrAttachments = (entityType: 'admission' | 'hr_request' | 'payroll' | 'time_sheet', entityId: string) =>
    HR_ATTACHMENTS.filter(a => a.entityType === entityType && a.entityId === entityId);
export const getNotificationAttachments = (notificationId: string) =>
    NOTIF_ATTACHMENTS.filter(a => a.entityType === 'notification' && a.entityId === notificationId);
export const getEmployeePhotos = (employeeId: string) =>
    EMPLOYEE_ATTACHMENTS.filter(a => a.entityType === 'employee_photo' && a.entityId === employeeId);
export const getRoutineAttachments = (routineId: string) =>
    ROUTINE_ATTACHMENTS.filter(a => a.entityType === 'monthly_routine' && a.entityId === routineId);

export const getTimeSheets = (companyId?: string) => {
    if (!companyId || companyId === 'all') return TIME_SHEETS;
    return TIME_SHEETS.filter(s => s.companyId === companyId);
};
export const getEmployeeTimeSheets = (employeeId: string) => TIME_SHEETS.filter(s => s.employeeId === employeeId);
export const getTimeEntries = (timeSheetId: string) => TIME_ENTRIES.filter(e => e.timeSheetId === timeSheetId);
export const getTimeComments = (timeEntryId: string) => TIME_COMMENTS.filter(c => c.timeEntryId === timeEntryId);
export const getPayrolls = (companyId?: string) => {
    if (!companyId || companyId === 'all') return PAYROLLS;
    return PAYROLLS.filter(p => p.companyId === companyId);
};
export const getEmployeePayrolls = (employeeId: string) => PAYROLLS.filter(p => p.employeeId === employeeId);

// HR MUTATIONS (PERSISTENT)
export const addHRAdmission = async (adm: HRAdmission) => { 
    const res = await fetch(`${getApiUrl()}/hr/admission`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(adm)
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao salvar admissao');
    }
    await fetchInitialData();
};
export const updateHRAdmission = async (adm: HRAdmission) => { 
    const res = await fetch(`${getApiUrl()}/hr/admission`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(adm)
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao atualizar admissao');
    }
    await fetchInitialData();
};
export const addHRRequest = async (req: HRRequest) => { 
    await fetch(`${getApiUrl()}/hr/request`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(req)
    });
    await fetchInitialData();
};
export const updateHRRequest = async (req: HRRequest) => { 
    await fetch(`${getApiUrl()}/hr/request`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(req)
    });
    await fetchInitialData();
};
export const addFieldFeedback = async (f: HRFieldFeedback) => { 
    await fetch(`${getApiUrl()}/hr/feedback`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(f)
    });
    await fetchInitialData();
};
export const resolveFieldFeedback = async (id: string) => { 
    const feedback = FIELD_FEEDBACK.find(f => f.id === id);
    if (feedback) {
        await addFieldFeedback({...feedback, resolved: true});
    }
};
export const addWorkSite = async (ws: WorkSite) => { 
    await fetch(`${getApiUrl()}/hr/worksite`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(ws)
    });
    await fetchInitialData();
};
export const addEmployee = async (e: Employee) => { 
    await fetch(`${getApiUrl()}/hr/employee`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(e)
    });
    await fetchInitialData();
};

export const updateEmployee = async (e: Employee) => { 
    await fetch(`${getApiUrl()}/hr/employee`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(e)
    });
    await fetchInitialData();
};

export const addTimeSheet = async (sheet: TimeSheet) => {
    await fetch(`${getApiUrl()}/hr/time-sheet`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(sheet)
    });
    await fetchInitialData();
};

export const updateTimeSheet = async (sheet: TimeSheet) => {
    await fetch(`${getApiUrl()}/hr/time-sheet`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(sheet)
    });
    await fetchInitialData();
};

export const addTimeEntry = async (entry: TimeEntry) => {
    await fetch(`${getApiUrl()}/hr/time-entry`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(entry)
    });
    await fetchInitialData();
};

export const addTimeComment = async (comment: TimeComment) => {
    await fetch(`${getApiUrl()}/hr/time-comment`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(comment)
    });
    await fetchInitialData();
};

export const approveTimeSheet = async (timeSheetId: string, approvedBy?: string) => {
    await fetch(`${getApiUrl()}/hr/time-approve`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ timeSheetId, approvedBy })
    });
    await fetchInitialData();
};

export const signTimeSheet = async (timeSheetId: string) => {
    await fetch(`${getApiUrl()}/hr/time-sign`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ timeSheetId })
    });
    await fetchInitialData();
};

export const addPayroll = async (payroll: Payroll) => {
    await fetch(`${getApiUrl()}/hr/payroll`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payroll)
    });
    await fetchInitialData();
};

export const uploadRoutineAttachment = async (payload: {
    file: File;
    routineId: string;
    companyId: string;
    category: string;
    title?: string;
    referenceDate?: string;
}) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('routineId', payload.routineId);
    formData.append('companyId', payload.companyId);
    formData.append('category', payload.category);
    if (payload.title) formData.append('title', payload.title);
    if (payload.referenceDate) formData.append('referenceDate', payload.referenceDate);

    const res = await fetch(`${getApiUrl()}/monthly-routines/attachment`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha no upload do arquivo');
    }
    await fetchInitialData();
};

export const uploadHrAttachment = async (payload: {
    file: File;
    entityType: 'admission' | 'hr_request' | 'notification' | 'employee_photo' | 'payroll' | 'time_sheet';
    entityId: string;
    uploadedBy?: string;
    name?: string;
}) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('id', createId());
    formData.append('entityType', payload.entityType);
    formData.append('entityId', payload.entityId);
    if (payload.uploadedBy) formData.append('uploadedBy', payload.uploadedBy);
    if (payload.name) formData.append('name', payload.name);

    const res = await fetch(`${getApiUrl()}/hr/attachment`, {
        method: 'POST',
        body: formData
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha no upload do arquivo');
    }
    const data = await res.json();
    if (data.attachment) {
        if (payload.entityType === 'notification') {
            NOTIF_ATTACHMENTS = [data.attachment, ...NOTIF_ATTACHMENTS];
        } else if (payload.entityType === 'employee_photo') {
            EMPLOYEE_ATTACHMENTS = [data.attachment, ...EMPLOYEE_ATTACHMENTS];
        } else {
            HR_ATTACHMENTS = [data.attachment, ...HR_ATTACHMENTS];
        }
    }
    return data.attachment as RequestAttachment;
};

export const sendNotifications = async (notifications: Notification[]) => {
    const res = await fetch(`${getApiUrl()}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications })
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao enviar notificacoes');
    }
    await fetchInitialData();
};

export const getPaymentConfig = () => {
    const saved = localStorage.getItem('maat_payment_config');
    if (saved) return JSON.parse(saved);
    return { environment: 'sandbox', enablePix: false, enableGateway: false, inter: { clientId: '', clientSecret: '', certificateUploaded: false, pixKey: '' } };
};
export const updatePaymentConfig = (config: PaymentConfig) => { localStorage.setItem('maat_payment_config', JSON.stringify(config)); };

export const generatePixCharge = async (reqId: string, amount: number) => { 
    const config = getPaymentConfig();
    const req = REQUESTS.find(r => r.id === reqId);
    const clientUser = USERS.find(u => u.id === req?.clientId);
    try {
        const res = await fetch(`${getApiUrl()}/pix`, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ amount, protocol: 'REQ_' + reqId, pixKey: config.inter.pixKey, clientId: config.inter.clientId, clientSecret: config.inter.clientSecret, requestData: { name: clientUser?.name || 'Cliente', cpf: clientUser?.cpf || '00000000000' } })
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.details?.error_description || data.error || 'Erro PIX');
        return data;
    } catch (error: any) { throw error; }
};

export const MOCK_ROUTINES: Routine[] = [];
export const MOCK_EMPLOYEES = [];
export const CURRENT_CLIENT = { id: 'c1', name: 'Empresa Demo', financials: { revenueMonth: 0, revenueYear: 0, receivables: 0, payables: 0, nextTaxDeadline: '' } };

export const addServiceRequest = (req: ServiceRequest) => { REQUESTS = [req, ...REQUESTS]; };
export const updateServiceRequest = (req: ServiceRequest) => { REQUESTS = REQUESTS.map(r => r.id === req.id ? req : r); };
export const addDocument = (d: Document) => { DOCUMENTS = [d, ...DOCUMENTS]; };
export const updateDocument = (d: Document) => { DOCUMENTS = DOCUMENTS.map(doc => doc.id === d.id ? d : doc); };
export const markNotificationRead = async (id: string) => {
    NOTIFICATIONS = NOTIFICATIONS.map(n => n.id === id ? { ...n, read: true } : n);
    try {
        await fetch(`${getApiUrl()}/notifications/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    } catch {
        // Ignore network errors; local state already updated.
    }
};
export const deleteDocument = (id: string) => { DOCUMENTS = DOCUMENTS.filter(d => d.id !== id); };
export const addDocumentMessage = (docId: string, msg: ChatMessage) => { DOCUMENTS = DOCUMENTS.map(d => d.id === docId ? { ...d, chat: [...d.chat, msg] } : d); };
export const addAuditLog = (docId: string, log: AuditLog) => { DOCUMENTS = DOCUMENTS.map(d => d.id === docId ? { ...d, auditLog: [...d.auditLog, log] } : d); };
export const softDeleteServiceRequest = (id: string, user: string) => { REQUESTS = REQUESTS.map(r => r.id === id ? { ...r, deleted: true } : r); };
export const restoreServiceRequest = (id: string, user: string) => { REQUESTS = REQUESTS.map(r => r.id === id ? { ...r, deleted: false } : r); };
export const addRequestAttachment = (reqId: string, attachment: RequestAttachment) => { REQUESTS = REQUESTS.map(r => r.id === reqId ? { ...r, attachments: [...r.attachments, attachment] } : r); };
export const deleteRequestAttachment = (reqId: string, attId: string, user: string) => { REQUESTS = REQUESTS.map(r => r.id === reqId ? { ...r, attachments: r.attachments.filter(a => a.id !== attId) } : r); };
export const addRequestMessage = (reqId: string, msg: ChatMessage) => { REQUESTS = REQUESTS.map(r => r.id === reqId ? { ...r, chat: [...r.chat, msg] } : r); };
export const addNotification = (n: Notification) => { NOTIFICATIONS = [n, ...NOTIFICATIONS]; };
export const updateNotification = async (n: Notification) => {
    NOTIFICATIONS = NOTIFICATIONS.map(x => x.id === n.id ? n : x);
    await fetch(`${getApiUrl()}/notifications/${n.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: n.title, message: n.message })
    }).catch(() => null);
    await fetchInitialData();
};
export const deleteNotification = async (id: string) => {
    NOTIFICATIONS = NOTIFICATIONS.filter(n => n.id !== id);
    await fetch(`${getApiUrl()}/notifications/${id}`, { method: 'DELETE' }).catch(() => null);
    await fetchInitialData();
};
export const addCategory = (cat: string) => { if (!CATEGORIES.includes(cat)) CATEGORIES = [...CATEGORIES, cat]; };
export const deleteCategory = (cat: string) => { CATEGORIES = CATEGORIES.filter(c => c !== cat); };
export const addRequestType = (t: RequestTypeConfig) => { REQUEST_TYPES = [...REQUEST_TYPES, t]; };
export const deleteRequestType = (id: string) => { REQUEST_TYPES = REQUEST_TYPES.filter(t => t.id !== id); };
export const addUser = (u: User) => { USERS = [...USERS, u]; };
export const updateUser = (u: User) => { USERS = USERS.map(x => x.id === u.id ? u : x); };
export const deleteUser = (id: string) => { USERS = USERS.filter(u => u.id !== id); };
export const addCompany = async (c: Company) => {
    await fetch(`${getApiUrl()}/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
    });
    await fetchInitialData();
};
export const updateCompany = async (c: Company) => {
    await fetch(`${getApiUrl()}/company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c)
    });
    await fetchInitialData();
};
export const deleteCompany = async (id: string) => {
    await fetch(`${getApiUrl()}/company/${id}`, { method: 'DELETE' });
    await fetchInitialData();
};

export const addObligation = async (payload: ObligationDefinition) => {
    await fetch(`${getApiUrl()}/obligations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    await fetchInitialData();
};

export const updateObligation = async (payload: ObligationDefinition) => {
    await fetch(`${getApiUrl()}/obligations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    await fetchInitialData();
};

export const deleteObligation = async (id: string) => {
    await fetch(`${getApiUrl()}/obligations/${id}`, { method: 'DELETE' });
    await fetchInitialData();
};

export const updateMonthlyRoutineStatus = async (id: string, status: string) => {
    await fetch(`${getApiUrl()}/monthly-routines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
    });
    await fetchInitialData();
};
export const testPixConnection = async () => ({ success: true, message: 'Backend conectado.', logs: []});
export const simulateWebhookPayment = (txid: string) => {
    let success = false;
    REQUESTS = REQUESTS.map(r => {
        if (r.txid === txid) {
            success = true;
            return { ...r, status: 'Solicitada', paymentStatus: 'Aprovado' };
        }
        return r;
    });
    return success;
};
