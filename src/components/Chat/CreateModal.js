import React, { useState } from 'react';

const CreateModal = ({ 
  showModal, 
  onClose, 
  onCreateGroup, 
  onStartPrivateChat,
  availableUsers,
  conversations,
  currentUsername 
}) => {
  const [createMode, setCreateMode] = useState('group');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'custom',
    department: '',
    selectedMembers: []
  });

  const handleClose = () => {
    setCreateMode('group');
    setNewGroup({ name: '', description: '', type: 'custom', department: '', selectedMembers: [] });
    onClose();
  };

  const handleCreateGroup = () => {
    onCreateGroup(newGroup);
    handleClose();
  };

  const handleStartPrivateChat = (username) => {
    if (username) {
      onStartPrivateChat(username);
      handleClose();
    }
  };

  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '10px',
        width: '500px',
        maxWidth: '90vw'
      }}>
        <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          O que você deseja fazer?
        </h3>

        {/* Seleção do tipo */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setCreateMode('group')}
              style={{
                flex: 1,
                padding: '15px',
                border: createMode === 'group' ? '2px solid #3498db' : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: createMode === 'group' ? '#e3f2fd' : 'white',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Criar Grupo</div>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Conversa em grupo para equipe</div>
            </button>
            
            <button
              onClick={() => setCreateMode('private')}
              style={{
                flex: 1,
                padding: '15px',
                border: createMode === 'private' ? '2px solid #27ae60' : '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: createMode === 'private' ? '#e8f5e8' : 'white',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👤</div>
              <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Conversa Privada</div>
              <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Chat 1-a-1 com usuário</div>
            </button>
          </div>
        </div>

        {/* Formulário baseado no modo selecionado */}
        {createMode === 'group' ? (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nome do Grupo:
              </label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
                placeholder="Ex: Marketing, Vendas, Projetos..."
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Descrição (opcional):
              </label>
              <input
                type="text"
                value={newGroup.description}
                onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
                placeholder="Breve descrição do grupo..."
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Tipo:
              </label>
              <select
                value={newGroup.type}
                onChange={(e) => setNewGroup({...newGroup, type: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="custom">Customizado (controle manual de membros)</option>
                <option value="department">Por departamento</option>
              </select>
            </div>

            {newGroup.type === 'department' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Departamento:
                </label>
                <input
                  type="text"
                  value={newGroup.department}
                  onChange={(e) => setNewGroup({...newGroup, department: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nome do departamento..."
                />
              </div>
            )}
          </>
        ) : (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Selecionar Usuário:
            </label>
            <select
              onChange={(e) => handleStartPrivateChat(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Escolha um usuário para conversar...</option>
              {availableUsers
                .filter(user => user.username !== currentUsername)
                .map(user => (
                  <option key={user.username} value={user.username}>
                    {user.username} ({user.role} - {user.department})
                    {conversations.some(c => c.otherUser && c.otherUser.username === user.username) ? ' - Conversa ativa' : ''}
                  </option>
                ))}
            </select>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
              Se já existe uma conversa com o usuário, você será redirecionado para ela.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: '#95a5a6',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          
          {createMode === 'group' && (
            <button
              onClick={handleCreateGroup}
              disabled={!newGroup.name.trim()}
              style={{
                backgroundColor: newGroup.name.trim() ? '#3498db' : '#95a5a6',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: newGroup.name.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Criar Grupo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateModal;
