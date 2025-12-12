import React, { useState } from 'react';
import { User } from '../types';
import { updateUser } from '../services/mockData';
import { UserCircle, Camera, Save } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      password: user.password || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateUser({ ...user, ...formData });
      alert('Perfil atualizado com sucesso!');
      onUpdate();
  };

  return (
    <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Meu Perfil</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col items-center mb-8">
                <div className="relative">
                    <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-3xl font-bold overflow-hidden">
                        {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover" /> : user.name.substring(0,2).toUpperCase()}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md">
                        <Camera size={16} />
                    </button>
                </div>
                <p className="mt-2 text-slate-500">{user.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nome Completo</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Telefone / Contato</label>
                        <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Senha</label>
                        <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Endereço</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border rounded-lg p-2.5 mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default UserProfile;
