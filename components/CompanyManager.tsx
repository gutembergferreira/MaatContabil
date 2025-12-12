import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { getCompanies, addCompany, updateCompany, deleteCompany } from '../services/mockData';
import { Edit2, Trash2, Plus, Building } from 'lucide-react';

const CompanyManager: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: '', cnpj: '', address: '', contact: '' });

  useEffect(() => {
    setCompanies(getCompanies());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
       updateCompany({ ...formData, id: editingId });
    } else {
       addCompany({ ...formData, id: Date.now().toString() });
    }
    setCompanies(getCompanies());
    closeModal();
  };

  const openEdit = (c: Company) => {
     setFormData({ name: c.name, cnpj: c.cnpj, address: c.address, contact: c.contact });
     setEditingId(c.id);
     setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
     if(confirm('Tem certeza que deseja excluir esta empresa?')) {
        deleteCompany(id);
        setCompanies(getCompanies());
     }
  };

  const closeModal = () => {
     setIsModalOpen(false);
     setEditingId(null);
     setFormData({ name: '', cnpj: '', address: '', contact: '' });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Empresas</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
             <Plus size={18} /> Nova Empresa
          </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                   <th className="px-6 py-4">Nome</th>
                   <th className="px-6 py-4">CNPJ</th>
                   <th className="px-6 py-4">Contato</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {companies.map(c => (
                   <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded"><Building size={16}/></div>
                         {c.name}
                      </td>
                      <td className="px-6 py-4">{c.cnpj}</td>
                      <td className="px-6 py-4">{c.contact}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                         <button onClick={() => openEdit(c)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded">
                            <Edit2 size={16} />
                         </button>
                         <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                         </button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
             <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700">Nome da Empresa</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700">CNPJ</label>
                      <input required type="text" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700">Endereço</label>
                      <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700">Contato (Tel/Email)</label>
                      <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                   </div>
                   <div className="flex justify-end gap-2 mt-6">
                      <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
};

export default CompanyManager;
