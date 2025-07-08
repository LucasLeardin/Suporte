import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  const userRole = localStorage.getItem('userRole');
  const username = localStorage.getItem('username');
  
  const menuItems = [
    {
      id: 'whatsapp',
      icon: '💬',
      label: 'WhatsApp',
      description: 'Conexão WhatsApp',
      roles: ['admin'] // Apenas admins podem ver
    },
    {
      id: 'messages',
      icon: '📝',
      label: 'Mensagens',
      description: 'Histórico de conversas',
      roles: ['admin', 'user'] // Todos podem ver
    },
    {
      id: 'chat',
      icon: '�',
      label: 'Chat Interno',
      description: 'Grupos e conversas privadas',
      roles: ['admin', 'user'] // Todos podem ver
    },
    {
      id: 'config',
      icon: '⚙️',
      label: 'Configurações',
      description: 'Configurações do bot',
      roles: ['admin'] // Apenas admins podem ver
    },
    {
      id: 'users',
      icon: '👨‍�',
      label: 'Usuários',
      description: 'Gerenciar usuários',
      roles: ['admin'] // Apenas admins podem ver
    }
  ];

  // Filtrar itens do menu baseado no role do usuário
  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div style={{
      width: '250px',
      height: '100vh',
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '0',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000
    }}>
      {/* Header do Menu */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #34495e',
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#ecf0f1'
        }}>
          🎧 Support System
        </h2>
        <p style={{
          margin: '5px 0 0 0',
          fontSize: '12px',
          color: '#95a5a6'
        }}>
          Sistema de Suporte
        </p>
        
        {/* Informações do usuário logado */}
        {username && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: userRole === 'admin' ? '#e74c3c' : '#27ae60',
            borderRadius: '5px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: 'bold', color: 'white' }}>
              👤 {username}
            </div>
            <div style={{ color: 'white', marginTop: '3px' }}>
              {userRole === 'admin' ? '🔑 Administrador' : '👨‍💼 Usuário'}
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav style={{ padding: '10px 0' }}>
        {visibleMenuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              padding: '15px 20px',
              cursor: 'pointer',
              backgroundColor: activeTab === item.id ? '#3498db' : 'transparent',
              borderLeft: activeTab === item.id ? '4px solid #fff' : '4px solid transparent',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '2px 0'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.target.style.backgroundColor = '#34495e';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <div>
              <div style={{
                fontWeight: activeTab === item.id ? 'bold' : 'normal',
                fontSize: '14px'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#95a5a6',
                marginTop: '2px'
              }}>
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </nav>

      {/* Footer do Menu */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '20px',
        textAlign: 'center',
        fontSize: '11px',
        color: '#95a5a6',
        borderTop: '1px solid #34495e',
        paddingTop: '15px'
      }}>
        <div>Sistema Online</div>
        <div style={{ marginTop: '5px', color: '#27ae60' }}>
          ● Operacional
        </div>
        
        {/* Botão de Logout */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
        >
          🚪 Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
