import React, { useState } from 'react';
import { MOCK_EMPLOYEES } from '../services/mockData';
import { UserPlus, FolderOpen, AlertTriangle, UploadCloud, FileText, User, ArrowLeft, Users, Calendar, Briefcase, Paperclip } from 'lucide-react';
import { Role } from '../types';

interface HRManagementProps {
  role: Role;
}

const HRManagement: React.FC<HRManagementProps> = ({ role }) => {
  const [view, setView] = useState<'list' | 'admission' | 'employee_details'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Mock Folder Data
  const employeeFolders = [
      { id: 'f1', name: 'Documentos Pessoais', count: 4 },
      { id: 'f2', name: 'Folha de Pagamento', count: 12 },
      { id: 'f3', name: 'Férias e Afastamentos', count: 2 },
      { id: 'f4', name: 'SST / Exames', count: 3 },
  ];

  // Admissão Flow
  if (view === 'admission') {
     return (
        <div className="max-w-3xl mx-auto">
           <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-blue-600 mb-4 flex items-center gap-1">
               <ArrowLeft size={16} /> Voltar para lista
           </button>

           <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
               <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <UserPlus className="text-blue-600" /> Nova Admissão de Funcionário
               </h3>
               <p className="text-slate-500 text-sm mb-6">Preencha os dados e anexe os documentos digitalizados (PDF) para processamento pelo Departamento Pessoal.</p>
               
               <div className="space-y-6">
                  {/* Info Box */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
                     <AlertTriangle className="text-blue-600 shrink-0" size={20} />
                     <div className="text-sm text-blue-800">
                        <strong>Documentos Obrigatórios:</strong> RG, CPF, Comprovante de Residência, Título de Eleitor, Certidão de Nascimento/Casamento, Carteira de Trabalho Digital (Print).
                     </div>
                  </div>

                  {/* Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nome do funcionário" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cargo / Função</label>
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ex: Auxiliar Administrativo" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Salário Base (R$)</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0,00" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
                        <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Posto de Trabalho / Centro de Custo</label>
                        <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none">
                            <option>Sede Principal</option>
                            <option>Posto Alpha - Zona Sul</option>
                            <option>Posto Beta - Zona Norte</option>
                        </select>
                     </div>
                  </div>

                  {/* Upload Area */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Upload de Documentos (PDF)</label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-center">
                         <UploadCloud size={40} className="text-blue-500 mb-3" />
                         <p className="text-sm font-medium text-slate-700">Arraste os arquivos ou clique para selecionar</p>
                         <p className="text-xs text-slate-400 mt-1">Suporta múltiplos arquivos PDF (Max 10MB)</p>
                         <input type="file" className="hidden" accept=".pdf" multiple />
                      </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                     <button 
                      onClick={() => setView('list')}
                      className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                     >
                        Cancelar
                     </button>
                     <button 
                        onClick={() => { alert('Solicitação enviada para o DP!'); setView('list'); }}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex-1 flex items-center justify-center gap-2"
                     >
                        <UserPlus size={18} /> Enviar Admissão
                     </button>
                  </div>
               </div>
           </div>
        </div>
     );
  }

  // Detalhes do Funcionário (Pastas)
  if (view === 'employee_details' && selectedEmployee) {
      const emp = MOCK_EMPLOYEES.find(e => e.id === selectedEmployee);
      return (
         <div className="space-y-6">
            <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-blue-600 mb-2 flex items-center gap-1">
               <ArrowLeft size={16} /> Voltar para lista
            </button>
            
            {/* Header Profile */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-2 border-white shadow-sm">
                     <User size={32} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900">{emp?.name}</h2>
                     <p className="text-slate-500 flex items-center gap-2">
                        <Briefcase size={14}/> {emp?.role} 
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span> 
                        {emp?.worksite}
                     </p>
                  </div>
               </div>
               <div className="flex flex-col items-end gap-1">
                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${emp?.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {emp?.status}
                   </span>
                   <span className="text-xs text-slate-400">Admissão: {new Date(emp!.admissionDate).toLocaleDateString('pt-BR')}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pastas de Documentos */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                       <FolderOpen className="text-amber-500" size={20}/> Prontuário Digital (Pastas)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {employeeFolders.map((folder) => (
                           <div key={folder.id} className="group p-4 border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-blue-200 cursor-pointer transition-all flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="bg-amber-100 p-2 rounded text-amber-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                      <FolderOpen size={24} />
                                  </div>
                                  <div>
                                      <h5 className="font-semibold text-slate-700 text-sm group-hover:text-blue-700">{folder.name}</h5>
                                      <p className="text-xs text-slate-400">{folder.count} arquivos</p>
                                  </div>
                              </div>
                           </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100">
                        <h5 className="text-sm font-bold text-slate-700 mb-4">Arquivos Recentes</h5>
                        <div className="space-y-2">
                            {['Contrato de Trabalho Assinado.pdf', 'Ficha de Registro.pdf', 'Aviso de Férias 2023.pdf'].map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <FileText size={16} className="text-slate-400"/> {file}
                                    </div>
                                    <span className="text-xs text-slate-400">20/05/2024</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Ações Rápidas */}
                <div className="space-y-4">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-4">Solicitações Rápidas</h4>
                      <div className="space-y-2">
                         <button className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                            <Paperclip size={16}/> Enviar Atestado Médico
                         </button>
                         <button className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                            <AlertTriangle size={16}/> Solicitar Advertência
                         </button>
                         <button className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                            <User size={16}/> Solicitar Desligamento
                         </button>
                      </div>
                   </div>
                </div>
            </div>
         </div>
      )
  }

  // Lista Geral
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users size={24}/></div>
              <div>
                  <p className="text-slate-500 text-xs font-bold uppercase">Total Funcionários</p>
                  <p className="text-2xl font-bold text-slate-800">{MOCK_EMPLOYEES.length}</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-full"><Calendar size={24}/></div>
              <div>
                  <p className="text-slate-500 text-xs font-bold uppercase">Férias Próximas</p>
                  <p className="text-2xl font-bold text-slate-800">1</p>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full"><UserPlus size={24}/></div>
              <div>
                  <p className="text-slate-500 text-xs font-bold uppercase">Admissões no Mês</p>
                  <p className="text-2xl font-bold text-slate-800">0</p>
              </div>
          </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Base de Funcionários</h2>
        <button 
         onClick={() => setView('admission')}
         className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UserPlus size={18} />
          <span>Nova Admissão</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                 <th className="px-6 py-4">Nome / Cargo</th>
                 <th className="px-6 py-4">Posto / Local</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4">Férias (Vencimento)</th>
                 <th className="px-6 py-4 text-right">Ação</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {MOCK_EMPLOYEES.map(emp => (
                 <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.role}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{emp.worksite}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${emp.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {emp.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                       {new Date(emp.vacationDue).toLocaleDateString('pt-BR')}
                       {new Date(emp.vacationDue) < new Date(new Date().setMonth(new Date().getMonth() + 3)) && (
                          <span title="Vence em breve" className="bg-amber-100 text-amber-600 p-1 rounded">
                             <AlertTriangle size={14} />
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => {
                           setSelectedEmployee(emp.id);
                           setView('employee_details');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                       >
                          Ver Prontuário
                       </button>
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default HRManagement;