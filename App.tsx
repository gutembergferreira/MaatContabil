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
import Login from './components/Login'; 
import { Role, User } from './types';
import { getUsers, fetchInitialData } from './services/mockData';
import { isDbInitialized, checkBackendHealth } from './services/dbService';

const App: React.FC = () => {
  // Application State Flow
  const [appState, setAppState] = useState<'loading' | 'setup' | 'login' | 'running'>('loading');
  
  // User Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('admin');
  
  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentCompanyId, setCurrentCompanyId] = useState<string>('c1');

  useEffect(() => {
    // Initialization Logic: Check Local Flag AND Backend Status
    const init = async () => {
        const localFlag = isDbInitialized();
        const backendReady = await checkBackendHealth();

        if (localFlag && backendReady) {
            setAppState('login');
        } else {
            if (localFlag && !backendReady) {
                console.warn('Frontend diz configurado, mas Backend está offline/desconectado. Forçando Setup.');
            }
            setAppState('setup');
        }
    };
    init();
  }, []);

  // Sync role updates
  useEffect(() => {
     if (appState === 'running' && currentUser) {
         if (role === 'admin') {
             // Re-fetch users from memory to ensure admin exists
             const admin = getUsers().find(u => u.role === 'admin');
             if(admin) setCurrentUser(admin);
             setCurrentCompanyId('c1');
         } else {
             const client = getUsers().find(u => u.role === 'client');
             if(client) {
                 setCurrentUser(client);
                 if (client.companyId) setCurrentCompanyId(client.companyId);
             }
         }
     }
  }, [role]);

  const handleLoginSuccess = async (role: Role) => {
      // Sync DB Data right after login
      await fetchInitialData();
      
      const user = getUsers().find(u => u.role === role);
      if (user) {
          setCurrentUser(user);
          setRole(role);
          setAppState('running');
      } else {
          // Fallback se o usuário não vier no sync
          console.error("Usuário não encontrado após sync");
      }
  };

  const handleProfileUpdate = () => {
      if (currentUser) {
        const updated = getUsers().find(u => u.id === currentUser.id);
        if (updated) setCurrentUser(updated);
      }
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

  // --- STATE 1: DATABASE SETUP ---
  if (appState === 'setup') {
      return <DatabaseSetup onComplete={() => setAppState('login')} />;
  }

  // --- STATE 2: LOGIN ---
  if (appState === 'login') {
      return <Login onLogin={handleLoginSuccess} />;
  }

  // --- STATE 3: RUNNING APP ---
  if (!currentUser) return null;

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return role === 'admin' ? <DashboardAdmin /> : <DashboardClient />;
      case 'routines':
        return <MonthlyRoutines />; 
      case 'documents':
        return <DocumentVault role={role} currentCompanyId={currentCompanyId} currentUser={currentUser} />;
      case 'requests':
        return <RequestManager role={role} currentUser={currentUser} currentCompanyId={currentCompanyId} />;
      case 'hr':
        return <HRManagement role={role} />;
      case 'communication':
        return <CommunicationCenter role={role} />;
      case 'settings':
        return role === 'admin' ? <SettingsManager /> : <div>Acesso Negado</div>;
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
    >
      {renderContent()}
    </Layout>
  );
};

export default App;