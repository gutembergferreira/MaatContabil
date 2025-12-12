import React from 'react';
import { MOCK_ROUTINES } from '../services/mockData';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const DashboardAdmin: React.FC = () => {
  
  // Data processing for charts
  const statusCounts = MOCK_ROUTINES.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  }));

  const COLORS = ['#F59E0B', '#10B981', '#EF4444', '#3B82F6']; // Pendente, Concluído, Atrasado, Em Análise

  const deptData = [
    { name: 'Pessoal', entregues: 120, pendentes: 45 },
    { name: 'Fiscal', entregues: 98, pendentes: 30 },
    { name: 'Contábil', entregues: 86, pendentes: 50 },
    { name: 'Legal', entregues: 15, pendentes: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Entregas Pendentes</p>
              <h3 className="text-2xl font-bold text-slate-800">130</h3>
            </div>
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
              <Clock size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Entregues no Prazo</p>
              <h3 className="text-2xl font-bold text-slate-800">319</h3>
            </div>
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Guias em Atraso (Clientes)</p>
              <h3 className="text-2xl font-bold text-slate-800">12</h3>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-full">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Solicitações Extras</p>
              <h3 className="text-2xl font-bold text-slate-800">8</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Status Geral das Entregas</h4>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-80">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Performance por Departamento</h4>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deptData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entregues" stackId="a" fill="#10B981" name="Entregues" />
              <Bar dataKey="pendentes" stackId="a" fill="#F59E0B" name="Pendentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Routine List Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h4 className="text-lg font-semibold text-slate-800">Próximos Vencimentos</h4>
          <button className="text-blue-600 text-sm font-medium hover:underline">Ver todas</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Obrigação</th>
                <th className="px-6 py-3">Depto</th>
                <th className="px-6 py-3">Vencimento</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ROUTINES.map((routine) => (
                <tr key={routine.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{routine.clientName}</td>
                  <td className="px-6 py-4">{routine.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${routine.department === 'Pessoal' ? 'bg-purple-100 text-purple-700' : 
                        routine.department === 'Fiscal' ? 'bg-blue-100 text-blue-700' :
                        routine.department === 'Contábil' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                      }
                    `}>
                      {routine.department}
                    </span>
                  </td>
                  <td className="px-6 py-4">{new Date(routine.deadline).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${routine.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 
                        routine.status === 'Atrasado' ? 'bg-red-100 text-red-700' :
                        routine.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }
                    `}>
                      {routine.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
