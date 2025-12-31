
import React, { useState, useEffect } from 'react';
import { 
    getEmployees, getHRAdmissions, getHRRequests, getWorkSites, getFieldFeedback,
    addHRAdmission, updateHRAdmission, addHRRequest, updateHRRequest, addFieldFeedback,
    addWorkSite, updateEmployee, resolveFieldFeedback, getHrAttachments, uploadHrAttachment, getEmployeePhotos, getApiUrl,
    getTimeSheets, updateTimeSheet, getEmployeePayrolls, addPayroll
} from '../services/mockData';
import { 
    UserPlus, FolderOpen, AlertTriangle, UploadCloud, 
    ArrowLeft, Users, Calendar, Briefcase, Paperclip, ChevronRight, CheckCircle, 
    XCircle, Clock, Search, MapPin, Info, FileCheck, UserMinus, Plus, Clipboard, FileText
} from 'lucide-react';
import { 
    Role, Employee, HRAdmission, HRRequest, WorkSite, HRAdmissionStatus, 
    HRRequestStatus, HRRequestType, HRFieldFeedback, TimeSheet 
} from '../types';

interface HRManagementProps {
  role: Role;
  currentUser: { id: string; name: string };
  currentCompanyId: string;
  initialTab?: 'employees' | 'inactive' | 'admissions' | 'requests' | 'sites' | 'timesheets';
}

interface AdmissionInputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string | number;
  disabled: boolean;
  errorMessage?: string;
  showFeedbackButton: boolean;
  onFeedback: () => void;
  onChange: (value: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  id?: string;
  onBlur?: () => void;
  transformUppercase?: boolean;
}

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

const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const MARITAL_STATUS_OPTIONS = [
  'Solteiro(a)',
  'Casado(a)',
  'União Estável',
  'Divorciado(a)',
  'Separado(a)',
  'Viúvo(a)'
];

const NATIONALITY_OPTIONS = [
  'Brasileira',
  'Portuguesa',
  'Argentina',
  'Chilena',
  'Uruguaia',
  'Paraguaia',
  'Boliviana',
  'Peruana',
  'Colombiana',
  'Venezuelana',
  'Espanhola',
  'Italiana',
  'Alemã',
  'Americana',
  'Mexicana',
  'Outra'
];

const BANK_ACCOUNT_TYPES = [
  'Corrente',
  'Poupança',
  'Salário',
  'Pagamento',
  'Digital'
];

const DEPENDENT_RELATIONSHIPS = [
  'Cônjuge',
  'Filho(a)',
  'Enteado(a)',
  'Pai',
  'Mãe',
  'Sogro(a)',
  'Irmão(ã)',
  'Outro'
];

