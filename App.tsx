import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardAdmin from './components/DashboardAdmin';
import DashboardClient from './components/DashboardClient';
import DocumentVault from './components/DocumentVault';
import HRManagement from './components/HRManagement';
import CommunicationCenter from './components/CommunicationCenter';
import SettingsManager from './components/SettingsManager';
import NotificationPage from './components/NotificationPage';
import MonthlyRoutines from './components/MonthlyRoutines';
import RequestManager from './components/RequestManager';
import UserProfile from './components/UserProfile';
import DatabaseSetup from './components/DatabaseSetup'; 
import EmployeePortal from './components/EmployeePortal';
import Login from './components/Login'; 
import { Role, User } from './types';
import { getUsers, fetchInitialData, loadApiBaseFromServer } from './services/mockData';
import { checkBackendHealth } from './services/dbService';

const CURRENT_USER_KEY = 'maat_current_user';

const App: React.FC = () => {
  // Application State Flow
  const [appState, setAppState] = useState<'loading' | 'setup' | 'login' | 'running'>('loading');
  
  // User Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('admin');
  
  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentCompanyId, setCurrentCompanyId] = useState<string>('c1');

  const getDefaultPage = (userRole: Role) => userRole === 'employee' ? 'employee_clock' : 'dashboard';

  useEffect(() => {
    // Initialization Logic: Check Local Flag AND Backend Status
    const init = async () => {
        await loadApiBaseFromServer();
        const backendReady = await checkBackendHealth();

        if (backendReady) {
            const saved = localStorage.getItem(CURRENT_USER_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setCurrentUser(parsed);
                    setRole(parsed.role);
                    if (parsed.companyId) setCurrentCompanyId(parsed.companyId);
                    setCurrentPage(getDefaultPage(parsed.role));
                    setAppState('running');
                    fetchInitialData().catch(() => null);
                } catch (e) {
                    localStorage.removeItem(CURRENT_USER_KEY);
                    setAppState('login');
                }
            } else {
                setAppState('login');
            }
        } else {
            setAppState('setup');
        }
    };
    init();
  }, []);

  // Sync role updates
  useEffect(() => {
     if (appState === 'running' && currentUser) {
         setRole(currentUser.role);
         if (currentUser.companyId) setCurrentCompanyId(currentUser.companyId);
     }
  }, [appState, currentUser]);

  const handleLoginSuccess = async (userObj: User) => {
      // 1. Set user immediately from login response
      setCurrentUser(userObj);
      setRole(userObj.role);
      if (userObj.companyId) setCurrentCompanyId(userObj.companyId);
      setCurrentPage(getDefaultPage(userObj.role));
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userObj));

      // 2. Try to sync other data in background
      try {
          await fetchInitialData();
      } catch (e) {
          console.error("Sync data failed, but session is active.");
      }
      
      // 3. Start the app
      setAppState('running');
  };

  const handleProfileUpdate = () => {
      if (currentUser) {
        const updated = getUsers().find(u => u.id === currentUser.id);
        if (updated) {
            setCurrentUser(updated);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
        }
      }
  };

  const handleLogout = () => {
      localStorage.removeItem(CURRENT_USER_KEY);
      setCurrentUser(null);
      setAppState('login');
  };

  if (appState === 'loading') {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-400">Verificando conexão com o servidor...</p>
              </div>
          </div>
      );
  }

  if (appState === 'setup') {
      return <DatabaseSetup onComplete={() => setAppState('login')} />;
  }

  if (appState === 'login') {
      return <Login onLogin={handleLoginSuccess} />;
  }

  if (!currentUser) return null;

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return role === 'admin' ? <DashboardAdmin /> : <DashboardClient />;
      case 'routines':
        return <MonthlyRoutines role={role} currentCompanyId={currentCompanyId} />; 
      case 'documents':
        return <DocumentVault role={role} currentCompanyId={currentCompanyId} currentUser={currentUser} />;
      case 'requests':
        return <RequestManager role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} />;
      case 'hr':
        return <HRManagement role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} initialTab="employees" />;
      case 'hr_employees':
        return <HRManagement role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} initialTab="employees" />;
      case 'hr_inactive':
        return <HRManagement role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} initialTab="inactive" />;
      case 'hr_admissions':
        return <HRManagement role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} initialTab="admissions" />;
      case 'hr_requests':
        return <HRManagement role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} initialTab="requests" />;
      case 'hr_timesheets':
        return <HRManagement role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} initialTab="timesheets" />;
      case 'hr_sites':
        return <HRManagement role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} initialTab="sites" />;
      case 'employee_clock':
        return <EmployeePortal currentUser={currentUser} initialTab="clock" />;
      case 'employee_timesheet':
        return <EmployeePortal currentUser={currentUser} initialTab="sheet" />;
      case 'employee_payroll':
        return <EmployeePortal currentUser={currentUser} initialTab="holerites" />;
      case 'communication':
        return <CommunicationCenter role={role} />;
      case 'settings':
        return role === 'admin' ? <SettingsManager currentUser={currentUser} /> : <div>Acesso Negado</div>;
      case 'notifications':
        return <NotificationPage userId={currentUser.id} />;
      case 'profile':
        return <UserProfile user={currentUser} onUpdate={handleProfileUpdate} />;
      default:
        return role === 'admin' ? <DashboardAdmin /> : <DashboardClient />;
    }
  };

  return (
    <Layout 
      role={role} 
      setRole={setRole} 
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      currentCompanyId={currentCompanyId}
      setCurrentCompanyId={setCurrentCompanyId}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
