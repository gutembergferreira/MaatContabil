import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, Users, Bell, Settings, LogOut, Briefcase, Building2, Menu, X, UserCircle, ChevronDown, MessageSquare
} from 'lucide-react';
import { Role, Company, User } from '../types';
import { getCompanies, getUsers, getNotifications, markNotificationRead, getServiceRequests, getDocuments, fetchInitialData, getHRAdmissions, getHRRequests, getTimeSheets } from '../services/mockData';

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number }>;
  badge?: number;
  children?: MenuItem[];
}

interface LayoutProps {
  children: React.ReactNode;
  role: Role;
  setRole: (role: Role) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentCompanyId: string;
  setCurrentCompanyId: (id: string) => void;
  currentUser: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, role, setRole, currentPage, setCurrentPage, currentCompanyId, setCurrentCompanyId, currentUser, onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [notifications, setNotifications] = useState(getNotifications(currentUser.id));
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Badge Counts
  const [reqCount, setReqCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [hrAdmissionCount, setHrAdmissionCount] = useState(0);
  const [hrRequestCount, setHrRequestCount] = useState(0);
  const [hrTimesheetCount, setHrTimesheetCount] = useState(0);

  useEffect(() => {
    setCompanies(getCompanies());
  }, [role, currentPage]); 

  useEffect(() => {
    const sync = async () => {
      try {
        await fetchInitialData();
        setCompanies(getCompanies());
      } catch (e) {
        // Ignore transient sync errors; will retry on user actions.
      }
    };
    sync();
  }, [currentUser.id]);

  useEffect(() => {
    if (role === 'admin' && companies.length > 0 && currentCompanyId !== 'all' && !companies.find(c => c.id === currentCompanyId)) {
      setCurrentCompanyId(companies[0].id);
    }
  }, [role, companies, currentCompanyId, setCurrentCompanyId]);

  useEffect(() => {
    // Immediate fetch & polling for counts
    const fetchData = () => {
        setNotifications(getNotifications(currentUser.id));
        
        // Calculate Badges (Simple logic: Unread/New items)
        // For requests: Count 'Pendente Pagamento' or 'Solicitada' depending on role
        const reqs = getServiceRequests(role === 'client' ? currentCompanyId : undefined);
        const newReqs = role === 'admin' 
            ? reqs.filter(r => r.status === 'Solicitada' || r.status === 'Pendente Pagamento').length 
            : reqs.filter(r => r.status === 'Em Validação' || r.status === 'Resolvido').length; // Client sees updates
        setReqCount(newReqs);

        // For Docs:
        const docs = getDocuments(currentCompanyId);
        const newDocs = role === 'client' ? docs.filter(d => d.status === 'Enviado').length : 0;
        setDocCount(newDocs);

        // HR badges
        const admissions = getHRAdmissions(currentCompanyId);
        const admissionPending = admissions.filter(a => ['Novo', 'Validando', 'Formulario com Erro'].includes(a.status)).length;
        setHrAdmissionCount(admissionPending);

        const hrRequests = getHRRequests(currentCompanyId);
        const requestPending = hrRequests.filter(r => ['Solicitado', 'Em Analise', 'Pendencia'].includes(r.status)).length;
        setHrRequestCount(requestPending);

        const sheets = getTimeSheets(currentCompanyId);
        const timesheetPending = sheets.filter(s => s.status === 'Enviado').length;
        setHrTimesheetCount(timesheetPending);
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); 
    return () => clearInterval(interval);
  }, [currentUser.id, role, currentCompanyId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const stripMarkdown = (value: string) =>
    value.replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\n/g, ' ');

  const hrMenu: MenuItem = {
    id: 'hr',
    label: 'Depto. Pessoal',
    icon: Users,
    children: [
      { id: 'hr_employees', label: 'Funcionários Ativos' },
      { id: 'hr_inactive', label: 'Funcionários Inativos/Desligados' },
      { id: 'hr_admissions', label: 'Processo Admissão', badge: hrAdmissionCount },
      { id: 'hr_requests', label: 'Solicitações (Férias/Atestado/Demissão)', badge: hrRequestCount },
      { id: 'hr_timesheets', label: 'Ponto', badge: hrTimesheetCount },
      { id: 'hr_sites', label: 'Postos/Setores' }
    ]
  };

  const adminMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'routines', label: 'Rotinas Mensais', icon: FileText },
    { id: 'documents', label: 'Arquivos', icon: FileText, badge: 0 },
    { id: 'requests', label: 'Solicitações', icon: MessageSquare, badge: reqCount },
    hrMenu,
    { id: 'communication', label: 'Comunicados', icon: Briefcase },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const clientMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Meu Painel', icon: LayoutDashboard },
    { id: 'requests', label: 'Solicitações / Pedidos', icon: MessageSquare, badge: reqCount },
    { id: 'documents', label: 'Arquivos', icon: FileText, badge: docCount },
    hrMenu
  ];

