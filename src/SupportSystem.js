import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Layout/Sidebar';
import QrCodeDisplay from './QrCodeDisplay';
import Messages from './Messages';
import Config from './Config';
import Users from './Users';
import Settings from './Settings';
import Chamados from './Chamados';
import Ponto from './Ponto';
import UnifiedChat from './components/Chat/UnifiedChat';
import Login from './components/Auth/Login';
import { logout } from './services/authService';

const SupportSystem = () => {
  const [activeTab, setActiveTab] = useState('chat'); // Forçar sempre chat como padrão
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ username: '', role: '' });

  // Verificar se o usuário já está logado
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const username = localStorage.getItem('username');
      
      if (token) {
        try {
          const response = await fetch('http://localhost:8000/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'x-username': username || ''
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            
            setIsAuthenticated(true);
            setCurrentUser({
              username: userData.username || localStorage.getItem('username'),
              role: userData.role || localStorage.getItem('userRole')
            });
            
            // Definir aba inicial baseada no role do usuário
            if (userData.role === 'user') {
              setActiveTab('chat');
            } else if (userData.role === 'admin') {
              setActiveTab('chat'); // Admin também vai para chat por padrão
            }
          } else {
            // Token inválido, fazer logout
            logout();
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          logout();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Função para verificar se o usuário tem permissão para acessar uma aba
  const hasPermissionForTab = useCallback((tabId) => {
    // Se não há usuário carregado, permitir acesso a chat
    if (!currentUser.role) {
      return tabId === 'chat';
    }
    
    const tabPermissions = {
      'whatsapp': ['admin'],
      'messages': ['admin', 'user'],
      'chat': ['admin', 'user'],
      'chamados': ['admin', 'user'],
      'ponto': ['admin', 'user'],
      'config': ['admin'],
      'settings': ['admin'],
      'users': ['admin']
    };

    return tabPermissions[tabId] && tabPermissions[tabId].includes(currentUser.role);
  }, [currentUser.role]);

  // UseEffect para garantir permissões
  useEffect(() => {
    if (isAuthenticated && !hasPermissionForTab(activeTab)) {
      setActiveTab('chat');
    }
  }, [isAuthenticated, activeTab, hasPermissionForTab]);

  // Listener para mudanças de aba via eventos customizados
  useEffect(() => {
    const handleTabChange = (event) => {
      console.log('Evento tabChange recebido:', event.detail);
      console.log('Permissão para aba:', event.detail, hasPermissionForTab(event.detail));
      
      if (event.detail && hasPermissionForTab(event.detail)) {
        console.log('Mudando para aba:', event.detail);
        setActiveTab(event.detail);
      } else {
        console.log('Sem permissão para aba:', event.detail);
      }
    };

    window.addEventListener('tabChange', handleTabChange);
    return () => window.removeEventListener('tabChange', handleTabChange);
  }, [currentUser.role, hasPermissionForTab]); // Adicionar hasPermissionForTab

  const handleLogin = (userData) => {
    console.log('handleLogin chamado com:', userData);
    
    setIsAuthenticated(true);
    setCurrentUser({
      username: userData.username,
      role: userData.role
    });
    
    // Definir aba inicial baseada no role do usuário
    if (userData.role === 'user') {
      setActiveTab('chat');
    } else if (userData.role === 'admin') {
      setActiveTab('chat'); // Admin também vai para chat por padrão
    }
    
    console.log('Login processado, usuário autenticado:', {
      username: userData.username,
      role: userData.role,
      activeTab: 'chat'
    });
  };

  // Função personalizada para mudança de aba com verificação de permissão
  const handleTabChange = (tabId) => {
    if (hasPermissionForTab(tabId)) {
      setActiveTab(tabId);
    } else {
      // Se usuário não tem permissão, redirecionar para chat interno
      setActiveTab('chat');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      logout();
      setIsAuthenticated(false);
      setCurrentUser({ username: '', role: '' });
      setActiveTab('chat');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Carregando...</p>
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    // Sempre garantir que está na aba chat se há problema de permissão
    if (!hasPermissionForTab(activeTab)) {
      // Forçar redirecionamento para chat
      setTimeout(() => setActiveTab('chat'), 0);
      return <UnifiedChat />; // Retornar chat diretamente
    }

    switch (activeTab) {
      case 'whatsapp':
        return <QrCodeDisplay />;
      case 'messages':
        return <Messages />;
      case 'chat':
        return <UnifiedChat />;
      case 'chamados':
        return <Chamados />;
      case 'ponto':
        return <Ponto currentUser={currentUser} />;
      case 'config':
        return <Config />;
      case 'settings':
        return <Settings />;
      case 'users':
        return <Users />;
      default:
        return <UnifiedChat />; // Usuários padrão vão para chat interno
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      maxHeight: '100vh',
      maxWidth: '100vw',
      backgroundColor: '#ecf0f1',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* Menu Lateral */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      {/* Conteúdo Principal */}
      <div style={{
        marginLeft: '250px',
        flex: 1,
        height: '100vh',
        maxHeight: '100vh',
        backgroundColor: '#ecf0f1',
        overflow: 'hidden',
        width: 'calc(100vw - 250px)',
        maxWidth: 'calc(100vw - 250px)',
        boxSizing: 'border-box',
        padding: 0,
        margin: 0,
        marginLeft: '250px'
      }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SupportSystem;
