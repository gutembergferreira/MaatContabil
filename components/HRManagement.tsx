import React, { useState } from 'react';
import { MOCK_EMPLOYEES } from '../services/mockData';
import { UserPlus, FolderOpen, AlertTriangle, UploadCloud, FileText, User } from 'lucide-react';
import { Role } from '../types';

interface HRManagementProps {
  role: Role;
}

const HRManagement: React.FC<HRManagementProps> = ({ role }) => {
  const [view, setView] = useState<'list' | 'admission' | 'employee_details'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  if (view === 'admission') {
     return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserPlus className="text-blue-600" /> Nova Admissão
           </h3>
           
           <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                 Por favor, envie os seguintes documentos digitalizados: RG, CPF, Comp. Residência, Título Eleitor, Cart. Trabalho Digital.
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salário (R$)</label>
                    <input type="number" className="w-full border border-slate-300 rounded-lg p-2" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                    <input type="date" className="w-full border border-slate-300 rounded-lg p-2" />
                 </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                 <UploadCloud size={40} className="text-slate-400 mb-2" />
                 <p className="text-sm font-medium text-slate-600">Clique para enviar os documentos (PDF)</p>
                 <p className="text-xs text-slate-400">Tamanho máx: 10MB</p>
                 <input type="file" className="hidden" accept=".pdf" />
              </div>

              <div className="flex gap-3 pt-4">
                 <button 
                  onClick={() => setView('list')}
                  className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                 >
                    Cancelar
                 </button>
                 <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Solicitar Admissão
                 </button>
              </div>
           </div>
        </div>
     );
  }

  if (view === 'employee_details' && selectedEmployee) {
      const emp = MOCK_EMPLOYEES.find(e => e.id === selectedEmployee);
      return (
         <div className="space-y-6">
            <button onClick={() => setView('list')} className="text-sm text-slate-500 hover:text-blue-600 mb-2">
               ← Voltar para lista
            </button>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                     <User size={32} />
                  </div>
                  <div>
                     <h2 className="text-2xl font-bold text-slate-900">{emp?.name}</h2>
                     <p className="text-slate-500">{emp?.role} • {emp?.worksite}</p>
                     <p className="text-sm text-slate-400 mt-1">Admissão: {new Date(emp!.admissionDate).toLocaleDateString('pt-BR')}</p>
                  </div>
               </div>
               <span className={`px-3 py-1 rounded-full text-sm font-medium ${emp?.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {emp?.status}
               </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 md:col-span-2">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <FolderOpen className="text-amber-500" size={20}/> Pasta de Documentos
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {['Contrato Trabalho', 'Ficha Registro', 'Aviso Férias 2023', 'Recibo Entrega EPI'].map((doc, i) => (
                           <div key={i} className="flex flex-col items-center p-4 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                              <FileText className="text-slate-400 mb-2" size={32} />
                              <span className="text-xs text-center text-slate-600 font-medium">{doc}</span>
                           </div>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-4">
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                      <h4 className="font-bold text-slate-800 mb-4">Ações Rápidas</h4>
                      <div className="space-y-2">
                         <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                            Enviar Atestado Médico
                         </button>
                         <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded border border-transparent hover:border-slate-200">
                            Solicitar Advertência
                         </button>
                         <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200">
                            Solicitar Desligamento
                         </button>
                      </div>
                   </div>
                </div>
            </div>
         </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Gestão de Funcionários</h2>
        <button 
         onClick={() => setView('admission')}
         className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus size={18} />
          <span>Admissão</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
              <tr>
                 <th className="px-6 py-4">Nome</th>
                 <th className="px-6 py-4">Cargo</th>
                 <th className="px-6 py-4">Posto/Local</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4">Próx. Férias</th>
                 <th className="px-6 py-4 text-right">Ação</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {MOCK_EMPLOYEES.map(emp => (
                 <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{emp.name}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.role}</td>
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
                          <span title="Vence em breve">
                             <AlertTriangle size={14} className="text-amber-500" />
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={() => {
                           setSelectedEmployee(emp.id);
                           setView('employee_details');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                       >
                          Abrir Pasta
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