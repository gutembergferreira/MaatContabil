export type Role = 'admin' | 'client' | 'employee';
export type Department = 'Contábil' | 'Fiscal' | 'Pessoal' | 'Legalização';
export type DocCategory = string;

export interface RequestTypeConfig {
  id: string;
  name: string;
  price: number;
}

export type DocStatus = 'Enviado' | 'Visualizado';
export type PaymentStatus = 'Pago' | 'Aberto' | 'N/A';

export type RequestStatus = 'Pendente Pagamento' | 'Pagamento em Análise' | 'Solicitada' | 'Visualizada' | 'Em Resolução' | 'Em Validação' | 'Resolvido';
export type RequestPaymentStatus = 'Pendente' | 'Em Análise' | 'Aprovado' | 'N/A';

// --- HR SPECIFIC TYPES ---
export type HRAdmissionStatus = 'Novo' | 'Validando' | 'Formulario com Erro' | 'Validado' | 'Finalizado';
export type HRRequestType = 'Férias' | 'Demissão' | 'Atestado' | 'Inclusão Dependente' | 'Atualização Cadastro';
export type HRRequestStatus = 'Solicitado' | 'Em Analise' | 'Pendencia' | 'Agendado' | 'Finalizado' | 'Cancelado';

export interface WorkSite {
    id: string;
    companyId: string;
    name: string;
    description?: string;
}

export interface Employee {
    id: string;
    companyId: string;
    workSiteId?: string;
    name: string;
    role: string;
    admissionDate: string;
    status: 'Ativo' | 'Afastado' | 'Gozando Férias' | 'Inativo' | 'Desligado';
    salary: number;
    cpf: string;
    rg?: string;
    pis?: string;
    birthDate?: string;
    birthCity?: string;
    birthState?: string;
    nationality?: string;
    motherName?: string;
    fatherName?: string;
    educationLevel?: string;
    gender?: string;
    maritalStatus?: string;
    contractType?: string;
    weeklyHours?: number;
    shift?: string;
    expectedStartDate?: string;
    tituloEleitor?: string;
    tituloEleitorZone?: string;
    tituloEleitorSection?: string;
    ctps?: string;
    ctpsSeries?: string;
    ctpsUf?: string;
    reservista?: string;
    phone?: string;
    email?: string;
    addressZip?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressComplement?: string;
    addressDistrict?: string;
    addressCity?: string;
    addressState?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bankName?: string;
    bankAgency?: string;
    bankAccount?: string;
    bankAccountType?: string;
    dependentsCount?: number;
    dependentsNotes?: string;
    vacationDue: string;
    photoUrl?: string;
}

export type TimeSheetStatus = 'Em Edicao' | 'Enviado' | 'Pendencia' | 'Aprovado' | 'Assinado';

export interface TimeSheet {
    id: string;
    employeeId: string;
    companyId: string;
    periodStart: string;
    periodEnd: string;
    status: TimeSheetStatus;
    approvedBy?: string;
    approvedAt?: string;
    signedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TimeEntry {
    id: string;
    timeSheetId: string;
    entryDate: string;
    schedule?: string;
    workHours?: string;
    punches: string[];
    situations: string[];
    notes?: string;
    updatedAt: string;
}

export interface TimeComment {
    id: string;
    timeEntryId: string;
    authorId: string;
    authorRole: Role;
    message: string;
    createdAt: string;
}

export interface Payroll {
    id: string;
    employeeId: string;
    companyId: string;
    competence: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface HRFieldFeedback {
    id: string;
    targetId: string; // ID da admissão ou solicitação
    fieldName: string;
    message: string;
    resolved: boolean;
}

export interface HRAdmission {
    id: string;
    companyId: string;
    status: HRAdmissionStatus;
    
    // Dados Pessoais
    fullName: string;
    cpf: string;
    rg: string;
    birthDate: string;
    birthCity?: string;
    birthState?: string;
    nationality?: string;
    motherName?: string;
    fatherName?: string;
    educationLevel?: string;
    gender: string;
    maritalStatus: string;
    
    // Contratual
    role: string;
    contractType?: string;
    weeklyHours?: number;
    shift?: string;
    salary: number;
    workSiteId: string;
    expectedStartDate: string;
    
