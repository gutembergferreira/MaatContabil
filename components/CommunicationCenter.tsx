import React, { useState, useEffect, useRef } from 'react';
import { sendNotifications, getUsers, getAllNotifications, updateNotification, deleteNotification, uploadHrAttachment } from '../services/mockData';
import { Send, Bell, User, History, Edit2, Trash2, Save, X } from 'lucide-react';
import { Role, Notification } from '../types';

interface CommunicationCenterProps {
  role: Role;
}

const CommunicationCenter: React.FC<CommunicationCenterProps> = ({ role }) => {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  
  // Send Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetUser, setTargetUser] = useState('all');
  const [users, setUsers] = useState(getUsers());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [inlineImages, setInlineImages] = useState<{ id: string; file: File }[]>([]);
  const messageRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // History State
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', message: '' });

  useEffect(() => {
    setUsers(getUsers().filter(u => u.role === 'client'));
    if (role === 'admin') {
        refreshHistory();
    }
  }, [role]);

  const refreshHistory = () => {
      setSentNotifications(getAllNotifications());
  };

  const createId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const sanitize = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const replaceInlineImages = (text: string) =>
    inlineImages.reduce((acc, img) => {
      const objectUrl = URL.createObjectURL(img.file);
      return acc.replaceAll(
        `![${img.file.name}](inline://image-${img.id})`,
        `![${img.file.name}](${objectUrl})`
      );
    }, text);

  const renderMarkdown = (value: string) => {
    const lines = replaceInlineImages(sanitize(value)).split('\n');
    let html = '';
    let inUl = false;
    let inOl = false;
    let inCode = false;
    const closeLists = () => {
      if (inUl) { html += '</ul>'; inUl = false; }
      if (inOl) { html += '</ol>'; inOl = false; }
    };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (line.startsWith('```')) {
        if (inCode) {
          html += '</code></pre>';
          inCode = false;
        } else {
          closeLists();
          html += '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg text-xs overflow-auto"><code>';
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        html += `${line}\n`;
        continue;
      }
      if (/^\s*-\s+/.test(line)) {
        if (!inUl) { closeLists(); html += '<ul class="list-disc ml-5 space-y-1">'; inUl = true; }
        html += `<li>${line.replace(/^\s*-\s+/, '')}</li>`;
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        if (!inOl) { closeLists(); html += '<ol class="list-decimal ml-5 space-y-1">'; inOl = true; }
        html += `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`;
        continue;
      }
      closeLists();
      if (line.startsWith('### ')) {
        html += `<h4 class="font-semibold mt-2 mb-1">${line.replace(/^###\s+/, '')}</h4>`;
        continue;
      }
      if (line.startsWith('## ')) {
        html += `<h3 class="font-semibold mt-2 mb-1">${line.replace(/^##\s+/, '')}</h3>`;
        continue;
      }
      if (line.startsWith('# ')) {
        html += `<h2 class="font-semibold mt-2 mb-1">${line.replace(/^#\s+/, '')}</h2>`;
        continue;
      }
      if (line.startsWith('> ')) {
        html += `<blockquote class="border-l-2 border-slate-300 pl-3 italic text-slate-600">${line.replace(/^>\s+/, '')}</blockquote>`;
        continue;
      }
      let formatted = line;
      formatted = formatted.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" referrerpolicy="no-referrer" class="max-h-56 rounded border mt-2" />'
      );
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
      formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded">$1</code>');
      formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>');
      html += formatted ? `${formatted}<br/>` : '<br/>';
    }
    if (inCode) html += '</code></pre>';
    closeLists();
    return html;
  };

  const insertToken = (tokenStart: string, tokenEnd = '') => {
    const el = messageRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = message.slice(0, start);
    const after = message.slice(end);
    const next = `${before}${tokenStart}${message.slice(start, end)}${tokenEnd}${after}`;
    setMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + tokenStart.length;
      el.selectionStart = cursor;
      el.selectionEnd = cursor;
    });
  };

  const handleSend = async () => {
    if(!title || !message) return;

    const recipients = targetUser === 'all' ? users : users.filter(u => u.id === targetUser);
    const baseTimestamp = new Date().toISOString();
    const usedInlineImages = inlineImages.filter(img => message.includes(`[[image:${img.id}]]`));
    const notifications: Notification[] = [];

    for (const user of recipients) {
        const id = createId();
        let finalMessage = message;

        if (usedInlineImages.length > 0) {
            for (const img of usedInlineImages) {
                const attachment = await uploadHrAttachment({
                    file: img.file,
                    entityType: 'notification',
                    entityId: id,
                    uploadedBy: undefined,
                    name: img.file.name
                });
                finalMessage = finalMessage.replaceAll(
                    `[[image:${img.id}]]`,
                    `![${img.file.name}](${attachment.url})`
                );
            }
        }

        if (pendingFiles.length > 0) {
            await Promise.all(
                pendingFiles.map((file) =>
                    uploadHrAttachment({
                        file,
                        entityType: 'notification',
                        entityId: id,
                        uploadedBy: undefined,
                        name: file.name
                    })
                )
            );
        }

        notifications.push({
            id,
            userId: user.id,
            title,
            message: finalMessage,
            read: false,
            timestamp: baseTimestamp
        });
    }

    await sendNotifications(notifications);

    alert('Notificação enviada com sucesso!');
    setTitle('');
    setMessage('');
    setPendingFiles([]);
    setInlineImages([]);
    refreshHistory();
  };

  const startEdit = (n: Notification) => {
      setEditingId(n.id);
      setEditForm({ title: n.title, message: n.message });
  };

  const saveEdit = async (id: string) => {
      const original = sentNotifications.find(n => n.id === id);
      if (original) {
          await updateNotification({ ...original, title: editForm.title, message: editForm.message });
          setEditingId(null);
          refreshHistory();
      }
  };

  const cancelEdit = () => {
      setEditingId(null);
      setEditForm({ title: '', message: '' });
  };

  const deleteNotif = async (id: string) => {
      if (confirm('Deseja excluir esta notificação?')) {
          await deleteNotification(id);
          refreshHistory();
      }
  };

  const getUserName = (id: string) => {
      const u = users.find(user => user.id === id);
      return u ? u.name : 'Usuário Removido';
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
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Centro de Comunicações</h2>
       </div>

       <div className="flex gap-4 border-b border-slate-200">
           <button 
             onClick={() => setActiveTab('send')}
             className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'send' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               <Send size={18} /> Nova Notificação
           </button>
           <button 
             onClick={() => { setActiveTab('history'); refreshHistory(); }}
             className={`pb-3 px-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               <History size={18} /> Histórico Enviados
           </button>
       </div>
       
       {activeTab === 'send' && (
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-2xl">
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
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                        <button type="button" onClick={() => insertToken('# ', '')} className="px-2 py-1 text-xs border rounded">H1</button>
                        <button type="button" onClick={() => insertToken('## ', '')} className="px-2 py-1 text-xs border rounded">H2</button>
                        <button type="button" onClick={() => insertToken('### ', '')} className="px-2 py-1 text-xs border rounded">H3</button>
                        <button type="button" onClick={() => insertToken('**', '**')} className="px-2 py-1 text-xs border rounded">Negrito</button>
                        <button type="button" onClick={() => insertToken('*', '*')} className="px-2 py-1 text-xs border rounded">Itálico</button>
                        <button type="button" onClick={() => insertToken('`', '`')} className="px-2 py-1 text-xs border rounded">Code</button>
                        <button type="button" onClick={() => insertToken('> ', '')} className="px-2 py-1 text-xs border rounded">Citação</button>
                        <button type="button" onClick={() => insertToken('- ', '')} className="px-2 py-1 text-xs border rounded">Lista</button>
                        <button type="button" onClick={() => insertToken('1. ', '')} className="px-2 py-1 text-xs border rounded">Lista Num.</button>
                        <button type="button" onClick={() => insertToken('[texto](https://)', '')} className="px-2 py-1 text-xs border rounded">Link</button>
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="px-2 py-1 text-xs border rounded"
                        >
                          Inserir imagem
                        </button>
                        <button type="button" onClick={() => insertToken('\n```\n', '\n```\n')} className="px-2 py-1 text-xs border rounded">Bloco Código</button>
                     </div>
                     <textarea 
                        ref={messageRef}
                        value={message} 
                        onChange={e => setMessage(e.target.value)}
                        rows={6}
                        className="w-full border rounded-lg p-2.5"
                        placeholder="Digite a mensagem (Markdown simples: **negrito**, *itálico*, [texto](link))"
                     />
                     <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          let cursor = messageRef.current?.selectionStart ?? message.length;
                          let nextMessage = message;
                          const nextInline = [...inlineImages];
                          files.forEach((file) => {
                            const id = createId();
                            const token = `[[image:${id}]]`;
                            nextInline.push({ id, file });
                            nextMessage = nextMessage.slice(0, cursor) + token + nextMessage.slice(cursor);
                            cursor += token.length;
                          });
                          setInlineImages(nextInline);
                          setMessage(nextMessage);
                          if (messageRef.current) {
                            requestAnimationFrame(() => {
                              messageRef.current?.focus();
                              messageRef.current?.setSelectionRange(cursor, cursor);
                            });
                          }
                          e.currentTarget.value = '';
                        }}
                     />
                     <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Preview</p>
                        <div
                          className="p-3 border rounded-lg text-sm text-slate-700 bg-slate-50"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(
                              inlineImages.reduce((acc, img) => {
                                return acc.replaceAll(`[[image:${img.id}]]`, `![${img.file.name}](inline://image-${img.id})`);
                              }, message)
                            )
                          }}
                        />
                     </div>
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Anexos (imagens/arquivos)</label>
                     <input
                        type="file"
                        multiple
                        className="w-full border rounded-lg p-2.5"
                        onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setPendingFiles(files);
                        }}
                     />
                     {pendingFiles.length > 0 && (
                        <ul className="mt-2 text-xs text-slate-600 space-y-1">
                          {pendingFiles.map((f) => <li key={f.name}>{f.name}</li>)}
                        </ul>
                     )}
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
       )}

       {activeTab === 'history' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                           <tr>
                               <th className="px-6 py-3">Data</th>
                               <th className="px-6 py-3">Destinatário</th>
                               <th className="px-6 py-3">Conteúdo</th>
                               <th className="px-6 py-3 text-right">Ações</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {sentNotifications.map(n => (
                               <tr key={n.id} className="hover:bg-slate-50">
                                   <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                       {new Date(n.timestamp).toLocaleDateString()} <br/>
                                       <span className="text-xs">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                   </td>
                                   <td className="px-6 py-4">
                                       <span className="flex items-center gap-2">
                                           <User size={14} className="text-slate-400"/>
                                           {getUserName(n.userId)}
                                       </span>
                                   </td>
                                   <td className="px-6 py-4 max-w-md">
                                       {editingId === n.id ? (
                                           <div className="space-y-2">
                                               <input 
                                                  className="w-full border rounded p-1 text-sm" 
                                                  value={editForm.title}
                                                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                                               />
                                               <textarea 
                                                  className="w-full border rounded p-1 text-sm" 
                                                  rows={2}
                                                  value={editForm.message}
                                                  onChange={e => setEditForm({...editForm, message: e.target.value})}
                                               />
                                           </div>
                                       ) : (
                                           <div>
                                               <p className="font-medium text-slate-800">{n.title}</p>
                                               <p className="text-slate-600 truncate">{n.message}</p>
                                           </div>
                                       )}
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                       {editingId === n.id ? (
                                           <div className="flex justify-end gap-2">
                                               <button onClick={() => saveEdit(n.id)} className="text-green-600 hover:text-green-800"><Save size={18}/></button>
                                               <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                                           </div>
                                       ) : (
                                           <div className="flex justify-end gap-2">
                                               <button onClick={() => startEdit(n)} className="text-blue-600 hover:text-blue-800"><Edit2 size={16}/></button>
                                               <button onClick={() => deleteNotif(n.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                           </div>
                                       )}
                                   </td>
                               </tr>
                           ))}
                           {sentNotifications.length === 0 && (
                               <tr><td colSpan={4} className="p-6 text-center text-slate-400">Nenhuma notificação enviada.</td></tr>
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       )}
    </div>
  );
};

export default CommunicationCenter;
