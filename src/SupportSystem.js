import React, { useState, useEffect } from 'react';
import AppRouter from './AppRouter';
import Login from './components/Auth/Login';
import { logout } from './services/authService';

const SupportSystem = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState({ username: '', role: '' });

  useEffect(() => {
    // Simula verificação de autenticação (ajuste conforme sua lógica real)
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');
    if (token && username && userRole) {
      setIsAuthenticated(true);
      setCurrentUser({ username, role: userRole });
    }
    setLoading(false);
  }, []);

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
          <style>{`
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
    return <Login onLogin={(userData) => {
      setIsAuthenticated(true);
      setCurrentUser({
        username: userData.username,
        role: userData.role
      });
    }} />;
  }

  return <AppRouter currentUser={currentUser} onLogout={logout} />;
};

export default SupportSystem;
