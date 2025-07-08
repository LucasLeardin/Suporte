import React, { useState } from 'react';
import { groupService } from '../../services/chatService';

const GroupInfoModal = ({ 
  show, 
  group, 
  groupMembers, 
  availableUsers, 
  currentUsername,
  currentUserRole,
  onClose,
  onRefreshMembers 
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

  const getGroupIcon = (group) => {
    switch (group?.type) {
      case 'general': return '🌐';
      case 'department': return '🏢';
      case 'custom': return '👥';
      default: return '💬';
    }
  };

  // Adicionar membro ao grupo
  const addMemberToGroup = async () => {
    if (!selectedUserToAdd || !group) return;
    
    try {
      await groupService.addMemberToGroup(group.id, selectedUserToAdd);
      alert('Membro adicionado com sucesso!');
      setSelectedUserToAdd('');
      setShowAddMember(false);
      onRefreshMembers();
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert('Erro ao adicionar membro');
    }
  };

  // Remover membro do grupo
  const removeMemberFromGroup = async (member) => {
    if (!group) return;
    
    if (!window.confirm(`Tem certeza que deseja remover ${member.username} do grupo?`)) {
      return;
    }
    
    try {
      await groupService.removeMemberFromGroup(group.id, member.username);
      alert('Membro removido com sucesso!');
      onRefreshMembers();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      alert('Erro ao remover membro');
    }
  };

  const handleClose = () => {
    setShowAddMember(false);
    setSelectedUserToAdd('');
    onClose();
  };

  if (!show || !group) return null;

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
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ color: '#2c3e50', margin: 0 }}>
            {getGroupIcon(group)} {group.name}
          </h3>
          <button
            onClick={handleClose}
            style={{
              backgroundColor: 'transparent',
              color: '#95a5a6',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Informações básicas */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <p><strong>Descrição:</strong> {group.description || 'Nenhuma descrição'}</p>
          <p><strong>Tipo:</strong> {
            group.type === 'general' ? 'Geral' :
            group.type === 'department' ? 'Departamento' : 'Customizado'
          }</p>
          {group.type === 'department' && (
            <p><strong>Departamento:</strong> {group.department}</p>
          )}
          <p><strong>Criado por:</strong> {group.createdBy}</p>
          <p><strong>Criado em:</strong> {new Date(group.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Lista de membros */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: '#2c3e50' }}>
              Membros ({groupMembers.length})
            </h4>
            
            {group.type === 'custom' && 
             (group.createdBy === currentUsername || currentUserRole === 'admin') && (
              <button
                onClick={() => setShowAddMember(true)}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  padding: '5px 10px',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                + Adicionar Membro
              </button>
            )}
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {groupMembers.map(member => (
              <div
                key={member.username}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #ecf0f1',
                  borderRadius: '5px',
                  marginBottom: '5px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {member.role === 'admin' ? '🔑' : '👤'} {member.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {member.role} • {member.department}
                  </div>
                </div>
                
                {group.type === 'custom' && 
                 group.createdBy !== member.username &&
                 (group.createdBy === currentUsername || currentUserRole === 'admin') && (
                  <button
                    onClick={() => removeMemberFromGroup(member)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#e74c3c',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      fontSize: '12px'
                    }}
                    title="Remover membro"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal interno para adicionar membro */}
        {showAddMember && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              width: '400px',
              maxWidth: '90vw'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>
                Adicionar Membro
              </h4>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Selecionar Usuário:
                </label>
                <select
                  value={selectedUserToAdd}
                  onChange={(e) => setSelectedUserToAdd(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Selecione um usuário...</option>
                  {availableUsers
                    .filter(user => !groupMembers.some(member => member.username === user.username))
                    .map(user => (
                      <option key={user.username} value={user.username}>
                        {user.username} ({user.role} - {user.department})
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    setSelectedUserToAdd('');
                  }}
                  style={{
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={addMemberToGroup}
                  disabled={!selectedUserToAdd}
                  style={{
                    backgroundColor: selectedUserToAdd ? '#27ae60' : '#95a5a6',
                    color: 'white',
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: selectedUserToAdd ? 'pointer' : 'not-allowed'
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupInfoModal;
