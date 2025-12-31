import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, Clock, Filter, Search, AlertCircle, FileText, Trash2, Edit2, Plus, X, Upload } from 'lucide-react';
import { Role, MonthlyRoutine, ObligationDefinition, RoutineStatus, RequestAttachment } from '../types';
import { addObligation, deleteObligation, getMonthlyRoutines, getObligations, updateMonthlyRoutineStatus, updateObligation, getCategories, getRoutineAttachments, uploadRoutineAttachment, getApiUrl } from '../services/mockData';

interface MonthlyRoutinesProps {
  role: Role;
  currentCompanyId: string;
}

const MONTHS = [
  { key: '1', label: 'Jan' },
  { key: '2', label: 'Fev' },
  { key: '3', label: 'Mar' },
  { key: '4', label: 'Abr' },
  { key: '5', label: 'Mai' },
  { key: '6', label: 'Jun' },
  { key: '7', label: 'Jul' },
  { key: '8', label: 'Ago' },
  { key: '9', label: 'Set' },
  { key: '10', label: 'Out' },
  { key: '11', label: 'Nov' },
  { key: '12', label: 'Dez' }
];

const DAY_OPTIONS = ['Nao tem', ...Array.from({ length: 31 }, (_, i) => `Dia ${i + 1}`)];

const STATUS_OPTIONS: RoutineStatus[] = ['Pendente', 'Em Analise', 'Concluido', 'Atrasado'];

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluido':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Atrasado':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'Pendente':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const createDefaultMonthlyDue = () => {
  const result: Record<string, string> = {};
  MONTHS.forEach((m) => {
    result[m.key] = 'Nao tem';
  });
  return result;
};

