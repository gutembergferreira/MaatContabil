import React, { useState } from 'react';
import { MOCK_ROUTINES } from '../services/mockData';
import { Department } from '../types';
import { Filter, Search, Calendar, AlertCircle, CheckCircle, Clock, FileText, Briefcase, Scale, Calculator } from 'lucide-react';

const MonthlyRoutines: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<Department | 'Todos'>('Todos');
  const [filterText, setFilterText] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const DEPARTMENTS = [
      { id: 'Todos', label: 'Visão Geral', icon: FileText },
      { id: 'Contábil', label: 'Contábil', icon: Calculator },
      { id: 'Fiscal', label: 'Fiscal', icon: Scale },
      { id: 'Pessoal', label: 'Dep. Pessoal', icon: Briefcase },
      { id: 'Legalização', label: 'Legalização', icon: FileText },
  ];
  
  const STATUSES = ['Todos', 'Pendente', 'Concluído', 'Atrasado', 'Em Análise'];

  const filteredRoutines = MOCK_ROUTINES.filter(r => {
      const matchesDept = selectedDept === 'Todos' || r.department === selectedDept;
      const matchesStatus = filterStatus === 'Todos' || r.status === filterStatus;
      const matchesText = r.title.toLowerCase().includes(filterText.toLowerCase()) || 
                          r.clientName.toLowerCase().includes(filterText.toLowerCase());
      return matchesDept && matchesStatus && matchesText;
  });

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Concluído': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
          case 'Atrasado': return 'bg-red-100 text-red-700 border-red-200';
          case 'Pendente': return 'bg-amber-100 text-amber-700 border-amber-200';
          default: return 'bg-blue-100 text-blue-700 border-blue-200';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Rotinas Mensais</h2>
            <p className="text-sm text-slate-500">Acompanhamento de obrigações e prazos por departamento.</p>
          </div>
          
          <div className="flex gap-2 text-xs font-medium text-slate-600 bg-white p-2 rounded-lg shadow-sm border border-slate-100">
             <div className="flex items-center gap-1 px-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Concluído</div>
             <div className="flex items-center gap-1 px-2 border-l"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendente</div>
             <div className="flex items-center gap-1 px-2 border-l"><span className="w-2 h-2 rounded-full bg-red-500"></span> Atrasado</div>
          </div>
      </div>

      {/* Department Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200">
          {DEPARTMENTS.map(dept => {
              const Icon = dept.icon;
              return (
                <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${selectedDept === dept.id 
                            ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Icon size={16} />
                    {dept.label}
                </button>
              )
          })}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
         <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por cliente, obrigação ou CNPJ..." 
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
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
             </div>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Cliente / Empresa</th>
                <th className="px-6 py-4">Obrigação</th>
                <th className="px-6 py-4 text-center">Competência</th>
                <th className="px-6 py-4 text-center">Prazo Limite</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoutines.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                          <AlertCircle size={48} className="mb-2 opacity-20" />
                          Nenhuma rotina encontrada para este filtro.
                      </td>
                  </tr>
              ) : (
                  filteredRoutines.map((routine) => (
                    <tr key={routine.id} className="bg-white hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{routine.clientName}</p>
                          <span className={`text-[10px] uppercase font-bold tracking-wider 
                              ${routine.department === 'Pessoal' ? 'text-purple-600' : 
                                routine.department === 'Fiscal' ? 'text-blue-600' :
                                routine.department === 'Contábil' ? 'text-indigo-600' : 'text-slate-500'
                              }
                          `}>
                              {routine.department}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{routine.title}</td>
                      <td className="px-6 py-4 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">
                              {routine.competence}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium 
                              ${new Date(routine.deadline) < new Date() && routine.status !== 'Concluído' ? 'text-red-600 bg-red-50' : 'text-slate-600'}`}>
                              <Calendar size={14} />
                              {new Date(routine.deadline).toLocaleDateString('pt-BR')}
                          </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(routine.status)}`}>
                          {routine.status}
                        </span>
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
    </div>
  );
};

export default MonthlyRoutines;