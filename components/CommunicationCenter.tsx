import React, { useState, useEffect } from 'react';
import { addNotification, getUsers } from '../services/mockData';
import { Send, Bell, User } from 'lucide-react';
import { Role } from '../types';

interface CommunicationCenterProps {
  role: Role;
}

const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ role }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUser, setTargetUser] = useState('all');
  const [users, setUsers] = useState(getUsers());

  useEffect(() => {
    setUsers(getUsers().filter(u => u.role === 'client'));
  }, []);

  const handleSend = () => {
    if(!title || !message) return;

    if (targetUser === 'all') {
        users.forEach(u => {
            addNotification({
                id: Date.now().toString() + Math.random(),
                userId: u.id,
                title,
                message,
                read: false,
                timestamp: new Date().toISOString()
            });
        });
    } else {
        addNotification({
            id: Date.now().toString(),
            userId: targetUser,
            title,
            message,
            read: false,
            timestamp: new Date().toISOString()
        });
    }

    alert('Notificação enviada com sucesso!');
    setTitle('');
    setMessage('');
  };

  if (role !== 'admin') {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Bell size={48} className="mb-4" />
              <p>Você receberá notificações importantes no ícone de sino acima.</p>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
       <h2 className="text-2xl font-bold text-slate-800">Enviar Notificações (Push)</h2>
       
       <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="space-y-4">
             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Destinatário</label>
                 <select 
                    value={targetUser} 
                    onChange={e => setTargetUser(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                 >
                    <option value="all">Todos os Clientes</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} - {u.email}</option>
                    ))}
                 </select>
             </div>

             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                 <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="Ex: Vencimento de Guia"
                 />
             </div>

             <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                 <textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="Digite a mensagem que aparecerá na notificação..."
                 />
             </div>

             <div className="pt-2">
                 <button 
                    onClick={handleSend}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                 >
                    <Send size={18} /> Enviar Push Notification
                 </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default CommunicationCenter;