  const employeeMenu: MenuItem[] = [
    { id: 'employee_clock', label: 'Marcar Ponto', icon: Users },
    { id: 'employee_timesheet', label: 'Folha de Ponto', icon: FileText },
    { id: 'employee_payroll', label: 'Meus Holerites', icon: FileText }
  ];

  const menuItems: MenuItem[] = role === 'admin' ? adminMenu : role === 'employee' ? employeeMenu : clientMenu;

  const currentCompanyName = currentCompanyId === 'all'
    ? 'Todas as Empresas'
    : companies.find(c => c.id === currentCompanyId)?.name || 'Empresa';
  const [openHrMenu, setOpenHrMenu] = useState(true);

  useEffect(() => {
    if (currentPage.startsWith('hr_')) {
      setOpenHrMenu(true);
    }
  }, [currentPage]);

  const resolveCurrentLabel = () => {
    if (currentPage === 'notifications') return 'Notificações';
    if (currentPage === 'profile') return 'Meu Perfil';
    for (const item of menuItems) {
      if (item.id === currentPage) return item.label;
      if (item.children) {
        const child = item.children.find(c => c.id === currentPage);
        if (child) return child.label;
      }
    }
    return 'ContabilConnect';
  };

  const handleNotificationClick = () => {
    setShowNotifDropdown(false);
    setCurrentPage('notifications');
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-lg tracking-wide">Contabil</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X size={24} />
          </button>
        </div>

        <div className="px-4 mt-6">
           <label className="text-xs text-slate-500 uppercase font-semibold block mb-2">Empresa Selecionada</label>
           
           {role === 'admin' ? (
             <div className="relative">
                <select 
                  value={currentCompanyId}
                  onChange={(e) => setCurrentCompanyId(e.target.value)}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-2 text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">Todas as Empresas</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                  <ChevronDown size={14} />
                </div>
             </div>
           ) : (
             <div className="w-full bg-slate-800/50 text-slate-300 border border-slate-700 rounded-lg p-2 text-sm flex items-center gap-2">
                <Building2 size={16} />
                <span className="truncate">{currentCompanyName}</span>
             </div>
           )}
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => {
            if (item.children && item.children.length > 0) {
              const Icon = item.icon || Users;
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => setOpenHrMenu(!openHrMenu)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                      openHrMenu ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown size={16} className={`transition-transform ${openHrMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {openHrMenu && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => {
                            setCurrentPage(child.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            currentPage === child.id
                              ? 'bg-blue-600 text-white shadow'
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{child.label}</span>
                          {child.badge && child.badge > 0 ? (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {child.badge}
                            </span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            const Icon = item.icon || Users;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                    <Icon size={20} />
                    <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                    </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex flex-col space-y-3">
             <div className="text-xs text-slate-500 px-2">Acesso via login</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-slate-600 hover:text-slate-900"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 px-4 lg:px-0">
             <h2 className="text-xl font-semibold text-slate-800">
               {resolveCurrentLabel()}
             </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
                <Bell size={20} className="text-slate-600 cursor-pointer hover:text-blue-600" />
              </button>

              {/* Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                   <div className="p-3 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 flex justify-between items-center">
                     <span>Notificações</span>
                     <button 
                      onClick={handleNotificationClick}
                      className="text-xs text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                    >
                      Ver todas
                    </button>
                   </div>
                   <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">Nenhuma notificação.</div>
                      ) : (
                        notifications.slice(0, 5).map(n => (
                          <div 
                            key={n.id} 
                            onClick={async () => {
                                await markNotificationRead(n.id);
                                setNotifications(getNotifications(currentUser.id));
                                handleNotificationClick();
                            }}
                            className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-blue-50/50' : ''}`}
                          >
                             <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-medium ${!n.read ? 'text-blue-800' : 'text-slate-700'}`}>{n.title}</span>
                                <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleDateString()}</span>
                             </div>
                             <p className="text-xs text-slate-500 line-clamp-2">{stripMarkdown(n.message)}</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div 
                className="flex items-center space-x-3 pl-4 border-l border-slate-200 cursor-pointer group"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role === 'employee' ? 'Funcionario' : currentUser.role}</p>
              </div>
              {currentUser.photoUrl ? (
                <img src={currentUser.photoUrl} className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-blue-300 transition-all" />
              ) : (
                <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                   {currentUser.name.substring(0,2).toUpperCase()}
                </div>
              )}
              </div>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <button
                    onClick={() => { setCurrentPage('profile'); setShowUserMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <UserCircle size={16} /> Meu Perfil
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
           {(showNotifDropdown || showUserMenu) && (
             <div
               className="fixed inset-0 z-20"
               onClick={() => { setShowNotifDropdown(false); setShowUserMenu(false); }}
             ></div>
           )}
           <div className="max-w-7xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
