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
import DatabaseSetup from './components/DatabaseSetup'; // New
import Login from './components/Login'; // New
import { Role, User } from './types';
import { getUsers } from './services/mockData';
import { isDbInitialized } from './services/dbService';

const App: React.FC = () => {
  // Application State Flow
  const [appState, setAppState] = useState<'setup' | 'login' | 'running'>('setup');
  
  // User Session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('admin');
  
  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentCompanyId, setCurrentCompanyId] = useState<string>('c1');

  useEffect(() => {
    // Check initialization status
    if (isDbInitialized()) {
        setAppState('login');
    } else {
        setAppState('setup');
    }
  }, []);

  // Sync role updates
  useEffect(() => {
     if (appState === 'running' && currentUser) {
         if (role === 'admin') {
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

  const handleLoginSuccess = (role: Role) => {
      const user = getUsers().find(u => u.role === role);
      if (user) {
          setCurrentUser(user);
          setRole(role);
          setAppState('running');
      }
  };

  const handleProfileUpdate = () => {
      if (currentUser) {
        const updated = getUsers().find(u => u.id === currentUser.id);
        if (updated) setCurrentUser(updated);
      }
  };

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