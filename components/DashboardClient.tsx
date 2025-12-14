import React from 'react';
import { CURRENT_CLIENT, getDocuments, MOCK_EMPLOYEES } from '../services/mockData';
import { DollarSign, Users, AlertTriangle, FileText, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
       <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Painel Financeiro & Fiscal</h2>
            <p className="text-slate-500">Bem-vindo, {CURRENT_CLIENT.name}. Aqui está o resumo de hoje.</p>
          </div>
          <div className="flex gap-3">
             <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 flex items-center gap-2">
                 <AlertTriangle size={18}/>
                 <div className="flex flex-col leading-tight">
                     <span className="text-xs font-bold uppercase">Atenção</span>
                     <span className="text-sm font-bold">{pendingDocs} Guias Pendentes</span>
                 </div>
             </div>
             <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
                 <Calendar size={18}/>
                 <div className="flex flex-col leading-tight">
                     <span className="text-xs font-bold uppercase">Próximo Prazo</span>
                     <span className="text-sm font-bold">{financials.nextTaxDeadline}</span>
                 </div>
             </div>
          </div>
       </div>

       {/* Main Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Faturamento Mensal */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><TrendingUp size={24}/></div>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faturamento (Mês)</span>
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 mb-1">R$ {financials.revenueMonth.toLocaleString('pt-BR')}</h3>
                 <p className="text-xs text-slate-500">Acumulado Anual: <span className="font-semibold">R$ {financials.revenueYear.toLocaleString('pt-BR')}</span></p>
             </div>
          </div>

          {/* A Receber */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><ArrowUpRight size={24}/></div>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">A Receber</span>
                 </div>
                 <h3 className="text-2xl font-bold text-emerald-700 mb-1">R$ {financials.receivables.toLocaleString('pt-BR')}</h3>
                 <p className="text-xs text-emerald-600/80 font-medium">Prazo Médio: 15 dias</p>
             </div>
          </div>

          {/* A Pagar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-red-100 text-red-600 rounded-lg"><ArrowDownRight size={24}/></div>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">A Pagar</span>
                 </div>
                 <h3 className="text-2xl font-bold text-red-700 mb-1">R$ {financials.payables.toLocaleString('pt-BR')}</h3>
                 <p className="text-xs text-red-600/80 font-medium">Vencimentos Próximos</p>
             </div>
          </div>

          {/* RH Resumo */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group">
             <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
             <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><Users size={24}/></div>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Funcionários</span>
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900 mb-1">{MOCK_EMPLOYEES.length} <span className="text-sm font-normal text-slate-500">Ativos</span></h3>
                 <div className="flex gap-2 mt-2">
                     {vacationSoon > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">{vacationSoon} Férias em breve</span>}
                 </div>
             </div>
          </div>
       </div>

       {/* Detailed Sections */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><DollarSign size={20} className="text-slate-400"/> Fluxo Previsto (Mês Atual)</h4>
             <div className="h-64 w-full bg-slate-50 rounded-lg p-4 border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={financialData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 14, fontWeight: 600, fill: '#64748b'}} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} 
                      />
                      <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={40}>
                        {financialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-4 flex justify-between text-sm text-slate-500 px-4">
                 <span>Entradas previstas: <strong className="text-emerald-600">R$ {financials.receivables.toLocaleString('pt-BR')}</strong></span>
                 <span>Saídas previstas: <strong className="text-red-600">R$ {financials.payables.toLocaleString('pt-BR')}</strong></span>
             </div>
          </div>

          {/* Quick Actions / Documents */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
             <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-slate-400"/> Guias Recentes</h4>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-64">
                {documents.filter(d => d.category === 'Impostos' || d.category === 'Boletos').slice(0, 5).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-blue-200 transition-all cursor-pointer">
                     <div className="flex items-center space-x-3 overflow-hidden">
                        <div className={`p-2 rounded shrink-0 ${doc.paymentStatus === 'Pago' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                           <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-bold text-slate-800 truncate">{doc.title}</p>
                           <p className="text-xs text-slate-500 flex items-center gap-1">
                               Vence: {new Date(doc.date).toLocaleDateString()}
                           </p>
                        </div>
                     </div>
                     <div className="text-right shrink-0">
                         <p className="text-sm font-bold text-slate-700">R$ {doc.amount?.toLocaleString('pt-BR')}</p>
                         <span className={`text-[10px] font-bold uppercase ${doc.paymentStatus === 'Pago' ? 'text-green-600' : 'text-red-500'}`}>
                             {doc.paymentStatus}
                         </span>
                     </div>
                  </div>
                ))}
             </div>
             <button className="w-full mt-auto pt-4 text-blue-600 text-sm font-bold hover:underline">
                Ver todos os pagamentos →
             </button>
          </div>
       </div>
    </div>
  );
};

export default DashboardClient;