const CITIES_BY_UF: Record<string, string[]> = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Outra'],
  AL: ['Maceio', 'Arapiraca', 'Palmeira dos Indios', 'Outra'],
  AP: ['Macapa', 'Santana', 'Laranjal do Jari', 'Outra'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Outra'],
  BA: ['Salvador', 'Feira de Santana', 'Vitoria da Conquista', 'Outra'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Outra'],
  DF: ['Brasilia', 'Ceilandia', 'Taguatinga', 'Outra'],
  ES: ['Vitoria', 'Vila Velha', 'Serra', 'Outra'],
  GO: ['Goiania', 'Aparecida de Goiania', 'Anapolis', 'Outra'],
  MA: ['Sao Luis', 'Imperatriz', 'Caxias', 'Outra'],
  MT: ['Cuiaba', 'Varzea Grande', 'Rondonopolis', 'Outra'],
  MS: ['Campo Grande', 'Dourados', 'Tres Lagoas', 'Outra'],
  MG: ['Belo Horizonte', 'Uberlandia', 'Contagem', 'Outra'],
  PA: ['Belem', 'Ananindeua', 'Santarem', 'Outra'],
  PB: ['Joao Pessoa', 'Campina Grande', 'Santa Rita', 'Outra'],
  PR: ['Curitiba', 'Londrina', 'Maringa', 'Outra'],
  PE: ['Recife', 'Jaboatao', 'Olinda', 'Outra'],
  PI: ['Teresina', 'Parnaiba', 'Picos', 'Outra'],
  RJ: ['Rio de Janeiro', 'Niteroi', 'Duque de Caxias', 'Outra'],
  RN: ['Natal', 'Mossoro', 'Parnamirim', 'Outra'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Outra'],
  RO: ['Porto Velho', 'Ji-Parana', 'Ariquemes', 'Outra'],
  RR: ['Boa Vista', 'Rorainopolis', 'Caracarai', 'Outra'],
  SC: ['Florianopolis', 'Joinville', 'Blumenau', 'Outra'],
  SP: ['Sao Paulo', 'Campinas', 'Santos', 'Outra'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Outra'],
  TO: ['Palmas', 'Araguaina', 'Gurupi', 'Outra']
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const maskCpf = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  let out = digits;
  if (digits.length > 3) out = `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length > 6) out = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  if (digits.length > 9) out = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  return out;
};

const isValidCpf = (value: string) => {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  const calcCheck = (base: string, factor: number) => {
    let total = 0;
    for (let i = 0; i < base.length; i++) {
      total += parseInt(base[i], 10) * (factor - i);
    }
    const mod = (total * 10) % 11;
    return mod === 10 ? 0 : mod;
  };
  const d1 = calcCheck(digits.slice(0, 9), 10);
  const d2 = calcCheck(digits.slice(0, 10), 11);
  return digits[9] === String(d1) && digits[10] === String(d2);
};

const maskPhone = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const maskCep = (value: string) => {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

const AdmissionInputField: React.FC<AdmissionInputFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder = '',
  required = true,
  value,
  disabled,
  errorMessage,
  showFeedbackButton,
  onFeedback,
  onChange,
  inputMode,
  maxLength,
  id,
  onBlur,
  transformUppercase = true
}) => (
  <div className="relative">
    <label className={`block text-xs font-bold uppercase mb-1 ${errorMessage ? 'text-red-600' : 'text-slate-500'}`}>
      {label} {required && <span className="text-red-500">*</span>} {errorMessage && <AlertTriangle size={12} className="inline ml-1" />}
    </label>
    <input
      type={type}
      className={`w-full border rounded-lg p-2.5 text-sm transition-all outline-none 
        ${errorMessage ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}
      `}
      placeholder={placeholder}
      value={value}
      onChange={e => {
        const next = e.target.value;
        onChange(transformUppercase ? next.toUpperCase() : next);
      }}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      inputMode={inputMode}
      maxLength={maxLength}
      id={id}
      name={name}
      style={{ textTransform: transformUppercase ? 'uppercase' : 'none' }}
    />
    {errorMessage && (
      <p className="text-[10px] text-red-500 mt-1 font-medium">{errorMessage}</p>
    )}
    {showFeedbackButton && (
      <button
        onClick={onFeedback}
        className="absolute right-2 top-8 text-red-400 hover:text-red-600"
        title="Apontar Erro"
        type="button"
      >
        <AlertTriangle size={14} />
      </button>
    )}
  </div>
);

interface RequestInputFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string;
  disabled: boolean;
  errorMessage?: string;
  showFeedbackButton: boolean;
  onFeedback: () => void;
  onChange: (value: string) => void;
  transformUppercase?: boolean;
}

const RequestInputField: React.FC<RequestInputFieldProps> = ({
  label,
  name,
  type = 'text',
  required = false,
  value,
  disabled,
  errorMessage,
  showFeedbackButton,
  onFeedback,
  onChange,
  transformUppercase = true
}) => (
  <div className="relative">
    <label className={`block text-xs font-bold uppercase mb-1 ${errorMessage ? 'text-red-600' : 'text-slate-500'}`}>
      {label} {required && <span className="text-red-500">*</span>} {errorMessage && <AlertTriangle size={12} className="inline ml-1" />}
    </label>
    <input
      type={type}
      className={`w-full border rounded-lg p-2.5 text-sm transition-all outline-none ${errorMessage ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
      value={value}
      onChange={e => {
        const next = e.target.value;
        onChange(transformUppercase ? next.toUpperCase() : next);
      }}
      disabled={disabled}
      required={required}
      name={name}
      style={{ textTransform: transformUppercase ? 'uppercase' : 'none' }}
    />
    {errorMessage && (
      <p className="text-[10px] text-red-500 mt-1 font-medium">{errorMessage}</p>
    )}
    {showFeedbackButton && (
      <button
        onClick={onFeedback}
        className="absolute right-2 top-8 text-red-400 hover:text-red-600"
        title="Apontar Erro"
        type="button"
      >
        <AlertTriangle size={14} />
      </button>
    )}
  </div>
);

const HRManagement: React.FC<HRManagementProps> = ({ role, currentUser, currentCompanyId, initialTab = 'employees' }) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'inactive' | 'admissions' | 'requests' | 'sites' | 'timesheets'>(initialTab);
  const [view, setView] = useState<'list' | 'admission_form' | 'employee_details' | 'request_form' | 'request_details'>('list');
  
  // Data State (Mocking current company)
  const companyId = currentCompanyId; 
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admissions, setAdmissions] = useState<HRAdmission[]>([]);
  const [hrRequests, setHrRequests] = useState<HRRequest[]>([]);
  const [timeSheets, setTimeSheets] = useState<TimeSheet[]>([]);
  const [sites, setSites] = useState<WorkSite[]>([]);
  
  // Selection
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<HRRequest | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>({});
  const [attachmentsTick, setAttachmentsTick] = useState(0);
  const [selectedType, setSelectedType] = useState<HRRequestType>('F\u00e9rias');
  
  // Feedback System
  const [feedbackField, setFeedbackField] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackTargetId, setFeedbackTargetId] = useState<string | null>(null);

  // Form State for Admission
  const [formAdmission, setFormAdmission] = useState<Partial<HRAdmission>>({});
  const [pendingAdmissionFiles, setPendingAdmissionFiles] = useState<{ docId: string; file: File }[]>([]);
  const [pendingRequestFiles, setPendingRequestFiles] = useState<{ docId: string; file: File }[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [dependents, setDependents] = useState<{ id: string; name: string; birthDate: string; cpf: string; relationship: string }[]>([]);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [stepError, setStepError] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState('Todos');
  const [inactiveStatusFilter, setInactiveStatusFilter] = useState('Todos');
  const [admissionStatusFilter, setAdmissionStatusFilter] = useState('Todos');
  const [requestStatusFilter, setRequestStatusFilter] = useState('Todos');
  const [requestTypeFilter, setRequestTypeFilter] = useState('Todos');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [inactiveSearch, setInactiveSearch] = useState('');
  const [admissionSearch, setAdmissionSearch] = useState('');
  const [requestSearch, setRequestSearch] = useState('');
  const [employeeUpdateNotice, setEmployeeUpdateNotice] = useState('');
  const [payrollCompetence, setPayrollCompetence] = useState('');
  const [payrollUploadError, setPayrollUploadError] = useState('');

  const parseDependentsFromNotes = (notes?: string) => {
    if (!notes) return [];
    try {
      const parsed = JSON.parse(notes);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).map((d) => ({
          id: d.id || createId(),
          name: d.name || '',
          birthDate: d.birthDate || '',
          cpf: d.cpf || '',
          relationship: d.relationship || ''
        }));
      }
      return [];
    } catch {
      return [];
    }
  };

  const computeVacationWindow = (request: HRRequest) => {
      const start = request.details?.startDate;
      const days = Number(request.details?.days || 0);
      if (!start || Number.isNaN(days) || days <= 0) return null;
      const startDate = new Date(start);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + days - 1);
      return { startDate, endDate };
  };

  const syncEmployeeVacationStatus = async (employeesList: Employee[], requestsList: HRRequest[]) => {
      const today = new Date();
      const updates: Employee[] = [];
      for (const emp of employeesList) {
          if (emp.status === 'Inativo' || emp.status === 'Desligado') continue;
          const vacations = requestsList
              .filter(r => r.employeeId === emp.id && r.type === 'F\u00e9rias' && r.status === 'Agendado')
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          const active = vacations.find(v => {
              const window = computeVacationWindow(v);
              if (!window) return false;
              return today >= window.startDate && today <= window.endDate;
          });
          const nextStatus = active ? 'Gozando F\u00e9rias' : 'Ativo';
          if (emp.status !== nextStatus) {
              updates.push({ ...emp, status: nextStatus });
          }
      }
      if (updates.length > 0) {
          await Promise.all(updates.map(updateEmployee));
      }
  };

  const refreshData = async () => {
    const nextEmployees = getEmployees(companyId);
    const nextAdmissions = getHRAdmissions(companyId);
    const nextRequests = getHRRequests(companyId);
    setEmployees(nextEmployees);
    setAdmissions(nextAdmissions);
    setHrRequests(nextRequests);
    setTimeSheets(getTimeSheets(companyId));
    setSites(getWorkSites(companyId));
    await syncEmployeeVacationStatus(nextEmployees, nextRequests);
  };

  useEffect(() => {
    refreshData();
  }, [companyId]);

  useEffect(() => {
    setActiveTab(initialTab);
    setView('list');
  }, [initialTab]);

  useEffect(() => {
    refreshData();
  }, [view, activeTab]);

  useEffect(() => {
    if (view === 'admission_form') {
        if (selectedItem) {
            const toDateInput = (value?: string) => {
                if (!value) return '';
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) return value;
                return date.toISOString().slice(0, 10);
            };
            setFormAdmission({
                ...selectedItem,
                birthDate: toDateInput(selectedItem.birthDate),
                expectedStartDate: toDateInput(selectedItem.expectedStartDate)
            });
        } else {
            setFormAdmission({});
        }
        setCurrentStep(0);
        const nextDeps = selectedItem ? parseDependentsFromNotes(selectedItem.dependentsNotes) : [];
        setDependents(nextDeps);
    }
  }, [view, selectedItem]);

  useEffect(() => {
    if (view === 'request_form' || view === 'request_details') {
        setRequestDetails(selectedRequest?.details || {});
    }
  }, [view, selectedRequest]);

  useEffect(() => {
    if (view !== 'admission_form') return;
    setFormAdmission((prev) => ({
      ...prev,
      dependentsCount: dependents.length || undefined,
      dependentsNotes: dependents.length ? JSON.stringify(dependents) : undefined
    }));
  }, [dependents, view]);

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'Finalizado': case 'Validado': case 'Agendado': case 'Ativo': return 'bg-emerald-100 text-emerald-700';
        case 'Cancelado': case 'Inativo': case 'Desligado': return 'bg-slate-200 text-slate-600';
        case 'Formulario com Erro': case 'Pendencia': return 'bg-red-100 text-red-700';
        case 'Novo': case 'Solicitado': return 'bg-blue-100 text-blue-700';
        case 'Validando': case 'Em Analise': case 'Enviado': return 'bg-amber-100 text-amber-700';
        case 'Aprovado': case 'Assinado': return 'bg-emerald-100 text-emerald-700';
        case 'Gozando F\u00e9rias': return 'bg-indigo-100 text-indigo-700';
        default: return 'bg-slate-100 text-slate-600';
    }
  };

  const ADMISSION_DOCS = [
      { id: 'rg', label: 'RG (frente e verso)', required: true },
      { id: 'cpf', label: 'CPF', required: true },
      { id: 'pis', label: 'Cartao PIS', required: false },
      { id: 'ctps', label: 'CTPS Digital ou fisica', required: false },
      { id: 'titulo', label: 'Título de Eleitor', required: false },
      { id: 'reservista', label: 'Certificado de Reservista', required: false },
      { id: 'endereco', label: 'Comprovante de Residencia', required: true },
      { id: 'estado_civil', label: 'Certidao (Nascimento/Casamento)', required: false },
      { id: 'dependentes', label: 'Documentos de Dependentes', required: false },
      { id: 'banco', label: 'Dados Bancarios (comprovante)', required: false },
      { id: 'exame', label: 'Exame Admissional', required: false },
      { id: 'foto_perfil', label: 'Foto de Perfil do Funcionário', required: false }
  ];

  type RequestDocConfig = {
      id: string;
      label: string;
      required: boolean;
      adminOnly?: boolean;
      clientOnly?: boolean;
      requiresTerminationType?: string;
  };

  const REQUEST_DOCS: Record<HRRequestType, RequestDocConfig[]> = {
      'F\u00e9rias': [
          { id: 'extrato_ferias', label: 'Extrato/Comunicado de Férias', required: true, adminOnly: true }
      ],
      'Atestado': [
          { id: 'atestado', label: 'Atestado Medico (CRM e assinatura)', required: true, clientOnly: true }
      ],
      'Demiss\u00e3o': [
          { id: 'carta_pedido', label: 'Carta de Pedido de Demissão (manuscrita)', required: true, clientOnly: true, requiresTerminationType: 'Pedido de Demissão' },
          { id: 'trct', label: 'TRCT', required: true, adminOnly: true },
          { id: 'ficha_empregado', label: 'Ficha do Empregado', required: true, adminOnly: true },
          { id: 'chave_fgts', label: 'Chave do FGTS', required: true, adminOnly: true },
          { id: 'seguro_desemprego', label: 'Guia do Seguro Desemprego', required: true, adminOnly: true }
      ],
      'Inclus\u00e3o Dependente': [
          { id: 'dependente', label: 'Documentos do Dependente', required: false, clientOnly: true }
      ],
      'Atualiza\u00e7\u00e3o Cadastro': [
          { id: 'atualizacao', label: 'Documentos/Comprovantes da Atualizacao', required: false, clientOnly: true }
      ]
  };

  const parseAttachmentName = (name: string) => {
      const parts = name.split('::');
      if (parts.length > 1) {
          return { docId: parts[0], displayName: parts.slice(1).join('::') };
      }
      return { docId: 'outros', displayName: name };
  };

  const getFileBadge = (fileName: string) => {
      const ext = fileName.split('.').pop()?.toUpperCase() || 'ARQ';
      return ext.length > 6 ? 'ARQ' : ext;
  };

  const resolveAttachmentUrl = (url: string) => {
      const resolved = url.startsWith('http') ? url : `${getApiUrl()}${url}`;
      try {
          return encodeURI(resolved);
      } catch {
          return resolved;
      }
  };

  const getAttachmentDownloadUrl = (id: string) => `${getApiUrl()}/hr/attachment/file/${id}`;

  const getAdmissionPhotoUrl = (admissionId?: string) => {
      if (!admissionId) return '';
      const attachments = getHrAttachments('admission', admissionId);
      const photo = attachments.find((att) => parseAttachmentName(att.name).docId === 'foto_perfil');
      return photo ? getAttachmentDownloadUrl(photo.id) : '';
  };

  const getEmployeePhotoUrl = (employee?: Employee) => {
      if (!employee) return '';
      const photos = getEmployeePhotos(employee.id)
          .slice()
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      if (photos.length > 0) return getAttachmentDownloadUrl(photos[0].id);
      const admission = admissions
          .filter(a => a.companyId === employee.companyId && (a.cpf === employee.cpf || a.fullName === employee.name))
          .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
      return getAdmissionPhotoUrl(admission?.id);
  };

  // --- ACTIONS ---
  const normalizeAdmissionValue = (value: unknown) => {
      if (value === '') return undefined;
      return value;
  };

  const normalizeAdmissionUf = (value: unknown) => {
      if (value === '' || value === undefined || value === null) return undefined;
      const normalized = String(value).trim().toUpperCase();
      return normalized ? normalized.slice(0, 2) : undefined;
  };

  const normalizeAdmissionNumber = (value: unknown) => {
      if (value === '' || value === undefined || value === null) return undefined;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
  };

  const buildAdmissionDraft = () => ({
      ...formAdmission,
      workSiteId: normalizeAdmissionValue(formAdmission.workSiteId),
      rg: normalizeAdmissionValue(formAdmission.rg),
      birthDate: normalizeAdmissionValue(formAdmission.birthDate),
      birthCity: normalizeAdmissionValue(formAdmission.birthCity),
      birthState: normalizeAdmissionUf(formAdmission.birthState),
      nationality: normalizeAdmissionValue(formAdmission.nationality),
      motherName: normalizeAdmissionValue(formAdmission.motherName),
      fatherName: normalizeAdmissionValue(formAdmission.fatherName),
      educationLevel: normalizeAdmissionValue(formAdmission.educationLevel),
      gender: normalizeAdmissionValue(formAdmission.gender),
      maritalStatus: normalizeAdmissionValue(formAdmission.maritalStatus),
      role: normalizeAdmissionValue(formAdmission.role),
      contractType: normalizeAdmissionValue(formAdmission.contractType),
      weeklyHours: normalizeAdmissionNumber(formAdmission.weeklyHours),
      shift: normalizeAdmissionValue(formAdmission.shift),
      salary: normalizeAdmissionNumber(formAdmission.salary),
      expectedStartDate: normalizeAdmissionValue(formAdmission.expectedStartDate),
      pis: normalizeAdmissionValue(formAdmission.pis),
      tituloEleitor: normalizeAdmissionValue(formAdmission.tituloEleitor),
      tituloEleitorZone: normalizeAdmissionValue(formAdmission.tituloEleitorZone),
      tituloEleitorSection: normalizeAdmissionValue(formAdmission.tituloEleitorSection),
      ctps: normalizeAdmissionValue(formAdmission.ctps),
      ctpsSeries: normalizeAdmissionValue(formAdmission.ctpsSeries),
      ctpsUf: normalizeAdmissionUf(formAdmission.ctpsUf),
      reservista: normalizeAdmissionValue(formAdmission.reservista),
      email: normalizeAdmissionValue(formAdmission.email),
      phone: normalizeAdmissionValue(formAdmission.phone),
      addressZip: normalizeAdmissionValue(formAdmission.addressZip),
      addressStreet: normalizeAdmissionValue(formAdmission.addressStreet),
      addressNumber: normalizeAdmissionValue(formAdmission.addressNumber),
      addressComplement: normalizeAdmissionValue(formAdmission.addressComplement),
      addressDistrict: normalizeAdmissionValue(formAdmission.addressDistrict),
      addressCity: normalizeAdmissionValue(formAdmission.addressCity),
      addressState: normalizeAdmissionUf(formAdmission.addressState),
      address: normalizeAdmissionValue(formAdmission.address),
      emergencyContactName: normalizeAdmissionValue(formAdmission.emergencyContactName),
      emergencyContactPhone: normalizeAdmissionValue(formAdmission.emergencyContactPhone),
      bankName: normalizeAdmissionValue(formAdmission.bankName),
      bankAgency: normalizeAdmissionValue(formAdmission.bankAgency),
      bankAccount: normalizeAdmissionValue(formAdmission.bankAccount),
      bankAccountType: normalizeAdmissionValue(formAdmission.bankAccountType),
      dependentsCount: normalizeAdmissionNumber(formAdmission.dependentsCount),
      dependentsNotes: normalizeAdmissionValue(formAdmission.dependentsNotes)
  });

  const handleCreateAdmission = async () => {
      const admissionId = createId();
      const payload: HRAdmission = {
          ...buildAdmissionDraft(),
          id: admissionId,
          companyId,
          clientId: currentUser.id,
          status: 'Novo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      } as HRAdmission;

      try {
          await addHRAdmission(payload);
      } catch (e: any) {
          alert(`Falha ao enviar solicitacao: ${e.message || 'erro inesperado'}`);
          return;
      }
      if (pendingAdmissionFiles.length > 0) {
          await Promise.all(pendingAdmissionFiles.map(item => 
              uploadHrAttachment({
                  file: item.file,
                  entityType: 'admission',
                  entityId: admissionId,
                  uploadedBy: currentUser.id,
                  name: `${item.docId}::${item.file.name}`
              })
          ));
          setPendingAdmissionFiles([]);
          setAttachmentsTick((prev) => prev + 1);
      }
      alert('Solicitação de admissão enviada com sucesso!');
      setView('list');
      setActiveTab('admissions');
      refreshData();
  };

  const handleUpdateAdmission = async (updated: HRAdmission) => {
      try {
          await updateHRAdmission(updated);
          refreshData();
      } catch (e: any) {
          alert(`Falha ao atualizar admissão: ${e.message || 'erro inesperado'}`);
      }
  };

  const formatPeriod = (sheet: TimeSheet) => {
      const start = sheet.periodStart ? new Date(sheet.periodStart).toLocaleDateString() : '-';
      const end = sheet.periodEnd ? new Date(sheet.periodEnd).toLocaleDateString() : '-';
      return `${start} a ${end}`;
  };

  const applyAdmissionStatus = async (adm: HRAdmission, status: HRAdmissionStatus, message?: string) => {
      const updated = buildAdmissionPayload(adm, status) as HRAdmission;
      await handleUpdateAdmission(updated);
      setSelectedItem(updated);
      setFormAdmission(updated);
      if (message) alert(message);
  };

  const buildAdmissionPayload = (adm: HRAdmission, status?: HRAdmissionStatus) => ({
      ...adm,
      ...buildAdmissionDraft(),
      status: status || adm.status,
      updatedAt: new Date().toISOString()
  });

  const handleAdmissionFileSelect = async (docId: string, file: File, admissionId?: string) => {
      const name = `${docId}::${file.name}`;
      if (admissionId) {
          await uploadHrAttachment({
              file,
              entityType: 'admission',
              entityId: admissionId,
              uploadedBy: currentUser.id,
              name
          });
          setAttachmentsTick((prev) => prev + 1);
      } else {
          setPendingAdmissionFiles((prev) => [...prev, { docId, file }]);
      }
  };

  const handlePayrollUpload = async (employee: Employee, competence: string, file: File) => {
      if (!competence) {
          setPayrollUploadError('Informe a competência (YYYY-MM).');
          return;
      }
      setPayrollUploadError('');
      const payrollId = createId();
      const payload = {
          id: payrollId,
          employeeId: employee.id,
          companyId: employee.companyId,
          competence,
          status: 'Disponivel',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };
      await addPayroll(payload);
      await uploadHrAttachment({
          file,
          entityType: 'payroll',
          entityId: payrollId,
          uploadedBy: currentUser.id,
          name: `holerite::${file.name}`
      });
      setPayrollCompetence('');
      refreshData();
  };

  const handleRequestFileSelect = async (docId: string, file: File, requestId?: string) => {
      const name = `${docId}::${file.name}`;
      if (requestId) {
          await uploadHrAttachment({
              file,
              entityType: 'hr_request',
              entityId: requestId,
              uploadedBy: currentUser.id,
              name
          });
          setAttachmentsTick((prev) => prev + 1);
      } else {
          setPendingRequestFiles((prev) => [...prev, { docId, file }]);
      }
  };

  const getRequestEmployee = (req?: HRRequest) => {
      if (req) return employees.find(e => e.id === req.employeeId);
      return selectedItem as Employee;
  };

  const handleSubmitRequest = async () => {
      const currentEmployee = getRequestEmployee(selectedRequest || undefined);
      if (!currentEmployee) return;
      const requestId = selectedRequest?.id || createId();
      const currentType = selectedRequest?.type || selectedType;
      const payload: HRRequest = {
          id: requestId,
          employeeId: currentEmployee.id,
          companyId,
          type: currentType,
          status: role === 'client' ? 'Solicitado' : (selectedRequest?.status || 'Solicitado'),
          details: requestDetails,
          clientId: selectedRequest?.clientId || currentUser.id,
          createdAt: selectedRequest?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
      };

      if (selectedRequest) {
          await updateHRRequest(payload);
      } else {
          await addHRRequest(payload);
      }

      if (pendingRequestFiles.length > 0) {
          await Promise.all(pendingRequestFiles.map(item => 
              uploadHrAttachment({
                  file: item.file,
                  entityType: 'hr_request',
                  entityId: requestId,
                  uploadedBy: currentUser.id,
                  name: `${item.docId}::${item.file.name}`
              })
          ));
          setPendingRequestFiles([]);
          setAttachmentsTick((prev) => prev + 1);
      }

      alert('Solicitação registrada com sucesso!');
      setView('list');
      setSelectedRequest(null);
      setSelectedItem(null);
      refreshData();
  };

  const handleUpdateRequestStatus = async (req: HRRequest, status: HRRequestStatus) => {
      const updated = { ...req, status, updatedAt: new Date().toISOString() };
      await updateHRRequest(updated);
      const targetEmployee = employees.find(e => e.id === req.employeeId);
      if (targetEmployee) {
          if (req.type === 'Demiss\u00e3o' && status === 'Finalizado') {
              await updateEmployee({ ...targetEmployee, status: 'Desligado' });
          }
          if (req.type === 'F\u00e9rias' && status === 'Agendado') {
              const window = computeVacationWindow(updated);
              if (window) {
                  const today = new Date();
                  const nextStatus = today >= window.startDate && today <= window.endDate ? 'Gozando F\u00e9rias' : 'Ativo';
                  await updateEmployee({ ...targetEmployee, status: nextStatus });
              }
          }
          if (status === 'Finalizado') {
              if (req.type === 'Inclus\u00e3o Dependente') {
                  const admission = admissions
                      .filter(a => a.companyId === targetEmployee.companyId && (a.cpf === targetEmployee.cpf || a.fullName === targetEmployee.name))
                      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
                  if (admission) {
                      const existing = parseDependentsFromNotes(admission.dependentsNotes);
                      const nextDependent = {
                          id: createId(),
                          name: req.details?.dependentName || 'Dependente',
                          birthDate: req.details?.dependentBirthDate || '',
                          cpf: req.details?.dependentCpf || '',
                          relationship: req.details?.dependentRelationship || ''
                      };
                      const merged = [...existing, nextDependent];
                      await updateHRAdmission({ ...admission, dependentsNotes: JSON.stringify(merged) });
                  }
              }
              if (req.type === 'Atualiza\u00e7\u00e3o Cadastro') {
                  const updates = Array.isArray(req.details?.updates) ? req.details.updates : [];
                  let updatedEmp = { ...targetEmployee };
                  for (const item of updates) {
                      if (!item?.field) continue;
                      const value = item.value || '';
                      switch (item.field) {
                          case 'Nome':
                              updatedEmp = { ...updatedEmp, name: value || updatedEmp.name };
                              break;
                          case 'CPF':
                              updatedEmp = { ...updatedEmp, cpf: value || updatedEmp.cpf };
                              break;
                          case 'RG':
                              updatedEmp = { ...updatedEmp, rg: value || updatedEmp.rg };
                              break;
                          case 'PIS':
                              updatedEmp = { ...updatedEmp, pis: value || updatedEmp.pis };
                              break;
                          case 'Cargo':
                              updatedEmp = { ...updatedEmp, role: value || updatedEmp.role };
                              break;
                          case 'Sal\u00e1rio':
                              updatedEmp = { ...updatedEmp, salary: value ? Number(value) : updatedEmp.salary };
                              break;
                          case 'Email':
                              updatedEmp = { ...updatedEmp, email: value || updatedEmp.email };
                              break;
                          case 'Telefone':
                              updatedEmp = { ...updatedEmp, phone: value || updatedEmp.phone };
                              break;
                          case 'Posto/Setor':
                              updatedEmp = { ...updatedEmp, workSiteId: value || updatedEmp.workSiteId };
                              break;
                          default:
                              break;
                      }
                  }
                  await updateEmployee(updatedEmp);
                  const admission = admissions
                      .filter(a => a.companyId === targetEmployee.companyId && (a.cpf === targetEmployee.cpf || a.fullName === targetEmployee.name))
                      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
                  if (admission) {
                      const updates = Array.isArray(req.details?.updates) ? req.details.updates : [];
                      let updatedAdmission: HRAdmission = { ...admission };
                      for (const item of updates) {
                          if (!item?.field) continue;
                          const value = item.value || '';
                          switch (item.field) {
                              case 'Endereço':
                                  updatedAdmission = { ...updatedAdmission, address: value };
                                  break;
                              case 'Banco':
                                  updatedAdmission = { ...updatedAdmission, bankName: value };
                                  break;
                              case 'Agência':
                                  updatedAdmission = { ...updatedAdmission, bankAgency: value };
                                  break;
                              case 'Conta':
                                  updatedAdmission = { ...updatedAdmission, bankAccount: value };
                                  break;
                              case 'Tipo de Conta':
                                  updatedAdmission = { ...updatedAdmission, bankAccountType: value };
                                  break;
                              case 'CTPS':
                                  updatedAdmission = { ...updatedAdmission, ctps: value };
                                  break;
                              case 'Título Eleitor':
                                  updatedAdmission = { ...updatedAdmission, tituloEleitor: value };
                                  break;
                              default:
                                  break;
                          }
                      }
                      await updateHRAdmission(updatedAdmission);
                  }
              }
          }
      }
      setSelectedRequest(updated);
      refreshData();
  };

  const handleFinalizeAdmission = async (adm: HRAdmission) => {
      // Finish Admission
      await updateHRAdmission({...adm, status: 'Finalizado'});
      alert('Funcionário registrado com sucesso!');
      setView('list');
      setActiveTab('employees');
      refreshData();
  };

  const handleCepLookup = async () => {
      const cepDigits = onlyDigits(String(formAdmission.addressZip || ''));
      if (cepDigits.length !== 8) return;
      setIsCepLoading(true);
      try {
          const res = await fetch(`${getApiUrl()}/cep/${cepDigits}`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.erro) return;
          setFormAdmission((prev) => ({
              ...prev,
              addressStreet: data.logradouro || prev.addressStreet || '',
              addressDistrict: data.bairro || prev.addressDistrict || '',
              addressCity: data.localidade || prev.addressCity || '',
              addressState: data.uf || prev.addressState || ''
          }));
          setTimeout(() => {
              const numberInput = document.getElementById('addressNumber') as HTMLInputElement | null;
              if (numberInput) numberInput.focus();
          }, 50);
      } catch {
          // ignore CEP lookup errors
      } finally {
          setIsCepLoading(false);
      }
  };

  // --- RENDERS ---

  const renderEmployeeDetails = (emp: Employee) => {
    const admissionForAttachments = admissions
        .filter(a => a.companyId === emp.companyId && (a.cpf === emp.cpf || a.fullName === emp.name))
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())[0];
    const admissionAttachments = admissionForAttachments ? getHrAttachments('admission', admissionForAttachments.id) : [];
    const dependentsList = parseDependentsFromNotes(emp.dependentsNotes);
    const latestPhotoUrl = getEmployeePhotoUrl(emp);
    const formatValue = (value: any) => (value === undefined || value === null || value === '' ? '-' : value);
    const renderItem = (label: string, value: React.ReactNode) => (
        <div className="p-3 bg-slate-50 rounded">
            <span className="text-xs text-slate-400 block">{label}</span>
            <span className="font-medium text-slate-700">{formatValue(value)}</span>
        </div>
    );
    const handleEmployeeUpdate = async (updates: Partial<Employee>) => {
        const nextEmployee = { ...emp, ...updates };
        await updateEmployee(nextEmployee);
        setEmployees((prev) => prev.map((item) => item.id === nextEmployee.id ? nextEmployee : item));
        setSelectedItem(nextEmployee);
        setEmployeeUpdateNotice('Atualizacao realizada.');
        setTimeout(() => setEmployeeUpdateNotice(''), 2500);
        refreshData();
    };

    return (
    <div className="space-y-6 animate-fadeIn">
        <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
            <ArrowLeft size={16}/> Voltar
        </button>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                    {latestPhotoUrl ? (
                        <img src={latestPhotoUrl} alt={emp.name} className="w-20 h-20 rounded-full object-cover border border-slate-200" />
                    ) : (
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                            {emp.name.substring(0,2).toUpperCase()}
                        </div>
                    )}
                    {role === 'admin' && (
                        <div>
                            <input
                                id={`employee-photo-${emp.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                    const input = e.currentTarget;
                                    const file = input.files?.[0];
                                    if (!file) return;
                                    input.value = '';
                                    await uploadHrAttachment({
                                        file,
                                        entityType: 'employee_photo',
                                        entityId: emp.id,
                                        uploadedBy: currentUser.id,
                                        name: file.name
                                    });
                                    setAttachmentsTick((prev) => prev + 1);
                                    refreshData();
                                }}
                            />
                            <label htmlFor={`employee-photo-${emp.id}`} className="text-[10px] font-bold text-blue-600 cursor-pointer hover:underline">
                                Atualizar foto
                            </label>
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{emp.name}</h2>
                    <p className="text-slate-500 flex items-center gap-2">
                        <Briefcase size={14}/> {emp.role} - {sites.find(s => s.id === emp.workSiteId)?.name || 'Sem Posto'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(emp.status)}`}>{emp.status}</span>
                <p className="text-xs text-slate-400 mt-1">Admissao: {new Date(emp.admissionDate).toLocaleDateString()}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Info size={18}/> Resumo do Funcionário</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {renderItem('CPF', emp.cpf)}
                        {renderItem('RG', emp.rg)}
                        {renderItem('PIS', emp.pis)}
                        {renderItem('Salario', `R$ ${emp.salary.toLocaleString('pt-BR')}`)}
                        {renderItem('Próximas Férias', emp.vacationDue ? new Date(emp.vacationDue).toLocaleDateString() : '-')}
                        {renderItem('E-mail', emp.email)}
                        {renderItem('Telefone', emp.phone)}
                        {renderItem('Data de Admissão', new Date(emp.admissionDate).toLocaleDateString())}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserPlus size={18}/> Dados do Funcionário</h3>

                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Dados Pessoais</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {renderItem('Nome Completo', emp.name)}
                                {renderItem('CPF', emp.cpf)}
                                {renderItem('RG', emp.rg)}
                                {renderItem('Data de Nascimento', emp.birthDate ? new Date(emp.birthDate).toLocaleDateString() : '-')}
                                {renderItem('Naturalidade', emp.birthCity ? `${emp.birthCity}${emp.birthState ? `/${emp.birthState}` : ''}` : '-')}
                                {renderItem('Nacionalidade', emp.nationality)}
                        {renderItem('Gênero', emp.gender)}
                                {renderItem('Estado Civil', emp.maritalStatus)}
                                {renderItem('Escolaridade', emp.educationLevel)}
                        {renderItem('Nome da Mãe', emp.motherName)}
                                {renderItem('Nome do Pai', emp.fatherName)}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Dados Contratuais</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {renderItem('Cargo', emp.role)}
                                {renderItem('Posto/Setor', sites.find(s => s.id === emp.workSiteId)?.name || 'Sem Posto')}
                                {renderItem('Tipo de Contrato', emp.contractType)}
                        {renderItem('Carga Horária Semanal', emp.weeklyHours ? `${emp.weeklyHours}h` : '-')}
                                {renderItem('Turno', emp.shift)}
                        {renderItem('Salário', emp.salary ? `R$ ${emp.salary.toLocaleString('pt-BR')}` : '-')}
                        {renderItem('Previsão de Início', emp.expectedStartDate ? new Date(emp.expectedStartDate).toLocaleDateString() : '-')}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Documentação</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {renderItem('PIS', emp.pis)}
                                {renderItem('CTPS', `${emp.ctps || '-'} ${emp.ctpsSeries ? `S${emp.ctpsSeries}` : ''} ${emp.ctpsUf ? `/${emp.ctpsUf}` : ''}`)}
                                {renderItem('Título de Eleitor', `${emp.tituloEleitor || '-'} ${emp.tituloEleitorZone ? `Z${emp.tituloEleitorZone}` : ''} ${emp.tituloEleitorSection ? `S${emp.tituloEleitorSection}` : ''}`)}
                                {renderItem('Reservista', emp.reservista)}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Endereço</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {renderItem('CEP', emp.addressZip)}
                                {renderItem('Rua', emp.addressStreet)}
                                {renderItem('Número', emp.addressNumber)}
                                {renderItem('Complemento', emp.addressComplement)}
                                {renderItem('Bairro', emp.addressDistrict)}
                                {renderItem('Cidade', emp.addressCity)}
                                {renderItem('UF', emp.addressState)}
                                {renderItem('Endereço Completo', emp.addressStreet ? `${emp.addressStreet}, ${emp.addressNumber || 's/n'} - ${emp.addressDistrict || ''}` : emp.address)}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Dados Bancários</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {renderItem('Banco', emp.bankName)}
                                {renderItem('Agência', emp.bankAgency)}
                                {renderItem('Conta', emp.bankAccount)}
                                {renderItem('Tipo de Conta', emp.bankAccountType)}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Contato de Emergência</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {renderItem('Nome', emp.emergencyContactName)}
                                {renderItem('Telefone', emp.emergencyContactPhone)}
                            </div>
                        </div>

                        {dependentsList.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold mb-2">Dependentes</p>
                                <div className="space-y-2 text-xs">
                                    {dependentsList.map(dep => (
                                        <div key={dep.id} className="p-3 bg-slate-50 rounded flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold text-slate-700">{dep.name || 'Dependente'}</span>
                                            <span className="text-slate-500">{dep.relationship || '-'}</span>
                                            <span className="text-slate-500">{dep.birthDate ? new Date(dep.birthDate).toLocaleDateString() : '-'}</span>
                                            <span className="text-slate-500">{dep.cpf || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                {admissionAttachments.length > 0 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Paperclip size={18}/> Anexos da Admissão</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {admissionAttachments.map(att => {
                                const parsed = parseAttachmentName(att.name);
                                const badge = getFileBadge(parsed.displayName);
                                return (
                                    <a
                                        key={att.id}
                                        href={getAttachmentDownloadUrl(att.id)}
                                        target="_blank"
                                        className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {badge}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate">{parsed.displayName}</p>
                                                <p className="text-[10px] text-slate-400">Clique para abrir</p>
                                            </div>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18}/> Holerites</h3>
                    {role === 'admin' && (
                        <div className="flex flex-wrap items-end gap-3 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Competência</label>
                                <input
                                    type="month"
                                    value={payrollCompetence}
                                    onChange={(e) => setPayrollCompetence(e.target.value)}
                                    className="border border-slate-300 rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div>
                                <input
                                    id={`payroll-upload-${emp.id}`}
                                    type="file"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const input = e.currentTarget;
                                        const file = input.files?.[0];
                                        if (!file) return;
                                        input.value = '';
                                        await handlePayrollUpload(emp, payrollCompetence, file);
                                    }}
                                />
                                <label htmlFor={`payroll-upload-${emp.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer">
                                    <UploadCloud size={14}/> Enviar holerite
                                </label>
                            </div>
                            {payrollUploadError && (
                                <div className="text-xs text-red-600">{payrollUploadError}</div>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        {getEmployeePayrolls(emp.id).map((payroll) => {
                            const attachments = getHrAttachments('payroll', payroll.id);
                            return (
                                <div key={payroll.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{payroll.competence}</p>
                                        <p className="text-xs text-slate-400">{payroll.status}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {attachments.map(att => (
                                            <a key={att.id} href={getAttachmentDownloadUrl(att.id)} target="_blank" className="text-xs text-blue-600 font-bold hover:underline">
                                                Baixar
                                            </a>
                                        ))}
                                        {attachments.length === 0 && (
                                            <span className="text-xs text-slate-400">Sem arquivo</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {getEmployeePayrolls(emp.id).length === 0 && (
                            <p className="text-sm text-slate-400">Nenhum holerite disponível.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FolderOpen size={18}/> Histórico de Solicitações</h3>
                    <div className="space-y-3">
                        {hrRequests.filter(r => r.employeeId === emp.id).map(r => (
                            <button
                                key={r.id}
                                onClick={() => { setSelectedRequest(r); setSelectedItem(emp); setView('request_details'); }}
                                className="w-full text-left flex items-center justify-between p-3 border border-slate-100 rounded hover:bg-slate-50"
                                type="button"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded text-slate-600">
                                        {r.type === 'F\u00e9rias' && <Calendar size={16}/>}
                                        {r.type === 'Atestado' && <Paperclip size={16}/>}
                                        {r.type === 'Demiss\u00e3o' && <UserMinus size={16}/>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{r.type}</p>
                                        <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(r.status)}`}>{r.status}</span>
                            </button>
                        ))}
                        {hrRequests.filter(r => r.employeeId === emp.id).length === 0 && (
                            <p className="text-center text-slate-400 text-sm py-4">Nenhuma solicitacao encontrada.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Acoes do Gestor</h3>
                    {employeeUpdateNotice && (
                        <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                            {employeeUpdateNotice}
                        </div>
                    )}
                    {role === 'admin' && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alocar em Posto/Setor</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                value={emp.workSiteId || ''}
                                onChange={async (e) => {
                                    await handleEmployeeUpdate({ workSiteId: e.target.value || undefined });
                                }}
                            >
                                <option value="">Sem Posto</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 mt-3">Status do Funcionário</label>
                            <select
                                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                value={emp.status}
                                onChange={async (e) => {
                                    await handleEmployeeUpdate({ status: e.target.value as Employee['status'] });
                                }}
                            >
                                <option value="Ativo">Ativo</option>
                                <option value="Gozando Férias">Gozando Férias</option>
                                <option value="Inativo">Inativo</option>
                                <option value="Desligado">Desligado</option>
                            </select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <button 
                            onClick={() => { setSelectedItem(emp); setSelectedRequest(null); setRequestDetails({}); setPendingRequestFiles([]); setSelectedType('F\u00e9rias'); setView('request_form'); }}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700"
                        >
                            <Calendar size={18} className="text-blue-600"/> Solicitar Férias
                        </button>
                        <button 
                             onClick={() => { setSelectedItem(emp); setSelectedRequest(null); setRequestDetails({}); setPendingRequestFiles([]); setSelectedType('Atestado'); setView('request_form'); }}
                             className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700"
                        >
                            <Paperclip size={18} className="text-amber-600"/> Enviar Atestado
                        </button>
                        <button 
                             onClick={() => { setSelectedItem(emp); setSelectedRequest(null); setRequestDetails({}); setPendingRequestFiles([]); setSelectedType('Demiss\u00e3o'); setView('request_form'); }}
                             className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-bold text-red-600"
                        >
                            <UserMinus size={18}/> Solicitar Desligamento
                        </button>
                        <button 
                             onClick={() => { setSelectedItem(emp); setSelectedRequest(null); setRequestDetails({}); setPendingRequestFiles([]); setSelectedType('Inclus\u00e3o Dependente'); setView('request_form'); }}
                             className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700"
                        >
                            <Users size={18} className="text-indigo-600"/> Incluir Dependente
                        </button>
                        <button 
                             onClick={() => { setSelectedItem(emp); setSelectedRequest(null); setRequestDetails({}); setPendingRequestFiles([]); setSelectedType('Atualiza\u00e7\u00e3o Cadastro'); setView('request_form'); }}
                             className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-medium text-slate-700"
                        >
                            <FileCheck size={18} className="text-emerald-600"/> Atualizar Dados/Documentos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
  };

  const renderAdmissionForm = (adm?: HRAdmission) => {
    const isEditing = !!adm;
    const feedbacks = adm ? getFieldFeedback(adm.id) : [];
    const admissionAttachments = adm ? getHrAttachments('admission', adm.id) : [];
    const _attachmentsTick = attachmentsTick;

    const getFieldValue = (name: string) => {
        const value = (formAdmission as any)[name];
        return value === undefined || value === null ? '' : value;
    };

    const updateAdmissionField = (name: string, value: any) => {
        setFormAdmission((prev) => ({ ...prev, [name]: value }));
    };

    const isFormLocked = role === 'admin'
        ? adm?.status !== 'Validando'
        : !!adm && !(adm.status === 'Novo' || adm.status === 'Formulario com Erro');
    const canMarkFeedback = role === 'admin' && adm?.status === 'Validando';
    const cpfValue = getFieldValue('cpf');
    const cpfInvalid = !!cpfValue && !isValidCpf(cpfValue);
    const birthStateValue = getFieldValue('birthState');
    const addressStateValue = getFieldValue('addressState');
    const requestFieldError = (name: string) => feedbacks.find(f => f.fieldName === name && !f.resolved)?.message;
    const missingDocs = ADMISSION_DOCS.filter(doc => doc.required && !(
        pendingAdmissionFiles.some(p => p.docId === doc.id) ||
        admissionAttachments.some(att => parseAttachmentName(att.name).docId === doc.id)
    ));
    const requiredAdmissionFields = [
        'fullName', 'cpf', 'rg', 'birthDate', 'gender', 'maritalStatus',
        'addressZip', 'addressStreet', 'addressNumber', 'addressDistrict', 'addressCity', 'addressState',
        'role', 'salary', 'expectedStartDate'
    ];
    const hasAllRequiredFields = requiredAdmissionFields.every((field) => {
        const value = getFieldValue(field);
        return value !== '' && value !== undefined && value !== null;
    });
    const isSubmitDisabled = role === 'client'
        && !isFormLocked
        && (!hasAllRequiredFields || cpfInvalid || missingDocs.length > 0);

    const admissionSteps = [
        'Dados Pessoais',
        'Documentação',
        'Endereço',
        'Dados Contratuais',
        'Dados Bancários',
        'Dependentes',
        'Contatos de Emergência',
        'Documentos e Comprovantes'
    ];
    const unresolvedFeedbacks = feedbacks.filter(f => !f.resolved);
    const unresolvedFields = unresolvedFeedbacks.map(f => f.fieldName);
    const countFeedbackForFields = (fields: string[]) =>
        unresolvedFields.filter((name) => fields.includes(name)).length;
    const countDocFeedback = () =>
        unresolvedFields.filter((name) => name.startsWith('doc:')).length;
    const countStepIssues = (index: number) => {
        switch (index) {
            case 0:
                return countFeedbackForFields(['fullName', 'cpf', 'rg', 'birthDate', 'gender', 'maritalStatus', 'birthState', 'birthCity', 'nationality', 'motherName', 'fatherName', 'educationLevel', 'email', 'phone']);
            case 1:
                return countFeedbackForFields(['pis', 'tituloEleitor', 'tituloEleitorZone', 'tituloEleitorSection', 'ctps', 'ctpsSeries', 'ctpsUf', 'reservista']);
            case 2:
                return countFeedbackForFields(['addressZip', 'addressStreet', 'addressNumber', 'addressComplement', 'addressDistrict', 'addressCity', 'addressState', 'address']);
            case 3:
                return countFeedbackForFields(['role', 'salary', 'expectedStartDate', 'workSiteId', 'contractType', 'weeklyHours', 'shift']);
            case 4:
                return countFeedbackForFields(['bankName', 'bankAgency', 'bankAccount', 'bankAccountType']);
            case 5:
                return countFeedbackForFields(['dependentsCount', 'dependentsNotes']);
            case 6:
                return countFeedbackForFields(['emergencyContactName', 'emergencyContactPhone']);
            case 7: {
                const docCount = countDocFeedback();
                const missingCount = role === 'client' ? missingDocs.length : 0;
                return docCount + missingCount;
            }
            default:
                return 0;
        }
    };

    const validateStep = (index: number) => {
        if (role === 'admin' || isFormLocked) return '';
        if (index === 0) {
            const requiredFields = ['fullName', 'cpf', 'rg', 'birthDate', 'gender', 'maritalStatus'];
            if (requiredFields.some((f) => !getFieldValue(f))) return 'Preencha os campos obrigatorios desta etapa.';
            if (cpfInvalid) return 'CPF invalido.';
        }
        if (index === 2) {
            const requiredFields = ['addressZip', 'addressStreet', 'addressNumber', 'addressDistrict', 'addressCity', 'addressState'];
            if (requiredFields.some((f) => !getFieldValue(f))) return 'Preencha os campos obrigatorios desta etapa.';
            if (onlyDigits(getFieldValue('addressZip')).length !== 8) return 'CEP invalido.';
        }
        if (index === 3) {
            const requiredFields = ['role', 'salary', 'expectedStartDate'];
            if (requiredFields.some((f) => !getFieldValue(f))) return 'Preencha os campos obrigatorios desta etapa.';
        }
        if (index === 7 && missingDocs.length > 0) {
            return 'Envie os documentos obrigatorios antes de finalizar.';
        }
        return '';
    };

    const handleStepChange = (nextStep: number) => {
        if (nextStep === currentStep) return;
        if (nextStep < currentStep) {
            setCurrentStep(nextStep);
            setStepError('');
            return;
        }
        const error = validateStep(currentStep);
        if (error) {
            setStepError(error);
            return;
        }
        setCurrentStep(nextStep);
        setStepError('');
    };

    const SelectField = ({ label, name, options, required = false, disabled }: { label: string; name: string; options: string[]; required?: boolean; disabled?: boolean }) => (
        <div className="relative">
            <label className={`block text-xs font-bold uppercase mb-1 ${requestFieldError(name) ? 'text-red-600' : 'text-slate-500'}`}>
                {label} {required && <span className="text-red-500">*</span>} {requestFieldError(name) && <AlertTriangle size={12} className="inline ml-1" />}
            </label>
            <select
                className={`w-full border rounded-lg p-2.5 text-sm transition-all outline-none ${requestFieldError(name) ? 'border-red-300 bg-red-50' : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'}`}
                value={getFieldValue(name)}
                onChange={e => updateAdmissionField(name, e.target.value)}
                disabled={disabled ?? isFormLocked}
                required={required}
            >
                <option value="">Selecione...</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            {requestFieldError(name) && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">{requestFieldError(name)}</p>
            )}
            {canMarkFeedback && (
                <button
                    onClick={() => { setFeedbackField(name); setFeedbackTargetId(adm?.id || null); }}
                    className="absolute right-2 top-8 text-red-400 hover:text-red-600"
                    title="Apontar Erro"
                    type="button"
                >
                    <AlertTriangle size={14} />
                </button>
            )}
        </div>
    );

    const CityField = ({ label, name, stateValue, required = false }: { label: string; name: string; stateValue: string; required?: boolean }) => {
        const options = stateValue && CITIES_BY_UF[stateValue] ? CITIES_BY_UF[stateValue] : null;
        const currentValue = getFieldValue(name);
        if (!stateValue) {
            return (
                <AdmissionInputField
                    label={label}
                    name={name}
                    required={required}
                    value={getFieldValue(name)}
                    disabled={true}
                    errorMessage={requestFieldError(name)}
                    showFeedbackButton={false}
                    onFeedback={() => {}}
                    onChange={(value) => updateAdmissionField(name, value)}
                />
            );
        }
        if (options && (currentValue === '' || options.includes(currentValue))) {
            return (
                <SelectField label={label} name={name} options={options} required={required} />
            );
        }
        return (
            <AdmissionInputField
                label={label}
                name={name}
                required={required}
                value={getFieldValue(name)}
                disabled={isFormLocked}
                errorMessage={requestFieldError(name)}
                showFeedbackButton={canMarkFeedback}
                onFeedback={() => { setFeedbackField(name); setFeedbackTargetId(adm?.id || null); }}
                onChange={(value) => updateAdmissionField(name, value)}
            />
        );
    };

    const addDependent = () => {
        setDependents((prev) => ([
            ...prev,
            { id: createId(), name: '', birthDate: '', cpf: '', relationship: '' }
        ]));
    };

    const updateDependent = (id: string, key: string, value: string) => {
        setDependents((prev) => prev.map((d) => d.id === id ? { ...d, [key]: value } : d));
    };

    const removeDependent = (id: string) => {
        setDependents((prev) => prev.filter((d) => d.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
             <button onClick={() => setView('list')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                <ArrowLeft size={16}/> Voltar para Lista
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">{isEditing ? `Admissão: ${adm.fullName}` : 'Nova Solicitação de Admissão'}</h2>
                        <p className="text-slate-400 text-xs mt-1">Siga o fluxo para o registro correto do novo colaborador.</p>
                    </div>
                    {adm && (
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusColor(adm.status)}`}>
                            {adm.status}
                        </span>
                    )}
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
                            className="px-4 py-2 border rounded-lg text-sm font-bold text-slate-600 hover:bg-white transition-colors"
                            disabled={currentStep === 0}
                        >
                            Anterior
                        </button>
                        {currentStep < admissionSteps.length - 1 && (
                            <button
                                type="button"
                                onClick={() => handleStepChange(currentStep + 1)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                            >
                                Proxima etapa
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {admissionSteps.map((step, index) => (
                            (() => {
                                const issueCount = countStepIssues(index);
                                return (
                            <button
                                key={step}
                                type="button"
                                onClick={() => handleStepChange(index)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${
                                    currentStep === index
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : index < currentStep
                                            ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                            : 'bg-white text-slate-400 border-slate-200'
                                }`}
                            >
                                {index + 1}. {step}
                                {issueCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-600 text-white text-[10px] font-bold">
                                        {issueCount}
                                    </span>
                                )}
                            </button>
                                );
                            })()
                        ))}
                    </div>
                    {stepError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                            <AlertTriangle size={16} /> {stepError}
                        </div>
                    )}
                    {currentStep === 0 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                            DADOS PESSOAIS
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <AdmissionInputField
                                  label="Nome Completo"
                                  name="fullName"
                                  placeholder="Conforme documento oficial"
                                  value={getFieldValue('fullName')}
                                  disabled={isFormLocked}
                                  errorMessage={requestFieldError('fullName')}
                                  showFeedbackButton={canMarkFeedback}
                                  onFeedback={() => { setFeedbackField('fullName'); setFeedbackTargetId(adm?.id || null); }}
                                  onChange={(value) => updateAdmissionField('fullName', value)}
                                />
                            </div>
                            <AdmissionInputField
                              label="CPF"
                              name="cpf"
                              placeholder="000.000.000-00"
                              value={getFieldValue('cpf')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('cpf') || (cpfInvalid ? 'CPF invalido' : undefined)}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('cpf'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('cpf', maskCpf(value))}
                              inputMode="numeric"
                              maxLength={14}
                             
                            />
                            <AdmissionInputField
                              label="RG"
                              name="rg"
                              value={getFieldValue('rg')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('rg')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('rg'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('rg', value)}
                            />
                            <AdmissionInputField
                              label="Data Nascimento"
                              name="birthDate"
                              type="date"
                              value={getFieldValue('birthDate')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('birthDate')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('birthDate'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('birthDate', value)}
                             
                            />
                            <SelectField
                              label="Gênero"
                              name="gender"
                              options={['Masculino', 'Feminino', 'Não especificado']}
                              required
                            />
                            <SelectField
                              label="Estado Civil"
                              name="maritalStatus"
                              options={MARITAL_STATUS_OPTIONS}
                              required
                            />
                            <SelectField
                              label="UF Nascimento"
                              name="birthState"
                              options={UF_OPTIONS}
                              required={false}
                            />
                            <CityField
                              label="Naturalidade (Cidade)"
                              name="birthCity"
                              stateValue={birthStateValue}
                              required={false}
                            />
                            <SelectField
                              label="Nacionalidade"
                              name="nationality"
                              options={NATIONALITY_OPTIONS}
                              required={false}
                            />
                            <AdmissionInputField
                              label="Nome da Mãe"
                              name="motherName"
                              required={false}
                              value={getFieldValue('motherName')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('motherName')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('motherName'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('motherName', value)}
                            />
                            <AdmissionInputField
                              label="Nome do Pai"
                              name="fatherName"
                              required={false}
                              value={getFieldValue('fatherName')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('fatherName')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('fatherName'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('fatherName', value)}
                            />
                            <SelectField
                              label="Escolaridade"
                              name="educationLevel"
                              options={['Ensino Fundamental', 'Ensino Médio', 'Superior em Andamento', 'Superior Completo', 'Pós Graduação']}
                              required={false}
                            />
                            <AdmissionInputField
                              label="Email"
                              name="email"
                              type="email"
                              required={false}
                              value={getFieldValue('email')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('email')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('email'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('email', value)}
                             
                            />
                            <AdmissionInputField
                              label="Telefone"
                              name="phone"
                              required={false}
                              value={getFieldValue('phone')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('phone')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('phone'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('phone', maskPhone(value))}
                              inputMode="numeric"
                              maxLength={16}
                             
                            />
                        </div>
                    </section>
                    )}

                    {currentStep === 1 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                            DOCUMENTAÇÃO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { label: 'PIS', name: 'pis', required: false },
                              { label: 'Título Eleitor', name: 'tituloEleitor', required: false },
                              { label: 'Zona Eleitoral', name: 'tituloEleitorZone', required: false },
                              { label: 'Seção Eleitoral', name: 'tituloEleitorSection', required: false },
                              { label: 'CTPS Número', name: 'ctps', required: false },
                              { label: 'CTPS Série', name: 'ctpsSeries', required: false },
                              { label: 'Reservista', name: 'reservista', required: false }
                            ].map(field => (
                              <AdmissionInputField
                                key={field.name}
                                label={field.label}
                                name={field.name}
                                required={field.required !== false}
                                value={getFieldValue(field.name)}
                                disabled={isFormLocked}
                                errorMessage={requestFieldError(field.name)}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField(field.name); setFeedbackTargetId(adm?.id || null); }}
                                onChange={(value) => updateAdmissionField(field.name, value)}
                              />
                            ))}
                            <SelectField
                              label="CTPS UF"
                              name="ctpsUf"
                              options={UF_OPTIONS}
                              required={false}
                            />
                        </div>
                    </section>
                    )}

                    {currentStep === 2 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">3</span>
                            ENDEREÇO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AdmissionInputField
                              label="CEP"
                              name="addressZip"
                              required
                              value={getFieldValue('addressZip')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('addressZip')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('addressZip'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('addressZip', maskCep(value))}
                              inputMode="numeric"
                              maxLength={9}
                              onBlur={handleCepLookup}
                             
                            />
                            <AdmissionInputField
                              label="Rua/Logradouro"
                              name="addressStreet"
                              required
                              value={getFieldValue('addressStreet')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('addressStreet')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('addressStreet'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('addressStreet', value)}
                            />
                            <AdmissionInputField
                              label="Número"
                              name="addressNumber"
                              required
                              value={getFieldValue('addressNumber')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('addressNumber')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('addressNumber'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('addressNumber', value)}
                              id="addressNumber"
                            />
                            <AdmissionInputField
                              label="Complemento"
                              name="addressComplement"
                              required={false}
                              value={getFieldValue('addressComplement')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('addressComplement')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('addressComplement'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('addressComplement', value)}
                            />
                            <AdmissionInputField
                              label="Bairro"
                              name="addressDistrict"
                              required
                              value={getFieldValue('addressDistrict')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('addressDistrict')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('addressDistrict'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('addressDistrict', value)}
                            />
                            <CityField
                              label="Cidade"
                              name="addressCity"
                              stateValue={addressStateValue}
                              required
                            />
                            <SelectField
                              label="UF"
                              name="addressState"
                              options={UF_OPTIONS}
                              required
                            />
                            <div className="md:col-span-3">
                                <AdmissionInputField
                                  label="Endereço Completo (obs)"
                                  name="address"
                                  placeholder="Rua, Número, Bairro, Cidade, UF, CEP"
                                  required={false}
                                  value={getFieldValue('address')}
                                  disabled={isFormLocked}
                                  errorMessage={requestFieldError('address')}
                                  showFeedbackButton={canMarkFeedback}
                                  onFeedback={() => { setFeedbackField('address'); setFeedbackTargetId(adm?.id || null); }}
                                  onChange={(value) => updateAdmissionField('address', value)}
                                />
                            </div>
                        </div>
                        {isCepLoading && (
                            <p className="text-xs text-slate-500 mt-2">Buscando dados do CEP...</p>
                        )}
                    </section>
                    )}

                    {currentStep === 3 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">4</span>
                            DADOS CONTRATUAIS
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AdmissionInputField
                              label="Cargo"
                              name="role"
                              value={getFieldValue('role')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('role')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('role'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('role', value)}
                            />
                            <AdmissionInputField
                              label="Salário Base (R$)"
                              name="salary"
                              type="number"
                              value={getFieldValue('salary')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('salary')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('salary'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('salary', value)}
                             
                            />
                            <SelectField
                              label="Tipo de Contrato"
                              name="contractType"
                              options={['CLT', 'PJ', 'Avulso', 'Temporario', 'MEI']}
                              required={false}
                            />
                            <AdmissionInputField
                              label="Carga Horária Semanal"
                              name="weeklyHours"
                              type="number"
                              required={false}
                              value={getFieldValue('weeklyHours')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('weeklyHours')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('weeklyHours'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('weeklyHours', value)}
                             
                            />
                            <SelectField
                              label="Turno"
                              name="shift"
                              options={['Diurno', 'Noturno']}
                              required={false}
                            />
                            <AdmissionInputField
                              label="Data Prevista de Início"
                              name="expectedStartDate"
                              type="date"
                              value={getFieldValue('expectedStartDate')}
                              disabled={isFormLocked}
                              errorMessage={requestFieldError('expectedStartDate')}
                              showFeedbackButton={canMarkFeedback}
                              onFeedback={() => { setFeedbackField('expectedStartDate'); setFeedbackTargetId(adm?.id || null); }}
                              onChange={(value) => updateAdmissionField('expectedStartDate', value)}
                             
                            />
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Posto de Trabalho / Setor</label>
                                <select 
                                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                onChange={e => updateAdmissionField('workSiteId', e.target.value)}
                                    value={getFieldValue('workSiteId')}
                                    disabled={isFormLocked}
                                >
                                    <option value="">Selecione um posto...</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>
                    )}

                    {currentStep === 4 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">5</span>
                            DADOS BANCÁRIOS
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AdmissionInputField
                                label="Banco"
                                name="bankName"
                                required={false}
                                value={getFieldValue('bankName')}
                                disabled={isFormLocked}
                                errorMessage={requestFieldError('bankName')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('bankName'); setFeedbackTargetId(adm?.id || null); }}
                                onChange={(value) => updateAdmissionField('bankName', value)}
                            />
                            <AdmissionInputField
                                label="Agência"
                                name="bankAgency"
                                required={false}
                                value={getFieldValue('bankAgency')}
                                disabled={isFormLocked}
                                errorMessage={requestFieldError('bankAgency')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('bankAgency'); setFeedbackTargetId(adm?.id || null); }}
                                onChange={(value) => updateAdmissionField('bankAgency', value)}
                            />
                            <AdmissionInputField
                                label="Conta"
                                name="bankAccount"
                                required={false}
                                value={getFieldValue('bankAccount')}
                                disabled={isFormLocked}
                                errorMessage={requestFieldError('bankAccount')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('bankAccount'); setFeedbackTargetId(adm?.id || null); }}
                                onChange={(value) => updateAdmissionField('bankAccount', value)}
                            />
                            <SelectField
                                label="Tipo de Conta"
                                name="bankAccountType"
                                options={BANK_ACCOUNT_TYPES}
                                required={false}
                            />
                        </div>
                    </section>
                    )}

                    {currentStep === 5 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">6</span>
                            DEPENDENTES
                        </h3>
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">Adicione os dependentes para o cadastro.</p>
                            <button
                                type="button"
                                onClick={addDependent}
                                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg"
                                disabled={isFormLocked}
                            >
                                <Plus size={14} /> Adicionar dependente
                            </button>
                        </div>
                        <div className="space-y-4 mt-4">
                            {dependents.length === 0 && (
                                <div className="p-4 border border-dashed rounded-lg text-center text-slate-400 text-sm">
                                    Nenhum dependente adicionado.
                                </div>
                            )}
                            {dependents.map((dep, index) => (
                                <div key={dep.id} className="border rounded-xl p-4 bg-slate-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-bold text-slate-700">Dependente {index + 1}</p>
                                        {!isFormLocked && (
                                            <button type="button" onClick={() => removeDependent(dep.id)} className="text-xs text-red-600 hover:underline">
                                                Remover
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <AdmissionInputField
                                            label="Nome"
                                            name={`dep-name-${dep.id}`}
                                            required={false}
                                            value={dep.name}
                                            disabled={isFormLocked}
                                            errorMessage={undefined}
                                            showFeedbackButton={false}
                                            onFeedback={() => null}
                                            onChange={(value) => updateDependent(dep.id, 'name', value)}
                                        />
                                        <AdmissionInputField
                                            label="Data Nascimento"
                                            name={`dep-birth-${dep.id}`}
                                            type="date"
                                            required={false}
                                            value={dep.birthDate}
                                            disabled={isFormLocked}
                                            errorMessage={undefined}
                                            showFeedbackButton={false}
                                            onFeedback={() => null}
                                            onChange={(value) => updateDependent(dep.id, 'birthDate', value)}
                                        />
                                        <AdmissionInputField
                                            label="CPF"
                                            name={`dep-cpf-${dep.id}`}
                                            required={false}
                                            value={dep.cpf}
                                            disabled={isFormLocked}
                                            errorMessage={undefined}
                                            showFeedbackButton={false}
                                            onFeedback={() => null}
                                            onChange={(value) => updateDependent(dep.id, 'cpf', maskCpf(value))}
                                            inputMode="numeric"
                                            maxLength={14}
                                           
                                        />
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1 text-slate-500">Parentesco</label>
                                            <select
                                                className="w-full border rounded-lg p-2.5 text-sm transition-all outline-none border-slate-300 focus:ring-blue-500 focus:border-blue-500"
                                                value={dep.relationship}
                                                disabled={isFormLocked}
                                                onChange={(e) => updateDependent(dep.id, 'relationship', e.target.value)}
                                            >
                                                <option value="">Selecione...</option>
                                                {DEPENDENT_RELATIONSHIPS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    )}

                    {/* Seção 6: Contato de Emergencia */}
                    {currentStep === 6 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">7</span>
                            CONTATO DE EMERGENCIA
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { label: 'Nome do Contato', name: 'emergencyContactName', required: false },
                              { label: 'Telefone do Contato', name: 'emergencyContactPhone', required: false }
                            ].map(field => (
                              <AdmissionInputField
                                key={field.name}
                                label={field.label}
                                name={field.name}
                                required={field.required !== false}
                                value={getFieldValue(field.name)}
                                disabled={isFormLocked}
                                errorMessage={requestFieldError(field.name)}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField(field.name); setFeedbackTargetId(adm?.id || null); }}
                                onChange={(value) => updateAdmissionField(field.name, field.name === 'emergencyContactPhone' ? maskPhone(value) : value)}
                                inputMode={field.name === 'emergencyContactPhone' ? 'numeric' : undefined}
                                maxLength={field.name === 'emergencyContactPhone' ? 16 : undefined}
                              />
                            ))}
                        </div>
                    </section>
                    )}

                    {/* Seção 7: Uploads */}
                    {currentStep === 7 && (
                    <section>
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">8</span>
                            ARQUIVOS E COMPROVANTES
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">Anexe os documentos obrigatorios. Caso exista pendencia, o item sera destacado.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ADMISSION_DOCS.map((doc) => {
                                const docFeedback = feedbacks.find(f => f.fieldName === `doc:${doc.id}` && !f.resolved);
                                const attachments = admissionAttachments.filter(att => parseAttachmentName(att.name).docId === doc.id);
                                const pending = pendingAdmissionFiles.filter(p => p.docId === doc.id);
                                return (
                                    <div key={doc.id} className={`border rounded-xl p-4 ${docFeedback ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{doc.label} {doc.required && <span className="text-red-500">*</span>}</p>
                                                {docFeedback && <p className="text-[11px] text-red-600 mt-1">{docFeedback.message}</p>}
                                                <p className="text-[11px] text-slate-400">{attachments.length + pending.length} arquivo(s)</p>
                                            </div>
                                            {role === 'admin' && adm?.status === 'Validando' && (
                                                <button
                                                    onClick={() => { setFeedbackField(`doc:${doc.id}`); setFeedbackTargetId(adm?.id || null); }}
                                                    className="text-red-400 hover:text-red-600"
                                                    title="Apontar erro no documento"
                                                >
                                                    <AlertTriangle size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {attachments.map(att => {
                                                const parsed = parseAttachmentName(att.name);
                                                return (
                                                    <a key={att.id} href={getAttachmentDownloadUrl(att.id)} target="_blank" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                                        <Paperclip size={14} /> {parsed.displayName}
                                                    </a>
                                                );
                                            })}
                                            {pending.map((p, idx) => (
                                                <div key={`${p.docId}-${idx}`} className="text-xs text-amber-600 flex items-center gap-2">
                                                    <Clock size={14} /> {p.file.name} (pendente envio)
                                                </div>
                                            ))}
                                            {attachments.length === 0 && pending.length === 0 && (
                                                <p className="text-xs text-slate-400">Nenhum arquivo enviado.</p>
                                            )}
                                        </div>
                                        {role === 'client' && (!adm || adm.status === 'Novo' || adm.status === 'Formulario com Erro') && (
                                            <div className="mt-3">
                                                <input
                                                    id={`adm-doc-${doc.id}`}
                                                    type="file"
                                                    accept={doc.id === 'foto_perfil' ? 'image/*' : undefined}
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const input = e.currentTarget;
                                                        const file = input.files?.[0];
                                                        if (!file) return;
                                                        input.value = '';
                                                        await handleAdmissionFileSelect(doc.id, file, adm?.id);
                                                    }}
                                                />
                                                <label htmlFor={`adm-doc-${doc.id}`} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
                                                    <UploadCloud size={14} /> Adicionar arquivo
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t flex justify-between gap-4">
                    <button onClick={() => setView('list')} className="px-6 py-2 border rounded-lg font-bold text-slate-600 hover:bg-white transition-colors">Cancelar</button>
                    
                    <div className="flex gap-2">
                        {role === 'admin' && adm?.status === 'Novo' && (
                            <button 
                                onClick={() => applyAdmissionStatus(adm, 'Validando', 'Validação iniciada.')}
                                className="px-6 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 flex items-center gap-2"
                            >
                                <Clock size={18}/> Iniciar Validação
                            </button>
                        )}

                        {role === 'admin' && adm?.status === 'Validando' && (
                            <>
                                <button 
                                    onClick={() => {
                                        const openIssues = feedbacks.filter(f => !f.resolved).length;
                                        if (openIssues === 0) {
                                            alert('Aponte pelo menos um erro antes de devolver para correção.');
                                            return;
                                        }
                                        applyAdmissionStatus(adm, 'Formulario com Erro', 'Solicitação devolvida para correção.');
                                    }}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-2"
                                >
                                    <XCircle size={18}/> Apontar Erros
                                </button>
                                <button 
                                    onClick={() => {
                                        const openIssues = feedbacks.filter(f => !f.resolved).length;
                                        if (openIssues > 0) {
                                            alert('Resolva as pendências antes de validar.');
                                            return;
                                        }
                                        applyAdmissionStatus(adm, 'Validado', 'Dados validados com sucesso.');
                                    }}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2"
                                >
                                    <CheckCircle size={18}/> Validar Dados
                                </button>
                            </>
                        )}

                        {role === 'admin' && adm?.status === 'Validado' && (
                            <button 
                                onClick={() => handleFinalizeAdmission(adm)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2"
                            >
                                <FileCheck size={18}/> Registrar e Finalizar
                            </button>
                        )}

                        {role === 'client' && (!adm || adm.status === 'Novo' || adm.status === 'Formulario com Erro') && (
                            <button 
                                onClick={async () => {
                                    if (currentStep < admissionSteps.length - 1) {
                                        setStepError('Finalize as etapas antes de enviar.');
                                        return;
                                    }
                                    const error = validateStep(currentStep);
                                    if (error) {
                                        setStepError(error);
                                        return;
                                    }
                                    if (isEditing) {
                                        await Promise.all(feedbacks.filter(f => !f.resolved).map(f => resolveFieldFeedback(f.id)));
                                        await handleUpdateAdmission(buildAdmissionPayload(adm, 'Novo'));
                                        setSelectedItem({ ...adm, status: 'Novo' });
                                        setFormAdmission((prev) => ({ ...prev, status: 'Novo' }));
                                        alert('Solicitação reenviada para análise.');
                                        setView('list');
                                        setActiveTab('admissions');
                                    } else {
                                        await handleCreateAdmission();
                                    }
                                }}
                                disabled={isSubmitDisabled}
                                className={`px-12 py-2 rounded-lg font-bold shadow-lg ${isSubmitDisabled ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                {adm?.status === 'Formulario com Erro' ? 'Re-enviar para Validação' : 'Enviar Solicitação'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* FEEDBACK OVERLAY (ADMIN ONLY) */}
            {feedbackField && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
                        <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                            <AlertTriangle size={20}/> Erro no campo: {feedbackField}
                        </h4>
                        <textarea 
                            className="w-full border rounded-lg p-2 text-sm h-24 mb-4" 
                            placeholder="Descreva o que está errado neste campo..."
                            value={feedbackMsg}
                            onChange={e => setFeedbackMsg(e.target.value.toUpperCase())}
                            style={{ textTransform: 'uppercase' }}
                        ></textarea>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setFeedbackField(''); setFeedbackTargetId(null); }} className="px-4 py-2 text-slate-500">Cancelar</button>
                            <button 
                                onClick={async () => {
                                    if (!feedbackTargetId) return;
                                    await addFieldFeedback({
                                        id: createId(),
                                        targetId: feedbackTargetId,
                                        fieldName: feedbackField,
                                        message: feedbackMsg,
                                        resolved: false
                                    });
                                    setFeedbackField('');
                                    setFeedbackTargetId(null);
                                    setFeedbackMsg('');
                                    refreshData();
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
                            >
                                Salvar Feedback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderWorkSites = () => (
      <div className="space-y-6">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Postos de Trabalho / Setores</h2>
              {role === 'admin' && (
                  <button 
                    onClick={async () => {
                        const name = prompt('Nome do Posto/Setor:');
                        if(name) {
                            await addWorkSite({ id: createId(), companyId, name: name.toUpperCase() });
                            refreshData();
                        }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                  >
                      <Plus size={18}/> Novo Posto
                  </button>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sites.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><MapPin size={24}/></div>
                          <div>
                              <h3 className="font-bold text-slate-800">{s.name}</h3>
                              <p className="text-xs text-slate-400">{employees.filter(e => e.workSiteId === s.id).length} funcionários alocados</p>
                          </div>
                      </div>
                      <div className="flex -space-x-2">
                          {employees.filter(e => e.workSiteId === s.id).slice(0, 5).map(e => {
                              const photoUrl = getEmployeePhotoUrl(e);
                              return photoUrl ? (
                                  <img
                                      key={e.id}
                                      src={photoUrl}
                                      alt={e.name}
                                      title={e.name}
                                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                                  />
                              ) : (
                                  <div key={e.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold" title={e.name}>
                                      {e.name.substring(0,1)}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              ))}
              {sites.length === 0 && (
                  <div className="col-span-3 py-12 text-center text-slate-400 border-2 border-dashed rounded-xl">
                      Nenhum posto cadastrado.
                  </div>
              )}
          </div>
      </div>
  );

  const renderRequestForm = () => {
      const currentReq = selectedRequest || null;
      const currentEmployee = getRequestEmployee(currentReq || undefined);
      if (!currentEmployee) return null;
      const currentType = currentReq?.type || selectedType;
      const canEdit = role === 'client' && (!currentReq || currentReq.status === 'Pendencia');
      const canMarkFeedback = role === 'admin' && currentReq?.status === 'Em Analise';
      const canAdminUpload = role === 'admin' && currentReq?.status === 'Em Analise';
      const canClientUpload = role === 'client' && canEdit && currentType !== 'F\u00e9rias';
      const requestFeedbacks = currentReq ? getFieldFeedback(currentReq.id) : [];
      const requestAttachments = currentReq ? getHrAttachments('hr_request', currentReq.id) : [];
      const _attachmentsTick = attachmentsTick;
      const getRequestError = (name: string) => requestFeedbacks.find(f => f.fieldName === name && !f.resolved)?.message;

      const requestDocConfig = REQUEST_DOCS[currentType] || [];
      const visibleDocs = requestDocConfig.filter((doc) => !doc.requiresTerminationType || requestDetails?.type === doc.requiresTerminationType);
      const canCancelRequest = role === 'client'
          && currentReq
          && (currentType === 'F\u00e9rias' || currentType === 'Demiss\u00e3o')
          && currentReq.status !== 'Finalizado'
          && currentReq.status !== 'Cancelado';

      const hasRequestDoc = (docId: string) => (
          pendingRequestFiles.some(p => p.docId === docId)
          || requestAttachments.some(att => parseAttachmentName(att.name).docId === docId)
      );

      const getMissingRequiredDocs = (opts: { includeAdminOnly: boolean; includeClientOnly: boolean }) => (
          visibleDocs.filter(doc => {
              if (!doc.required) return false;
              if (!opts.includeAdminOnly && doc.adminOnly) return false;
              if (!opts.includeClientOnly && doc.clientOnly) return false;
              return !hasRequestDoc(doc.id);
          }).map(doc => doc.label)
      );

      const canUploadDoc = (doc: RequestDocConfig) => {
          if (doc.requiresTerminationType && requestDetails?.type !== doc.requiresTerminationType) return false;
          if (doc.adminOnly) return canAdminUpload;
          if (doc.clientOnly) return canClientUpload;
          if (role === 'admin') return canAdminUpload;
          return canClientUpload;
      };

      return (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
              <button onClick={() => setView(currentReq ? 'list' : 'employee_details')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
                  <ArrowLeft size={16} /> Voltar
              </button>

              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-800">Solicitação de {currentType}</h2>
                          <p className="text-slate-500">Funcionário: <span className="font-bold text-slate-700">{currentEmployee.name}</span></p>
                      </div>
                      {currentReq && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(currentReq.status)}`}>{currentReq.status}</span>
                      )}
                  </div>

                  <div className="space-y-4">
                      {currentType === 'F\u00e9rias' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <RequestInputField
                                label="Inicio"
                                name="startDate"
                                type="date"
                                required={true}
                                value={requestDetails?.startDate || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('startDate')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('startDate'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, startDate: value })}
                               
                              />
                              <RequestInputField
                                label="Dias"
                                name="days"
                                type="number"
                                required={true}
                                value={requestDetails?.days || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('days')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('days'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, days: value })}
                               
                              />
                              <div className="col-span-full flex items-center gap-2">
                                  <input
                                      type="checkbox"
                                      id="abono"
                                      className="w-4 h-4"
                                      checked={!!requestDetails?.abono}
                                      disabled={!canEdit}
                                      onChange={e => setRequestDetails({ ...requestDetails, abono: e.target.checked })}
                                  />
                                  <label htmlFor="abono" className="text-sm text-slate-700">Abono Pecuniário (venda de 10 dias)?</label>
                              </div>
                              <div className="col-span-full flex items-center gap-2">
                                  <input
                                      type="checkbox"
                                      id="decimo"
                                      className="w-4 h-4"
                                      checked={!!requestDetails?.advance13}
                                      disabled={!canEdit}
                                      onChange={e => setRequestDetails({ ...requestDetails, advance13: e.target.checked })}
                                  />
                                  <label htmlFor="decimo" className="text-sm text-slate-700">Antecipar 13o salário?</label>
                              </div>
                              <div className="col-span-full">
                              <RequestInputField
                                label="Observações"
                                name="notes"
                                required={false}
                                value={requestDetails?.notes || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('notes')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('notes'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, notes: value })}
                               
                              />
                              </div>
                          </div>
                      )}

                      {currentType === 'Atestado' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <RequestInputField
                                label="Data do Atestado"
                                name="date"
                                type="date"
                                required={true}
                                value={requestDetails?.date || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('date')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('date'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, date: value })}
                               
                              />
                              <RequestInputField
                                label="Quantidade de Dias"
                                name="days"
                                type="number"
                                required={true}
                                value={requestDetails?.days || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('days')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('days'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, days: value })}
                               
                              />
                              <RequestInputField
                                label="Nome do Medico"
                                name="doctorName"
                                required={false}
                                value={requestDetails?.doctorName || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('doctorName')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('doctorName'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, doctorName: value })}
                              />
                              <RequestInputField
                                label="CRM"
                                name="crm"
                                required={false}
                                value={requestDetails?.crm || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('crm')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('crm'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, crm: value })}
                              />
                              <RequestInputField
                                label="CID (opcional)"
                                name="cid"
                                required={false}
                                value={requestDetails?.cid || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('cid')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('cid'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, cid: value })}
                              />
                              <div className="md:col-span-2">
                                  <RequestInputField
                                    label="Observações"
                                    name="notes"
                                    required={false}
                                    value={requestDetails?.notes || ''}
                                    disabled={!canEdit}
                                    errorMessage={getRequestError('notes')}
                                    showFeedbackButton={canMarkFeedback}
                                    onFeedback={() => { setFeedbackField('notes'); setFeedbackTargetId(currentReq?.id || null); }}
                                    onChange={(value) => setRequestDetails({ ...requestDetails, notes: value })}
                                  />
                              </div>
                          </div>
                      )}

                      {currentType === 'Inclus\u00e3o Dependente' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <RequestInputField
                                label="Nome do Dependente"
                                name="dependentName"
                                required={true}
                                value={requestDetails?.dependentName || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('dependentName')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('dependentName'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, dependentName: value })}
                              />
                              <RequestInputField
                                label="Data de Nascimento"
                                name="dependentBirthDate"
                                type="date"
                                required={false}
                                value={requestDetails?.dependentBirthDate || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('dependentBirthDate')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('dependentBirthDate'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, dependentBirthDate: value })}
                              />
                              <RequestInputField
                                label="CPF do Dependente"
                                name="dependentCpf"
                                required={false}
                                value={requestDetails?.dependentCpf || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('dependentCpf')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('dependentCpf'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, dependentCpf: value })}
                              />
                              <RequestInputField
                                label="Parentesco"
                                name="dependentRelationship"
                                required={false}
                                value={requestDetails?.dependentRelationship || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('dependentRelationship')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('dependentRelationship'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, dependentRelationship: value })}
                              />
                              <div className="md:col-span-2">
                                  <RequestInputField
                                    label="Observações"
                                    name="notes"
                                    required={false}
                                    value={requestDetails?.notes || ''}
                                    disabled={!canEdit}
                                    errorMessage={getRequestError('notes')}
                                    showFeedbackButton={canMarkFeedback}
                                    onFeedback={() => { setFeedbackField('notes'); setFeedbackTargetId(currentReq?.id || null); }}
                                    onChange={(value) => setRequestDetails({ ...requestDetails, notes: value })}
                                  />
                              </div>
                          </div>
                      )}

                      {currentType === 'Atualiza\u00e7\u00e3o Cadastro' && (() => {
                          const updates = Array.isArray(requestDetails?.updates) ? requestDetails.updates : [];
                          const fieldOptions = [
                              'Nome', 'CPF', 'RG', 'PIS', 'Cargo', 'Sal\u00e1rio', 'Email', 'Telefone',
                              'Endereço', 'Posto/Setor', 'Banco', 'Agência', 'Conta', 'Tipo de Conta', 'CTPS', 'Título Eleitor'
                          ];
                          return (
                              <div className="space-y-4">
                                  {updates.length === 0 && (
                                      <div className="p-4 border border-dashed rounded-lg text-center text-slate-400 text-sm">
                                          Nenhuma alteracao adicionada.
                                      </div>
                                  )}
                                  {updates.map((item: any, idx: number) => (
                                      <div key={`${item.field || 'field'}-${idx}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Campo a Atualizar</label>
                                              <select
                                                  className="w-full border rounded-lg p-2.5 text-sm"
                                                  value={item.field || ''}
                                                  disabled={!canEdit}
                                                  onChange={(e) => {
                                                      const next = [...updates];
                                                      next[idx] = { ...next[idx], field: e.target.value };
                                                      setRequestDetails({ ...requestDetails, updates: next });
                                                  }}
                                              >
                                                  <option value="">Selecione...</option>
                                                  {fieldOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                              </select>
                                          </div>
                                          <RequestInputField
                                            label="Novo Valor/Descricao"
                                            name={`value-${idx}`}
                                            required={false}
                                            value={item.value || ''}
                                            disabled={!canEdit}
                                            errorMessage={getRequestError(`value-${idx}`)}
                                            showFeedbackButton={canMarkFeedback}
                                            onFeedback={() => { setFeedbackField(`value-${idx}`); setFeedbackTargetId(currentReq?.id || null); }}
                                            onChange={(value) => {
                                                const next = [...updates];
                                                next[idx] = { ...next[idx], value };
                                                setRequestDetails({ ...requestDetails, updates: next });
                                            }}
                                          />
                                          {canEdit && (
                                              <div className="md:col-span-2 flex justify-end">
                                                  <button
                                                      type="button"
                                                      className="text-xs text-red-600 hover:underline"
                                                      onClick={() => {
                                                          const next = updates.filter((_: any, i: number) => i !== idx);
                                                          setRequestDetails({ ...requestDetails, updates: next });
                                                      }}
                                                  >
                                                      Remover campo
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  ))}
                                  {canEdit && (
                                      <button
                                          type="button"
                                          onClick={() => setRequestDetails({ ...requestDetails, updates: [...updates, { field: '', value: '' }] })}
                                          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg"
                                      >
                                          <Plus size={14} /> Adicionar campo
                                      </button>
                                  )}
                                  <div className="md:col-span-2">
                                      <RequestInputField
                                        label="Observações"
                                        name="notes"
                                        required={false}
                                        value={requestDetails?.notes || ''}
                                        disabled={!canEdit}
                                        errorMessage={getRequestError('notes')}
                                        showFeedbackButton={canMarkFeedback}
                                        onFeedback={() => { setFeedbackField('notes'); setFeedbackTargetId(currentReq?.id || null); }}
                                        onChange={(value) => setRequestDetails({ ...requestDetails, notes: value })}
                                      />
                                  </div>
                              </div>
                          );
                      })()}

                        {currentType === 'Demiss\u00e3o' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <RequestInputField
                                label="Ultimo Dia de Trabalho"
                                name="lastDay"
                                type="date"
                                required={true}
                                value={requestDetails?.lastDay || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('lastDay')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('lastDay'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, lastDay: value })}
                               
                              />
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Desligamento</label>
                                  <select
                                      className="w-full border rounded-lg p-2.5 text-sm"
                                      value={requestDetails?.type || ''}
                                      onChange={e => setRequestDetails({ ...requestDetails, type: e.target.value })}
                                      disabled={!canEdit}
                                  >
                                      <option value="">Selecione...</option>
                                      <option>Pedido de Demissão</option>
                                      <option>Dispensa sem Justa Causa</option>
                                      <option>Dispensa com Justa Causa</option>
                                      <option>Acordo Comum</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aviso Previo</label>
                                  <select
                                      className="w-full border rounded-lg p-2.5 text-sm"
                                      value={requestDetails?.aviso || ''}
                                      onChange={e => setRequestDetails({ ...requestDetails, aviso: e.target.value })}
                                      disabled={!canEdit}
                                  >
                                      <option value="">Selecione...</option>
                                      <option>Trabalhado</option>
                                      <option>Indenizado</option>
                                  </select>
                              </div>
                              <RequestInputField
                                label="Motivo/Observações"
                                name="reason"
                                required={false}
                                value={requestDetails?.reason || ''}
                                disabled={!canEdit}
                                errorMessage={getRequestError('reason')}
                                showFeedbackButton={canMarkFeedback}
                                onFeedback={() => { setFeedbackField('reason'); setFeedbackTargetId(currentReq?.id || null); }}
                                onChange={(value) => setRequestDetails({ ...requestDetails, reason: value })}
                               
                              />
                          </div>
                      )}
                  </div>

                  <div className="pt-2">
                      <h3 className="text-sm font-bold text-slate-800 mb-3">Documentos</h3>
                      {currentType === 'F\u00e9rias' && role === 'client' && (
                          <div className="mb-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                              Os documentos de f\u00e9rias ser\u00e3o enviados pelo administrador durante a an\u00e1lise.
                          </div>
                      )}
                      {currentType === 'Demiss\u00e3o' && role === 'client' && requestDetails?.type !== 'Pedido de Demissão' && (
                          <div className="mb-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                              A carta de pedido de demiss\u00e3o \u00e9 solicitada apenas quando o tipo de desligamento \u00e9 "Pedido de Demissão".
                          </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {visibleDocs.map(doc => {
                              const docFeedback = requestFeedbacks.find(f => f.fieldName === `doc:${doc.id}` && !f.resolved);
                              const attachments = requestAttachments.filter(att => parseAttachmentName(att.name).docId === doc.id);
                              const pending = pendingRequestFiles.filter(p => p.docId === doc.id);
                              return (
                                  <div key={doc.id} className={`border rounded-xl p-4 ${docFeedback ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
                                      <div className="flex items-start justify-between gap-3">
                                          <div>
                                              <p className="text-sm font-bold text-slate-800">
                                                  {doc.label} {doc.required && <span className="text-red-500">*</span>}
                                              </p>
                                              {(doc.adminOnly || doc.clientOnly) && (
                                                  <p className="text-[10px] text-slate-400">
                                                      {doc.adminOnly ? 'Envio do administrador' : 'Envio do cliente'}
                                                  </p>
                                              )}
                                              {docFeedback && <p className="text-[11px] text-red-600 mt-1">{docFeedback.message}</p>}
                                              <p className="text-[11px] text-slate-400">{attachments.length + pending.length} arquivo(s)</p>
                                          </div>
                                          {canMarkFeedback && (
                                              <button
                                                  onClick={() => { setFeedbackField(`doc:${doc.id}`); setFeedbackTargetId(currentReq?.id || null); }}
                                                  className="text-red-400 hover:text-red-600"
                                                  title="Apontar erro no documento"
                                              >
                                                  <AlertTriangle size={16} />
                                              </button>
                                          )}
                                      </div>
                                      <div className="mt-3 space-y-2">
                                          {attachments.map(att => {
                                              const parsed = parseAttachmentName(att.name);
                                              return (
                                                  <a key={att.id} href={getAttachmentDownloadUrl(att.id)} target="_blank" className="flex items-center gap-2 text-xs text-blue-600 hover:underline">
                                                      <Paperclip size={14} /> {parsed.displayName}
                                                  </a>
                                              );
                                          })}
                                          {pending.map((p, idx) => (
                                              <div key={`${p.docId}-${idx}`} className="text-xs text-amber-600 flex items-center gap-2">
                                                  <Clock size={14} /> {p.file.name} (pendente envio)
                                              </div>
                                          ))}
                                          {attachments.length === 0 && pending.length === 0 && (
                                              <p className="text-xs text-slate-400">Nenhum arquivo enviado.</p>
                                          )}
                                      </div>
                                      {canUploadDoc(doc) && (
                                          <div className="mt-3">
                                              <input
                                                  id={`req-doc-${doc.id}`}
                                                  type="file"
                                                  className="hidden"
                                                  onChange={async (e) => {
                                                      const input = e.currentTarget;
                                                      const file = input.files?.[0];
                                                      if (!file) return;
                                                      input.value = '';
                                                      await handleRequestFileSelect(doc.id, file, currentReq?.id);
                                                  }}
                                              />
                                              <label htmlFor={`req-doc-${doc.id}`} className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
                                                  <UploadCloud size={14} /> Adicionar arquivo
                                              </label>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  <div className="pt-4 flex flex-wrap justify-between gap-2">
                      <button onClick={() => setView(currentReq ? 'list' : 'employee_details')} className="px-6 py-2 border rounded-lg font-bold">Cancelar</button>
                      <div className="flex flex-wrap gap-2">
                          {role === 'client' && canEdit && (
                              <button
                                  onClick={async () => {
                                      const missingDocs = getMissingRequiredDocs({ includeAdminOnly: false, includeClientOnly: true });
                                      if (missingDocs.length > 0) {
                                          alert(`Envie os documentos obrigatorios: ${missingDocs.join(', ')}`);
                                          return;
                                      }
                                      if (currentReq) {
                                          await Promise.all(requestFeedbacks.filter(f => !f.resolved).map(f => resolveFieldFeedback(f.id)));
                                      }
                                      await handleSubmitRequest();
                                  }}
                                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
                              >
                                  {currentReq?.status === 'Pendencia' ? 'Reenviar Solicitação' : 'Enviar Solicitação'}
                              </button>
                          )}
                          {canCancelRequest && (
                              <button
                                  onClick={async () => {
                                      const updated = { ...currentReq, status: 'Cancelado' as HRRequestStatus, updatedAt: new Date().toISOString() };
                                      await updateHRRequest(updated);
                                      setSelectedRequest(updated);
                                      refreshData();
                                  }}
                                  className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold"
                              >
                                  Cancelar Solicitação
                              </button>
                          )}

                          {role === 'admin' && currentReq && (
                              <>
                                  {currentReq.status === 'Solicitado' && (
                                      <button onClick={() => handleUpdateRequestStatus(currentReq, 'Em Analise')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">
                                          Iniciar Analise
                                      </button>
                                  )}
                                  {currentReq.status === 'Em Analise' && (
                                      <>
                                          <button onClick={() => handleUpdateRequestStatus(currentReq, 'Pendencia')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">
                                              Marcar Pendencia
                                          </button>
                                          {currentType === 'F\u00e9rias' ? (
                                              <button
                                                  onClick={() => {
                                                      const missingDocs = getMissingRequiredDocs({ includeAdminOnly: true, includeClientOnly: true });
                                                      if (missingDocs.length > 0) {
                                                          alert(`Envie os documentos obrigatorios antes de agendar: ${missingDocs.join(', ')}`);
                                                          return;
                                                      }
                                                      handleUpdateRequestStatus(currentReq, 'Agendado');
                                                  }}
                                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                              >
                                                  Agendar Férias
                                              </button>
                                          ) : (
                                              <button
                                                  onClick={() => {
                                                      const missingDocs = getMissingRequiredDocs({ includeAdminOnly: true, includeClientOnly: true });
                                                      if (missingDocs.length > 0) {
                                                          alert(`Envie os documentos obrigatorios antes de finalizar: ${missingDocs.join(', ')}`);
                                                          return;
                                                      }
                                                      handleUpdateRequestStatus(currentReq, 'Finalizado');
                                                  }}
                                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                              >
                                                  Finalizar
                                              </button>
                                          )}
                                      </>
                                  )}
                                  {currentReq.status === 'Pendencia' && (
                                      <button onClick={() => handleUpdateRequestStatus(currentReq, 'Em Analise')} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold">
                                          Retomar Analise
                                      </button>
                                  )}
                              </>
                          )}
                      </div>
                  </div>
              </div>

              {/* FEEDBACK OVERLAY (ADMIN ONLY) */}
              {feedbackField && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
                      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
                          <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                              <AlertTriangle size={20}/> Erro no campo: {feedbackField}
                          </h4>
                          <textarea 
                              className="w-full border rounded-lg p-2 text-sm h-24 mb-4" 
                              placeholder="Descreva o que esta errado neste campo..."
                              value={feedbackMsg}
                              onChange={e => setFeedbackMsg(e.target.value.toUpperCase())}
                              style={{ textTransform: 'uppercase' }}
                          ></textarea>
                          <div className="flex justify-end gap-2">
                              <button onClick={() => { setFeedbackField(''); setFeedbackTargetId(null); }} className="px-4 py-2 text-slate-500">Cancelar</button>
                              <button 
                                  onClick={async () => {
                                      if (!feedbackTargetId) return;
                                      await addFieldFeedback({
                                          id: createId(),
                                          targetId: feedbackTargetId,
                                          fieldName: feedbackField,
                                          message: feedbackMsg,
                                          resolved: false
                                      });
                                      setFeedbackField('');
                                      setFeedbackTargetId(null);
                                      setFeedbackMsg('');
                                      refreshData();
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
                              >
                                  Salvar Feedback
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const renderGeneralList = () => (
      <div className="space-y-8 animate-fadeIn">
          {/* TAB CONTENT: EMPLOYEES */}
          {activeTab === 'employees' && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div className="relative max-w-sm w-full">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                          <input
                            type="text"
                            placeholder="Buscar funcionário..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value.toUpperCase())}
                            style={{ textTransform: 'uppercase' }}
                          />
                      </div>
                      <div className="flex items-center gap-3">
                          <select
                              className="border border-slate-300 rounded-lg p-2 text-sm"
                              value={employeeStatusFilter}
                              onChange={(e) => setEmployeeStatusFilter(e.target.value)}
                          >
                              <option value="Todos">Status: Todos</option>
                              <option value="Ativo">Ativo</option>
                              <option value="Gozando Férias">Gozando Férias</option>
                          </select>
                          {role === 'client' && (
                              <button onClick={() => { setView('admission_form'); setSelectedItem(null); setFormAdmission({}); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
                                  <UserPlus size={18}/> Nova Admissão
                              </button>
                          )}
                      </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                  <th className="px-6 py-4">Funcionário</th>
                                  <th className="px-6 py-4">Cargo / Posto</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4">Admissão</th>
                                  <th className="px-6 py-4 text-right">Ação</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {employees.filter(emp => {
                                  if (emp.status === 'Inativo' || emp.status === 'Desligado') return false;
                                  if (employeeStatusFilter === 'Todos') return true;
                                  return emp.status === employeeStatusFilter;
                              }).filter(emp => {
                                  if (!employeeSearch.trim()) return true;
                                  const term = employeeSearch.trim().toLowerCase();
                                  return emp.name.toLowerCase().includes(term) || emp.cpf.toLowerCase().includes(term);
                              }).map(emp => {
                                  const photoUrl = getEmployeePhotoUrl(emp);
                                  return (
                                  <tr key={emp.id} className="hover:bg-slate-50 group">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              {photoUrl ? (
                                                  <img
                                                      src={photoUrl}
                                                      alt={emp.name}
                                                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                                  />
                                              ) : (
                                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{emp.name.substring(0,1)}</div>
                                              )}
                                              <div>
                                                  <p className="font-bold text-slate-800">{emp.name}</p>
                                                  <p className="text-[10px] text-slate-400">{emp.cpf}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <p className="font-medium text-slate-700">{emp.role}</p>
                                          <p className="text-[10px] text-slate-400">{sites.find(s => s.id === emp.workSiteId)?.name || 'Sede'}</p>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(emp.status)}`}>{emp.status}</span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(emp.admissionDate).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => { setSelectedItem(emp); setView('employee_details'); }}
                                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center justify-end gap-1 ml-auto"
                                          >
                                              Prontuário <ChevronRight size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                                  );
                              })}
                              {employees.filter(emp => emp.status !== 'Inativo' && emp.status !== 'Desligado').filter(emp => {
                                  if (!employeeSearch.trim()) return true;
                                  const term = employeeSearch.trim().toLowerCase();
                                  return emp.name.toLowerCase().includes(term) || emp.cpf.toLowerCase().includes(term);
                              }).length === 0 && (
                                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 italic">Nenhum funcionário ativo.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* TAB CONTENT: INACTIVE EMPLOYEES */}
          {activeTab === 'inactive' && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div className="relative max-w-sm w-full">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                          <input
                            type="text"
                            placeholder="Buscar funcionário..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                            value={inactiveSearch}
                            onChange={(e) => setInactiveSearch(e.target.value.toUpperCase())}
                            style={{ textTransform: 'uppercase' }}
                          />
                      </div>
                      <select
                          className="border border-slate-300 rounded-lg p-2 text-sm"
                          value={inactiveStatusFilter}
                          onChange={(e) => setInactiveStatusFilter(e.target.value)}
                      >
                          <option value="Todos">Status: Todos</option>
                          <option value="Inativo">Inativo</option>
                          <option value="Desligado">Desligado</option>
                      </select>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                  <th className="px-6 py-4">Funcionário</th>
                                  <th className="px-6 py-4">Cargo / Posto</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4">Admissão</th>
                                  <th className="px-6 py-4 text-right">Ação</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {employees.filter(emp => {
                                  const isInactive = emp.status === 'Inativo' || emp.status === 'Desligado';
                                  if (!isInactive) return false;
                                  if (inactiveStatusFilter === 'Todos') return true;
                                  return emp.status === inactiveStatusFilter;
                              }).filter(emp => {
                                  if (!inactiveSearch.trim()) return true;
                                  const term = inactiveSearch.trim().toLowerCase();
                                  return emp.name.toLowerCase().includes(term) || emp.cpf.toLowerCase().includes(term);
                              }).map(emp => {
                                  const photoUrl = getEmployeePhotoUrl(emp);
                                  return (
                                  <tr key={emp.id} className="hover:bg-slate-50 group">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              {photoUrl ? (
                                                  <img
                                                      src={photoUrl}
                                                      alt={emp.name}
                                                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                                  />
                                              ) : (
                                                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">{emp.name.substring(0,1)}</div>
                                              )}
                                              <div>
                                                  <p className="font-bold text-slate-800">{emp.name}</p>
                                                  <p className="text-[10px] text-slate-400">{emp.cpf}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <p className="font-medium text-slate-700">{emp.role}</p>
                                          <p className="text-[10px] text-slate-400">{sites.find(s => s.id === emp.workSiteId)?.name || 'Sede'}</p>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(emp.status)}`}>{emp.status}</span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{new Date(emp.admissionDate).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => { setSelectedItem(emp); setView('employee_details'); }}
                                            className="text-blue-600 hover:text-blue-800 font-bold flex items-center justify-end gap-1 ml-auto"
                                          >
                                              Prontuário <ChevronRight size={16}/>
                                          </button>
                                      </td>
                                  </tr>
                                  );
                              })}
                              {employees.filter(emp => emp.status === 'Inativo' || emp.status === 'Desligado').filter(emp => {
                                  if (!inactiveSearch.trim()) return true;
                                  const term = inactiveSearch.trim().toLowerCase();
                                  return emp.name.toLowerCase().includes(term) || emp.cpf.toLowerCase().includes(term);
                              }).length === 0 && (
                                  <tr><td colSpan={5} className="py-12 text-center text-slate-400 italic">Nenhum funcionário inativo.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* TAB CONTENT: ADMISSIONS */}
          {activeTab === 'admissions' && (
              <div className="space-y-4">
                  <div className="flex flex-wrap justify-between gap-3">
                      <div className="relative max-w-sm w-full">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                          <input
                            type="text"
                            placeholder="Buscar candidato..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                            value={admissionSearch}
                            onChange={(e) => setAdmissionSearch(e.target.value.toUpperCase())}
                            style={{ textTransform: 'uppercase' }}
                          />
                      </div>
                      <select
                          className="border border-slate-300 rounded-lg p-2 text-sm"
                          value={admissionStatusFilter}
                          onChange={(e) => setAdmissionStatusFilter(e.target.value)}
                      >
                          <option value="Todos">Status: Todos</option>
                          <option value="Novo">Novo</option>
                          <option value="Validando">Validando</option>
                          <option value="Formulario com Erro">Formulario com Erro</option>
                          <option value="Validado">Validado</option>
                          <option value="Finalizado">Finalizado</option>
                      </select>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                              <th className="px-6 py-4">Candidato</th>
                              <th className="px-6 py-4">Cargo Pretendido</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Início Previsto</th>
                              <th className="px-6 py-4 text-right">Ação</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {admissions.filter(adm => admissionStatusFilter === 'Todos' || adm.status === admissionStatusFilter).filter(adm => {
                              if (!admissionSearch.trim()) return true;
                              const term = admissionSearch.trim().toLowerCase();
                              return adm.fullName.toLowerCase().includes(term) || adm.cpf.toLowerCase().includes(term);
                          }).map(adm => {
                              const photoUrl = getAdmissionPhotoUrl(adm.id);
                              return (
                              <tr key={adm.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          {photoUrl ? (
                                              <img
                                                  src={photoUrl}
                                                  alt={adm.fullName}
                                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                              />
                                          ) : (
                                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                  {adm.fullName.substring(0, 1)}
                                              </div>
                                          )}
                                          <div>
                                              <p className="font-bold text-slate-800">{adm.fullName}</p>
                                              <p className="text-[10px] text-slate-400">{adm.cpf}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">{adm.role}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(adm.status)}`}>
                                          {adm.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">{new Date(adm.expectedStartDate).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                        onClick={() => {
                                            setSelectedItem(adm); 
                                            setView('admission_form');
                                        }}
                                        className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800"
                                      >
                                          {role === 'admin' ? 'Validar Ficha' : 'Ver/Editar'}
                                      </button>
                                  </td>
                              </tr>
                              );
                          })}
                          {admissions.filter(adm => admissionStatusFilter === 'Todos' || adm.status === admissionStatusFilter).filter(adm => {
                              if (!admissionSearch.trim()) return true;
                              const term = admissionSearch.trim().toLowerCase();
                              return adm.fullName.toLowerCase().includes(term) || adm.cpf.toLowerCase().includes(term);
                          }).length === 0 && (
                               <tr><td colSpan={5} className="py-12 text-center text-slate-400 italic">Nenhuma admissão em curso.</td></tr>
                          )}
                      </tbody>
                  </table>
                  </div>
              </div>
          )}

          {/* TAB CONTENT: REQUESTS */}
          {activeTab === 'requests' && (
              <div className="space-y-4">
                  <div className="flex flex-wrap justify-between gap-3">
                      <div className="relative max-w-sm w-full">
                          <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
                          <input
                            type="text"
                            placeholder="Buscar funcionário..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                            value={requestSearch}
                            onChange={(e) => setRequestSearch(e.target.value.toUpperCase())}
                            style={{ textTransform: 'uppercase' }}
                          />
                      </div>
                      <div className="flex gap-3">
                      <select
                          className="border border-slate-300 rounded-lg p-2 text-sm"
                          value={requestTypeFilter}
                          onChange={(e) => setRequestTypeFilter(e.target.value)}
                      >
                          <option value="Todos">Tipo: Todos</option>
                          <option value="Férias">Férias</option>
                          <option value="Atestado">Atestado</option>
                          <option value="Demissão">Demissão</option>
                          <option value="Inclusão Dependente">Inclusão Dependente</option>
                          <option value="Atualização Cadastro">Atualização Cadastro</option>
                      </select>
                      <select
                          className="border border-slate-300 rounded-lg p-2 text-sm"
                          value={requestStatusFilter}
                          onChange={(e) => setRequestStatusFilter(e.target.value)}
                      >
                          <option value="Todos">Status: Todos</option>
                          <option value="Solicitado">Solicitado</option>
                          <option value="Em Analise">Em Analise</option>
                          <option value="Pendencia">Pendencia</option>
                          <option value="Agendado">Agendado</option>
                          <option value="Finalizado">Finalizado</option>
                          <option value="Cancelado">Cancelado</option>
                      </select>
                      </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                          <tr>
                              <th className="px-6 py-4">Funcionário</th>
                              <th className="px-6 py-4">Tipo</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Data Solicitação</th>
                              <th className="px-6 py-4 text-right">Acao</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {hrRequests.filter(r => {
                              if (requestTypeFilter != 'Todos' && r.type != requestTypeFilter) return false;
                              if (requestStatusFilter != 'Todos' && r.status != requestStatusFilter) return false;
                              if (requestSearch.trim()) {
                                  const term = requestSearch.trim().toLowerCase();
                                  const emp = employees.find(e => e.id === r.employeeId);
                                  const name = emp?.name?.toLowerCase() || '';
                                  const cpf = emp?.cpf?.toLowerCase() || '';
                                  if (!name.includes(term) && !cpf.includes(term)) return false;
                              }
                              return true;
                          }).map(r => {
                              const emp = employees.find(e => e.id === r.employeeId);
                              return (
                                  <tr key={r.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-bold text-slate-800">{emp?.name || 'Funcionário'}</td>
                                      <td className="px-6 py-4 font-medium text-slate-600">{r.type}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(r.status)}`}>{r.status}</span>
                                      </td>
                                      <td className="px-6 py-4 text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex justify-end gap-2">
                                              <button 
                                                onClick={() => {
                                                    setSelectedRequest(r);
                                                    setSelectedType(r.type);
                                                    setView('request_details');
                                                }}
                                                className="bg-slate-900 text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-slate-800"
                                              >
                                                  Detalhes
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              )
                          })}
                          {hrRequests.filter(r => {
                              if (requestTypeFilter != 'Todos' && r.type != requestTypeFilter) return false;
                              if (requestStatusFilter != 'Todos' && r.status != requestStatusFilter) return false;
                              if (requestSearch.trim()) {
                                  const term = requestSearch.trim().toLowerCase();
                                  const emp = employees.find(e => e.id === r.employeeId);
                                  const name = emp?.name?.toLowerCase() || '';
                                  const cpf = emp?.cpf?.toLowerCase() || '';
                                  if (!name.includes(term) && !cpf.includes(term)) return false;
                              }
                              return true;
                          }).length == 0 && (
                               <tr><td colSpan={5} className="py-12 text-center text-slate-400 italic">Nenhuma solicitacao pendente.</td></tr>
                          )}
                      </tbody>
                  </table>
                  </div>
              </div>
          )}

          {/* TAB CONTENT: TIMESHEETS */}
          {activeTab === 'timesheets' && (
              <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                              <tr>
                                  <th className="px-6 py-4">Funcionário</th>
                                  <th className="px-6 py-4">Período</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {timeSheets.map(sheet => {
                                  const emp = employees.find(e => e.id === sheet.employeeId);
                                  return (
                                      <tr key={sheet.id} className="hover:bg-slate-50">
                                          <td className="px-6 py-4 font-bold text-slate-800">{emp?.name || 'Funcionário'}</td>
                                          <td className="px-6 py-4 text-slate-600">{formatPeriod(sheet)}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(sheet.status)}`}>{sheet.status}</span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              {role === 'client' && sheet.status === 'Enviado' && (
                                                  <div className="flex justify-end gap-2">
                                                      <button
                                                          onClick={async () => {
                                                              await updateTimeSheet({ ...sheet, status: 'Pendencia', updatedAt: new Date().toISOString() });
                                                          }}
                                                          className="px-3 py-1.5 rounded text-[10px] font-bold border border-red-200 text-red-600 hover:bg-red-50"
                                                      >
                                                          Devolver
                                                      </button>
                                                      <button
                                                          onClick={async () => {
                                                              await updateTimeSheet({ ...sheet, status: 'Aprovado', approvedBy: currentUser.id, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
                                                          }}
                                                          className="px-3 py-1.5 rounded text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                                                      >
                                                          Aprovar
                                                      </button>
                                                  </div>
                                              )}
                                              {role !== 'client' && (
                                                  <span className="text-[10px] text-slate-400">Somente leitura</span>
                                              )}
                                          </td>
                                      </tr>
                                  );
                              })}
                              {timeSheets.length === 0 && (
                                  <tr><td colSpan={4} className="py-12 text-center text-slate-400 italic">Nenhuma folha de ponto enviada.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {/* TAB CONTENT: SITES */}
          {activeTab === 'sites' && renderWorkSites()}
      </div>
  );

  const renderContent = () => {
    switch (view) {
        case 'employee_details': return renderEmployeeDetails(selectedItem);
        case 'admission_form': return renderAdmissionForm(selectedItem);
        case 'request_form': return renderRequestForm();
        case 'request_details': return renderRequestForm();
        default: return renderGeneralList();
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <Users className="text-blue-600" size={32}/> Gestão de RH & Capital Humano
            </h1>
        </div>
        {renderContent()}
    </div>
  );
};

export default HRManagement;
