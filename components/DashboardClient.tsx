import React from 'react';
import { CURRENT_CLIENT, getDocuments, MOCK_EMPLOYEES } from '../services/mockData';
import {  DollarSign, Users, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DashboardClient: React.FC = () => {
  const { financials } = CURRENT_CLIENT;
  const documents = getDocuments(CURRENT_CLIENT.id);

  const financialData = [
    { name: 'Receitas', valor: financials.receivables, color: '#10B981' }, // Green
    { name: 'Despesas', valor: financials.payables, color: '#EF4444' }, // Red
  ];

  const pendingDocs = documents.filter(d => d.paymentStatus === 'Aberto').length;
  
  const vacationSoon = MOCK_EMPLOYEES.filter(e => {
     // Mock logic: vacation due within 3 months
     const due = new Date(e.vacationDue);
     const now = new Date();
     const diffTime = Math.abs(due.getTime() - now.getTime());
     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
     return diffDays < 90;
  }).length;

  return (
    <div className="space-y-6">
       {/* Welcome Banner */}
       <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Olá, {CURRENT_CLIENT.name}</h2>
          <p className="text-blue-100 text-lg">Aqui está o resumo da sua empresa hoje.</p>
          <div className="flex mt-6 space-x-6">
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                <Calendar size={20} />
                <span>Próximo imposto: {financials.nextTaxDeadline}</span>
            </div>
             <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                <AlertTriangle size={20} />
                <span>{pendingDocs} guias aguardando pagamento</span>
            </div>
          </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Faturamento (Mês)</p>
                   <h3 className="text-2xl font-bold text-slate-900 mt-1">
                     R$ {financials.revenueMonth.toLocaleString('pt-BR')}
                   </h3>
                </div>
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                   <DollarSign size={24} />
                </div>
             </div>
             <p className="text-xs text-slate-400 mt-4">Anual: R$ {financials.revenueYear.toLocaleString('pt-BR')}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Contas a Receber</p>
                   <h3 className="text-2xl font-bold text-slate-900 mt-1">
                     R$ {financials.receivables.toLocaleString('pt-BR')}
                   </h3>
                </div>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                   <DollarSign size={24} />
                </div>
             </div>
             <p className="text-xs text-slate-400 mt-4">Prazo médio: 15 dias</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Total Funcionários</p>
                   <h3 className="text-2xl font-bold text-slate-900 mt-1">
                     {MOCK_EMPLOYEES.length}
                   </h3>
                </div>
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                   <Users size={24} />
                </div>
             </div>
             <div className="mt-4 flex space-x-2">
                <span className="text-xs px-2 py-1 bg-slate-100 rounded text-slate-600">
                   {vacationSoon} Férias próximas
                </span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Contas a Pagar</p>
                   <h3 className="text-2xl font-bold text-slate-900 mt-1">
                     R$ {financials.payables.toLocaleString('pt-BR')}
                   </h3>
                </div>
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                   <DollarSign size={24} />
                </div>
             </div>
             <p className="text-xs text-red-500 mt-4 font-medium">Atenção ao fluxo de caixa</p>
          </div>
       </div>

       {/* Detailed Sections */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h4 className="text-lg font-bold text-slate-800 mb-4">Previsão Financeira</h4>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={financialData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 14}} />
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                      <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={40}>
                        {financialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Quick Actions / Documents */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h4 className="text-lg font-bold text-slate-800 mb-4">Últimos Documentos</h4>
             <div className="space-y-4">
                {documents.slice(0, 4).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
                     <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded text-slate-500">
                           <FileText size={18} />
                        </div>
                        <div>
                           <p className="text-sm font-medium text-slate-800 line-clamp-1">{doc.title}</p>
                           <p className="text-xs text-slate-500">{doc.date} • {doc.category}</p>
                        </div>
                     </div>
                     {(doc.category === 'Impostos' || doc.category === 'Boletos') && doc.paymentStatus === 'Aberto' && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                     )}
                  </div>
                ))}
             </div>
             <button className="w-full mt-6 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                Ver todos os documentos
             </button>
          </div>
       </div>
    </div>
  );
};

export default DashboardClient;