const MonthlyRoutines: React.FC<MonthlyRoutinesProps> = ({ role, currentCompanyId }) => {
  const [view, setView] = useState<'list' | 'catalog'>('list');
  const [selectedDept, setSelectedDept] = useState<string>('Todos');
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [routines, setRoutines] = useState<MonthlyRoutine[]>([]);
  const [obligations, setObligations] = useState<ObligationDefinition[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<MonthlyRoutine | null>(null);
  const [routineAttachments, setRoutineAttachments] = useState<RequestAttachment[]>([]);
  const [uploadData, setUploadData] = useState({ title: '', category: '', referenceDate: new Date().toISOString().split('T')[0], file: null as File | null });
  const [formData, setFormData] = useState<ObligationDefinition>({
    id: '',
    name: '',
    nickname: '',
    department: 'Contabil',
    responsible: '',
    expectedMinutes: 0,
    monthlyDue: createDefaultMonthlyDue(),
    reminderDays: 5,
    reminderType: 'Dias uteis',
    nonBusinessRule: 'Antecipar para o dia util anterior',
    saturdayBusiness: false,
    competenceRule: 'Mes anterior',
    requiresRobot: false,
    hasFine: false,
    alertGuide: true,
    active: true
  });

  const refreshData = () => {
    setRoutines(getMonthlyRoutines());
    setObligations(getObligations());
    const cats = getCategories();
    setCategories(cats);
    if (!uploadData.category && cats.length > 0) {
      setUploadData((prev) => ({ ...prev, category: cats[0] }));
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (selectedRoutine) {
      setRoutineAttachments(getRoutineAttachments(selectedRoutine.id));
    }
  }, [selectedRoutine]);

  const filteredRoutines = useMemo(() => {
    const scoped = role === 'client'
      ? routines.filter((routine) => routine.companyId === currentCompanyId)
      : (currentCompanyId === 'all' ? routines : routines.filter((routine) => routine.companyId === currentCompanyId));

    return scoped.filter((routine) => {
      const matchesDept = selectedDept === 'Todos' || routine.department === selectedDept;
      const matchesStatus = filterStatus === 'Todos' || routine.status === filterStatus;
      const matchesText = routine.obligationName.toLowerCase().includes(filterText.toLowerCase()) || routine.companyName.toLowerCase().includes(filterText.toLowerCase());
      return matchesDept && matchesStatus && matchesText;
    });
  }, [routines, selectedDept, filterStatus, filterText, role, currentCompanyId]);

  const handleStatusChange = async (id: string, status: RoutineStatus) => {
    await updateMonthlyRoutineStatus(id, status);
    refreshData();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      id: '',
      name: '',
      nickname: '',
      department: 'Contabil',
      responsible: '',
      expectedMinutes: 0,
      monthlyDue: createDefaultMonthlyDue(),
      reminderDays: 5,
      reminderType: 'Dias uteis',
      nonBusinessRule: 'Antecipar para o dia util anterior',
      saturdayBusiness: false,
      competenceRule: 'Mes anterior',
      requiresRobot: false,
      hasFine: false,
      alertGuide: true,
      active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ObligationDefinition = {
      ...formData,
      id: editingId || createId(),
      expectedMinutes: Number(formData.expectedMinutes) || 0,
      reminderDays: Number(formData.reminderDays) || 0,
      monthlyDue: formData.monthlyDue || createDefaultMonthlyDue()
    };
    if (editingId) {
      await updateObligation(payload);
    } else {
      await addObligation(payload);
    }
    resetForm();
    refreshData();
  };

  const handleEdit = (obligation: ObligationDefinition) => {
    setEditingId(obligation.id);
    setFormData({
      ...obligation,
      monthlyDue: obligation.monthlyDue || createDefaultMonthlyDue()
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja remover esta obrigacao?')) {
      await deleteObligation(id);
      refreshData();
    }
  };

  const handleRoutineUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoutine || !uploadData.file || !uploadData.category) return;
    await uploadRoutineAttachment({
      file: uploadData.file,
      routineId: selectedRoutine.id,
      companyId: selectedRoutine.companyId,
      category: uploadData.category,
      title: uploadData.title || undefined,
      referenceDate: uploadData.referenceDate
    });
    setUploadData({ title: '', category: uploadData.category, referenceDate: new Date().toISOString().split('T')[0], file: null });
    setRoutineAttachments(getRoutineAttachments(selectedRoutine.id));
  };

  const DEPARTMENTS = ['Todos', 'Contabil', 'Fiscal', 'Pessoal', 'Legalizacao'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Rotinas Mensais</h2>
          <p className="text-sm text-slate-500">Acompanhamento de obrigacoes e prazos por empresa.</p>
        </div>

        {role === 'admin' && (
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'list' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              onClick={() => setView('list')}
            >
              Acompanhamento
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'catalog' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
              onClick={() => setView('catalog')}
            >
              Cadastro de obrigacoes
            </button>
          </div>
        )}
      </div>

      {view === 'list' && (
        <>
          <div className="flex gap-2 text-xs font-medium text-slate-600 bg-white p-2 rounded-lg shadow-sm border border-slate-100">
            <div className="flex items-center gap-1 px-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Concluido</div>
            <div className="flex items-center gap-1 px-2 border-l"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendente</div>
            <div className="flex items-center gap-1 px-2 border-l"><span className="w-2 h-2 rounded-full bg-red-500"></span> Atrasado</div>
          </div>

          <div className="flex overflow-x-auto gap-2 border-b border-slate-200">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  selectedDept === dept
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText size={16} />
                {dept}
              </button>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por empresa ou obrigacao..."
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter size={18} className="text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="flex-1 md:w-48 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {['Todos', ...STATUS_OPTIONS].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">Obrigacao</th>
                    <th className="px-6 py-4 text-center">Competencia</th>
                    <th className="px-6 py-4 text-center">Prazo limite</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoutines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle size={48} className="mb-2 opacity-20" />
                          Nenhuma rotina encontrada para este filtro.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoutines.map((routine) => (
                      <tr key={routine.id} className="bg-white hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setSelectedRoutine(routine)}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{routine.companyName}</p>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                            {routine.department || 'Geral'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{routine.obligationName}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">
                            {routine.competence}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            new Date(routine.deadline) < new Date() && routine.status !== 'Concluido'
                              ? 'text-red-600 bg-red-50'
                              : 'text-slate-600'
                          }`}>
                            <Calendar size={14} />
                            {new Date(routine.deadline).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {role === 'admin' ? (
                            <select
                              value={routine.status}
                              onChange={(e) => handleStatusChange(routine.id, e.target.value as RoutineStatus)}
                              onClick={(e) => e.stopPropagation()}
                              className="border border-slate-200 rounded-lg text-xs px-2 py-1"
                            >
                              {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(routine.status)}`}>
                              {routine.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg">
                            <Clock size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'catalog' && role === 'admin' && (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Cadastro de obrigacao</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nome da obrigacao</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Mininome</label>
                  <input
                    type="text"
                    value={formData.nickname || ''}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Departamento</label>
                  <select
                    value={formData.department || 'Contabil'}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border rounded-lg p-2 mt-1"
                  >
                    <option value="Contabil">Contabil</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="Pessoal">Pessoal</option>
                    <option value="Legalizacao">Legalizacao</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Responsavel</label>
                  <input
                    type="text"
                    value={formData.responsible || ''}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tempo previsto (min)</label>
                  <input
                    type="number"
                    value={formData.expectedMinutes || 0}
                    onChange={(e) => setFormData({ ...formData, expectedMinutes: Number(e.target.value) })}
                    className="w-full border rounded-lg p-2 mt-1"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Entregas por mes</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {MONTHS.map((month) => (
                    <div key={month.key}>
                      <label className="block text-xs font-medium text-slate-500">Entrega {month.label}</label>
                      <select
                        value={formData.monthlyDue?.[month.key] || 'Nao tem'}
                        onChange={(e) => setFormData({
                          ...formData,
                          monthlyDue: { ...(formData.monthlyDue || {}), [month.key]: e.target.value }
                        })}
                        className="w-full border rounded-lg p-2 mt-1"
                      >
                        {DAY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Lembrar responsavel (dias antes)</label>
                    <input
                      type="number"
                      value={formData.reminderDays || 0}
                      onChange={(e) => setFormData({ ...formData, reminderDays: Number(e.target.value) })}
                      className="w-full border rounded-lg p-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Tipo de dias antes</label>
                    <select
                      value={formData.reminderType || 'Dias uteis'}
                      onChange={(e) => setFormData({ ...formData, reminderType: e.target.value })}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="Dias uteis">Dias uteis</option>
                      <option value="Dias corridos">Dias corridos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Prazo em dias nao-uteis</label>
                    <select
                      value={formData.nonBusinessRule || 'Antecipar para o dia util anterior'}
                      onChange={(e) => setFormData({ ...formData, nonBusinessRule: e.target.value })}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="Antecipar para o dia util anterior">Antecipar para o dia util anterior</option>
                      <option value="Posterior ao proximo dia util">Posterior ao proximo dia util</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Sabado e util?</label>
                    <select
                      value={formData.saturdayBusiness ? 'Sim' : 'Nao'}
                      onChange={(e) => setFormData({ ...formData, saturdayBusiness: e.target.value === 'Sim' })}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="Nao">Nao</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Competencias referentes a</label>
                    <select
                      value={formData.competenceRule || 'Mes anterior'}
                      onChange={(e) => setFormData({ ...formData, competenceRule: e.target.value })}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="Mes anterior">Mes anterior</option>
                      <option value="Mes atual">Mes atual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Passivel de multa?</label>
                    <select
                      value={formData.hasFine ? 'Sim' : 'Nao'}
                      onChange={(e) => setFormData({ ...formData, hasFine: e.target.value === 'Sim' })}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="Nao">Nao</option>
                      <option value="Sim">Sim</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Alertar guia nao lida?</label>
                    <select
                      value={formData.alertGuide ? 'Sim' : 'Nao'}
                      onChange={(e) => setFormData({ ...formData, alertGuide: e.target.value === 'Sim' })}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="Sim">Sim</option>
                      <option value="Nao">Nao</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Ativa?</label>
                    <select
                      value={formData.active ? 'Sim' : 'Nao'}
                      onChange={(e) => setFormData({ ...formData, active: e.target.value === 'Sim' })}
                      className="w-full border rounded-lg p-2 mt-1"
                    >
                      <option value="Sim">Sim</option>
                      <option value="Nao">Nao</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Limpar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingId ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-700">Obrigacoes cadastradas</h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-blue-600 flex items-center gap-1"
              >
                <Plus size={14} /> Novo
              </button>
            </div>
            <div className="space-y-3">
              {obligations.length === 0 && (
                <p className="text-sm text-slate-500">Nenhuma obrigacao cadastrada.</p>
              )}
              {obligations.map((obligation) => (
                <div key={obligation.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{obligation.name}</p>
                      <p className="text-xs text-slate-500">{obligation.department || 'Geral'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(obligation)} className="p-1 text-slate-500 hover:text-blue-600">
                        <Edit2 size={16} />
                      </button>
                      <button type="button" onClick={() => handleDelete(obligation.id)} className="p-1 text-slate-500 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><CheckCircle size={12} /> {obligation.active ? 'Ativa' : 'Inativa'}</span>
                    {obligation.expectedMinutes ? <span>Tempo: {obligation.expectedMinutes} min</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedRoutine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Detalhes da rotina</h3>
                <p className="text-sm text-slate-500">{selectedRoutine.obligationName}</p>
              </div>
              <button onClick={() => setSelectedRoutine(null)} className="text-slate-500 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Empresa</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedRoutine.companyName}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Competencia</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedRoutine.competence}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500">Prazo</p>
                  <p className="text-sm font-semibold text-slate-800">{new Date(selectedRoutine.deadline).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedRoutine.status)}`}>
                  {selectedRoutine.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium border text-slate-600 border-slate-200">
                  {selectedRoutine.department || 'Geral'}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-700">Arquivos relacionados</h4>
                  {role === 'admin' && (
                    <span className="text-xs text-slate-500">Enviar arquivo para o cliente</span>
                  )}
                </div>

                {routineAttachments.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum arquivo enviado.</p>
                ) : (
                  <div className="space-y-2">
                    {routineAttachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-800">{att.name}</p>
                          <p className="text-xs text-slate-500">{new Date(att.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <a
                          href={`${getApiUrl()}/hr/attachment/file/${att.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Abrir
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {role === 'admin' && (
                <form onSubmit={handleRoutineUpload} className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Upload size={16} /> Upload de arquivo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500">Titulo</label>
                      <input
                        type="text"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Categoria</label>
                      <select
                        value={uploadData.category}
                        onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Data de referencia</label>
                      <input
                        type="date"
                        value={uploadData.referenceDate}
                        onChange={(e) => setUploadData({ ...uploadData, referenceDate: e.target.value })}
                        className="w-full border rounded-lg p-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="file"
                      onChange={(e) => setUploadData({ ...uploadData, file: e.target.files ? e.target.files[0] : null })}
                      className="text-sm"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      disabled={!uploadData.file || !uploadData.category}
                    >
                      Enviar
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyRoutines;
