import React, { useState, useEffect } from 'react';
import { User, Company } from '../types';
import { getUsers, addUser, updateUser, deleteUser, getCompanies } from '../services/mockData';
import { Edit2, Trash2, Plus, User as UserIcon } from 'lucide-react';

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<User>>({ name: '', email: '', role: 'client', companyId: '' });

  useEffect(() => {
    setUsers(getUsers());
    setCompanies(getCompanies());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const userPayload = { 
        ...formData, 
        id: editingId || Date.now().toString(),
        password: formData.password || '123' // Default for demo
    } as User;

    if (editingId) {
       updateUser(userPayload);
    } else {
       addUser(userPayload);
    }
    setUsers(getUsers());
    closeModal();
  };

  const openEdit = (u: User) => {
     setFormData({ name: u.name, email: u.email, role: u.role, companyId: u.companyId });
     setEditingId(u.id);
     setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
     if(confirm('Tem certeza que deseja excluir este usuário?')) {
        deleteUser(id);
        setUsers(getUsers());
     }
  };

  const closeModal = () => {
     setIsModalOpen(false);
     setEditingId(null);
     setFormData({ name: '', email: '', role: 'client', companyId: '' });
  };

  const getCompanyName = (id?: string) => {
      if(!id) return '-';
      return companies.find(c => c.id === id)?.name || 'Desconhecida';
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Usuários</h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
             <Plus size={18} /> Novo Usuário
          </button>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                <tr>
                   <th className="px-6 py-4">Nome</th>
                   <th className="px-6 py-4">Email</th>
                   <th className="px-6 py-4">Função</th>
                   <th className="px-6 py-4">Empresa</th>
                   <th className="px-6 py-4 text-right">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                   <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                         <div className="p-2 bg-slate-100 text-slate-600 rounded-full"><UserIcon size={16}/></div>
                         {u.name}
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4 capitalize">{u.role}</td>
                      <td className="px-6 py-4">{u.role === 'client' ? getCompanyName(u.companyId) : 'Acesso Geral'}</td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                         <button onClick={() => openEdit(u)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded">
                            <Edit2 size={16} />
                         </button>
                         <button onClick={() => handleDelete(u.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
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
                <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div>
                      <label className="block text-sm font-medium text-slate-700">Nome</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700">Email</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg p-2 mt-1" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700">Função</label>
                      <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})} className="w-full border rounded-lg p-2 mt-1">
                          <option value="client">Cliente</option>
                          <option value="admin">Administrador</option>
                      </select>
                   </div>
                   {formData.role === 'client' && (
                       <div>
                          <label className="block text-sm font-medium text-slate-700">Vincular Empresa</label>
                          <select value={formData.companyId} onChange={e => setFormData({...formData, companyId: e.target.value})} className="w-full border rounded-lg p-2 mt-1">
                              <option value="">Selecione uma empresa...</option>
                              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                   )}
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

export default UserManager;
