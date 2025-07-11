import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ currentUser, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'chat', label: 'Chat de Grupos', icon: '🗨️' },
    { id: 'messages', label: 'Mensagens WhatsApp', icon: '📱' },
    { id: 'chamados', label: 'Chamados', icon: '🎫' },
    { id: 'ponto', label: 'Ponto', icon: '⏰' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
    { id: 'users', label: 'Usuários', icon: '👥' }
  ];

  const handleLogout = () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      onLogout();
    }
  };


  const handleTabClick = (tabId) => {
    let path = '/';
    switch (tabId) {
      case 'whatsapp':
        path = '/whatsapp';
        break;
      case 'chat':
        path = '/chat';
        break;
      case 'messages':
        path = '/mensagens_whatsapp';
        break;
      case 'chamados':
        path = '/chamados';
        break;
      case 'ponto':
        path = '/ponto';
        break;
      case 'settings':
        path = '/configuracoes';
        break;
      case 'users':
        path = '/usuarios';
        break;
      default:
        path = '/';
    }
    navigate(path);
  };

  return (
    <div style={{
      width: '250px',
      backgroundColor: '#2c3e50',
      color: 'white',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #34495e'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #34495e',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '24px', color: '#ecf0f1' }}>
          Sistema
        </h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#bdc3c7' }}>
          Bem-vindo, {currentUser.username}
        </p>
      </div>

      {/* Menu Items */}
      <div style={{ flex: 1, padding: '20px 0' }}>
        {menuItems.map(item => {
          // Define a rota base para cada item
          let route = '/';
          switch (item.id) {
            case 'whatsapp':
              route = '/whatsapp';
              break;
            case 'messages':
              route = '/mensagens_whatsapp';
              break;
            case 'chamados':
              route = '/chamados';
              break;
            case 'ponto':
              route = '/ponto';
              break;
            case 'settings':
              route = '/configuracoes';
              break;
            case 'users':
              route = '/usuarios';
              break;
            default:
              route = '/';
          }
          // Considera ativo se o pathname começa com a rota base
          const isActive = location.pathname === route || location.pathname.startsWith(route + '/');
          return (
            <div
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              style={{
                padding: '12px 20px',
                cursor: 'pointer',
                backgroundColor: isActive ? '#3498db' : 'transparent',
                borderLeft: isActive ? '4px solid #2980b9' : '4px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = '#34495e';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid #34495e'
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
