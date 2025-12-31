import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead, getNotificationAttachments, getApiUrl } from '../services/mockData';
import { Notification } from '../types';
import { Bell, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react';

interface NotificationPageProps {
  userId: string;
}

const NotificationPage: React.FC<NotificationPageProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setNotifications(getNotifications(userId));
  }, [userId]);

  const assetBase = getApiUrl().replace(/\/api\/?$/, '');
  const toAssetUrl = (url: string) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${assetBase}${url}`;
    return `${assetBase}/${url}`;
  };

  const sanitize = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const renderMarkdown = (value: string) => {
    const lines = sanitize(value).split('\n');
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
      formatted = formatted.replace(/!\[(.*?)\]\((.*?)\)/g, (_, alt, rawUrl) => {
        const url = toAssetUrl(rawUrl);
        return `<img src="${url}" alt="${alt}" referrerpolicy="no-referrer" class="max-h-56 rounded border mt-2" />`;
      });
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

  const isImage = (url: string) => /\.(png|jpe?g|gif|webp|bmp)$/i.test(url);

  const getInlineImageUrls = (value: string) => {
    const urls: string[] = [];
    const regex = /!\[.*?\]\((.*?)\)/g;
    let match;
    while ((match = regex.exec(value)) !== null) {
      urls.push(toAssetUrl(match[1]));
    }
    return urls;
  };

  const renderMarkdownPreview = (value: string) => renderMarkdown(value);

  const toggleExpand = async (id: string, isRead: boolean) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!isRead) {
        await markNotificationRead(id);
        setNotifications(getNotifications(userId)); // Refresh to update read status visually
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
        <Bell className="text-blue-600" /> Minhas Notificações
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Você não possui notificações no momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`transition-colors ${!notif.read ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}
              >
                <div 
                  className="p-4 cursor-pointer flex justify-between items-start gap-4"
                  onClick={() => toggleExpand(notif.id, notif.read)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 block" title="Não lida"></span>
                      )}
                      <h4 className={`text-base ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-xs text-slate-400 ml-auto block sm:hidden">
                        {new Date(notif.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    {expandedId !== notif.id && (
                      <p
                        className="text-sm text-slate-600 line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(notif.message) }}
                      />
                    )}
                  </div>
                  
                  <div className="hidden sm:flex flex-col items-end gap-1">
                     <span className="text-xs text-slate-400">
                        {new Date(notif.timestamp).toLocaleDateString()} {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                     {expandedId === notif.id ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                  </div>
                </div>

                {expandedId === notif.id && (
                  <div className="px-4 pb-4 pl-8 sm:pl-4">
                     <div className="pt-2 border-t border-slate-200/50 text-slate-700 text-sm leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(notif.message) }} />
                        {getNotificationAttachments(notif.id).filter(att => {
                          const inlineUrls = getInlineImageUrls(notif.message);
                          const url = toAssetUrl(att.url);
                          return !inlineUrls.includes(url);
                        }).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {getNotificationAttachments(notif.id).filter(att => {
                              const inlineUrls = getInlineImageUrls(notif.message);
                              const url = toAssetUrl(att.url);
                              return !inlineUrls.includes(url);
                            }).map(att => (
                              <div key={att.id} className="text-xs text-slate-600">
                                {isImage(att.url) ? (
                                  <img src={toAssetUrl(att.url)} alt={att.name} referrerPolicy="no-referrer" className="max-h-48 rounded border" />
                                ) : (
                                  <a href={toAssetUrl(att.url)} target="_blank" className="text-blue-600 hover:underline">{att.name}</a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                     </div>
                     <div className="mt-2 flex justify-end">
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCheck size={14} /> Lida
                        </span>
                     </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