    // Documentação Extra
    pis?: string;
    tituloEleitor?: string;
    tituloEleitorZone?: string;
    tituloEleitorSection?: string;
    ctps?: string;
    ctpsSeries?: string;
    ctpsUf?: string;
    reservista?: string;
    email?: string;
    phone?: string;
    addressZip?: string;
    addressStreet?: string;
    addressNumber?: string;
    addressComplement?: string;
    addressDistrict?: string;
    addressCity?: string;
    addressState?: string;
    address: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bankName?: string;
    bankAgency?: string;
    bankAccount?: string;
    bankAccountType?: string;
    dependentsCount?: number;
    dependentsNotes?: string;
    
    clientId: string;
    createdAt: string;
    updatedAt: string;
}

export interface HRRequest {
    id: string;
    employeeId: string;
    companyId: string;
    type: HRRequestType;
    status: HRRequestStatus;
    details: any; // Campos específicos por tipo (json)
    clientId: string;
    createdAt: string;
    updatedAt: string;
}

// --- REST OF TYPES ---

export interface InterCredentials {
  clientId: string;
  clientSecret: string;
  certificateUploaded: boolean;
  pixKey: string;
}

export interface PaymentConfig {
  environment: 'sandbox' | 'production';
  enablePix: boolean;
  enableGateway: boolean;
  inter: InterCredentials;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: Role;
  text: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  contact: string;
  legalName?: string;
  tradeName?: string;
  nickname?: string;
  active?: boolean;
  taxRegime?: string;
  companyGroup?: string;
  honorarium?: string;
  companyCode?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressZip?: string;
  addressDistrict?: string;
  addressCity?: string;
  addressState?: string;
  stateRegistration?: string;
  stateRegistrationDate?: string;
  stateRegistrationUf?: string;
  stateExempt?: boolean;
  nire?: string;
  otherIdentifiers?: string;
  phones?: string;
  website?: string;
  municipalRegistration?: string;
  municipalRegistrationDate?: string;
  notes?: string;
  tags?: string;
  contacts?: Array<{
    id: string;
    name: string;
    role?: string;
    phone?: string;
    email?: string;
  }>;
  obligations?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  companyId?: string;
  photoUrl?: string;
  address?: string;
  phone?: string;
  cpf?: string;
  employeeId?: string;
}

export interface RequestAttachment {
  id: string;
  name: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
  entityType?: 'request' | 'admission' | 'hr_request' | 'notification' | 'employee_photo' | 'payroll' | 'time_sheet' | 'monthly_routine' | 'document';
  entityId?: string;
}

export interface Document {
  id: string;
  title: string;
  category: DocCategory;
  date: string;
  companyId: string;
  url?: string;
  status: DocStatus;
  paymentStatus: PaymentStatus; 
  amount?: number;
  competence?: string; 
  attachments?: RequestAttachment[];
  chat: ChatMessage[];
  auditLog: AuditLog[];
}

export interface ServiceRequest {
  id: string;
  protocol: string;
  title: string;
  type: string;
  price: number;
  description: string;
  status: RequestStatus;
  paymentStatus: RequestPaymentStatus;
  txid?: string;
  pixCopiaECola?: string;
  pixExpiration?: string;
  clientId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  attachments: RequestAttachment[];
  chat: ChatMessage[];
  auditLog: AuditLog[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface Routine {
  id: string;
  title: string;
  clientName: string;
  department: Department;
  deadline: string;
  status: string;
  competence: string;
}

export type RoutineStatus = 'Pendente' | 'Concluido' | 'Atrasado' | 'Em Analise';

export interface ObligationDefinition {
  id: string;
  name: string;
  nickname?: string;
  department?: string;
  responsible?: string;
  expectedMinutes?: number;
  monthlyDue?: Record<string, string>;
  reminderDays?: number;
  reminderType?: string;
  nonBusinessRule?: string;
  saturdayBusiness?: boolean;
  competenceRule?: string;
  requiresRobot?: boolean;
  hasFine?: boolean;
  alertGuide?: boolean;
  active?: boolean;
}

export interface MonthlyRoutine {
  id: string;
  companyId: string;
  companyName: string;
  obligationId: string;
  obligationName: string;
  department?: string;
  competence: string;
  deadline: string;
  status: RoutineStatus;
  updatedAt?: string;
  createdAt?: string;
}
