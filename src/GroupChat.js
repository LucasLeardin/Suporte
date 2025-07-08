import React, { useState, useEffect, useRef } from 'react';
import { authenticatedFetch } from './utils/auth';

const GroupChat = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [selectedGroupForInfo, setSelectedGroupForInfo] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    type: 'custom',
    department: '',
    selectedMembers: []
  });
  
  const messagesEndRef = useRef(null);
  const currentUsername = localStorage.getItem('username');
  const currentUserRole = localStorage.getItem('userRole');

  // Função para rolar para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar grupos disponíveis
  const fetchGroups = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/groups');
      const data = await response.json();
      
      if (response.ok) {
        setGroups(data);
        
        // Se não há grupo ativo, selecionar o primeiro (grupo geral)
        if (!activeGroup && data.length > 0) {
          setActiveGroup(data[0]);
        }
      } else {
        console.error('Erro ao carregar grupos:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  // Carregar mensagens do grupo ativo
  const fetchMessages = async () => {
    if (!activeGroup) return;
    
    try {
      setLoading(true);
      const response = await authenticatedFetch(`http://localhost:8000/groups/${activeGroup.id}/messages`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data);
      } else {
        console.error('Erro ao carregar mensagens:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !activeGroup) {
      return;
    }

    try {
      setSending(true);
      const response = await authenticatedFetch(`http://localhost:8000/groups/${activeGroup.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
      } else {
        alert('Erro ao enviar mensagem: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Criar novo grupo
  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      alert('Nome do grupo é obrigatório');
      return;
    }

    try {
      const response = await authenticatedFetch('http://localhost:8000/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          type: newGroup.type,
          department: newGroup.department,
          members: newGroup.selectedMembers
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Grupo criado com sucesso!');
        setGroups([...groups, data.group]);
        
        // Se há membros selecionados, adicionar cada um
        if (newGroup.type === 'custom' && newGroup.selectedMembers.length > 0) {
          for (const memberUsername of newGroup.selectedMembers) {
            try {
              await authenticatedFetch(`http://localhost:8000/groups/${data.group.id}/members`, {
                method: 'POST',
                body: JSON.stringify({ username: memberUsername })
              });
            } catch (error) {
              console.error(`Erro ao adicionar membro ${memberUsername}:`, error);
            }
          }
        }
        
        setNewGroup({ name: '', description: '', type: 'custom', department: '', selectedMembers: [] });
        setShowCreateGroup(false);
      } else {
        alert('Erro ao criar grupo: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      alert('Erro ao criar grupo');
    }
  };

  // Deletar grupo
  const deleteGroup = async (group) => {
    if (!window.confirm(`Tem certeza que deseja deletar o grupo "${group.name}"? Todas as mensagens serão perdidas.`)) {
      return;
    }

    try {
      const response = await authenticatedFetch(`http://localhost:8000/groups/${group.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Grupo deletado com sucesso!');
        setGroups(groups.filter(g => g.id !== group.id));
        
        // Se o grupo ativo foi deletado, selecionar o primeiro grupo
        if (activeGroup && activeGroup.id === group.id) {
          const remainingGroups = groups.filter(g => g.id !== group.id);
          setActiveGroup(remainingGroups.length > 0 ? remainingGroups[0] : null);
        }
      } else {
        const data = await response.json();
        alert('Erro ao deletar grupo: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      alert('Erro ao deletar grupo');
    }
  };

  // Buscar membros de um grupo
  const fetchGroupMembers = async (group) => {
    if (!group) return;
    
    try {
      setLoadingMembers(true);
      const response = await authenticatedFetch(`http://localhost:8000/groups/${group.id}/members`);
      const data = await response.json();
      
      if (response.ok) {
        setGroupMembers(data.members || []);
      } else {
        console.error('Erro ao carregar membros:', data.error);
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setGroupMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Buscar usuários disponíveis
  const fetchAvailableUsers = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/users/available');
      const data = await response.json();
      
      if (response.ok) {
        setAvailableUsers(data);
      } else {
        console.error('Erro ao carregar usuários:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  // Adicionar membro ao grupo
  const addMemberToGroup = async () => {
    if (!selectedUserToAdd || !selectedGroupForInfo) return;
    
    try {
      const response = await authenticatedFetch(`http://localhost:8000/groups/${selectedGroupForInfo.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ username: selectedUserToAdd })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Membro adicionado com sucesso!');
        setSelectedUserToAdd('');
        setShowAddMember(false);
        fetchGroupMembers(selectedGroupForInfo);
      } else {
        alert('Erro ao adicionar membro: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      alert('Erro ao adicionar membro');
    }
  };

  // Remover membro do grupo
  const removeMemberFromGroup = async (member) => {
    if (!selectedGroupForInfo) return;
    
    if (!window.confirm(`Tem certeza que deseja remover ${member.username} do grupo?`)) {
      return;
    }
    
    try {
      const response = await authenticatedFetch(`http://localhost:8000/groups/${selectedGroupForInfo.id}/members/${member.username}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Membro removido com sucesso!');
        fetchGroupMembers(selectedGroupForInfo);
      } else {
        const data = await response.json();
        alert('Erro ao remover membro: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      alert('Erro ao remover membro');
    }
  };

  // Abrir informações do grupo
  const openGroupInfo = (group) => {
    setSelectedGroupForInfo(group);
    setShowGroupInfo(true);
    fetchGroupMembers(group);
    fetchAvailableUsers();
  };

  // Lidar com teclas pressionadas no input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Carregar grupos ao montar o componente
  useEffect(() => {
    fetchGroups();
  }, []);

  // Carregar mensagens quando o grupo ativo mudar
  useEffect(() => {
    if (activeGroup) {
      fetchMessages();
      
      // Atualizar mensagens a cada 5 segundos
      const interval = setInterval(fetchMessages, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeGroup]);

  // Buscar membros do grupo ativo para mostrar contador
  useEffect(() => {
    if (activeGroup) {
      fetchGroupMembers(activeGroup);
    }
  }, [activeGroup]);

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const getGroupIcon = (group) => {
    switch (group.type) {
      case 'general': return '🌐';
      case 'department': return '🏢';
      case 'custom': return '👥';
      default: return '💬';
    }
  };

  return (
    <div style={{ padding: '30px', height: '100vh', display: 'flex' }}>
      {/* Lista de grupos */}
      <div style={{
        width: '300px',
        backgroundColor: 'white',
        borderRadius: '10px 0 0 10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ecf0f1',
        borderRight: 'none',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header dos grupos */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #ecf0f1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Grupos</h3>
          <button
            onClick={() => setShowCreateGroup(true)}
            style={{
              backgroundColor: '#27ae60',
              color: 'white',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            + Novo
          </button>
        </div>

        {/* Lista de grupos */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groups.map(group => (
            <div
              key={group.id}
              onClick={() => setActiveGroup(group)}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #f8f9fa',
                cursor: 'pointer',
                backgroundColor: activeGroup && activeGroup.id === group.id ? '#e3f2fd' : 'transparent',
                borderLeft: activeGroup && activeGroup.id === group.id ? '4px solid #2196f3' : '4px solid transparent',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!activeGroup || activeGroup.id !== group.id) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (!activeGroup || activeGroup.id !== group.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{getGroupIcon(group)}</span>
                    {group.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#7f8c8d',
                    marginTop: '3px'
                  }}>
                    {group.description || 'Sem descrição'}
                  </div>
                  {group.type === 'department' && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#95a5a6',
                      marginTop: '2px'
                    }}>
                      Departamento: {group.department}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openGroupInfo(group);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#3498db',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      fontSize: '12px'
                    }}
                    title="Informações do grupo"
                  >
                    ℹ️
                  </button>
                  
                  {!group.isDefault && (group.createdBy === currentUsername || currentUserRole === 'admin') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(group);
                      }}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#e74c3c',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 5px',
                        fontSize: '12px'
                      }}
                      title="Deletar grupo"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Área do chat */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '0 10px 10px 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ecf0f1',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeGroup ? (
          <>
            {/* Header do chat */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #ecf0f1',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{getGroupIcon(activeGroup)}</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>
                      {activeGroup.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>
                      {activeGroup.description || 'Chat do grupo'} • {groupMembers.length} {groupMembers.length === 1 ? 'membro' : 'membros'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => openGroupInfo(activeGroup)}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Informações do grupo"
                >
                  ℹ️ Info
                </button>
              </div>
            </div>

            {/* Mensagens */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 280px)'
            }}>
              {loading && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                  <p>Carregando mensagens...</p>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                  <p>Nenhuma mensagem ainda. Seja o primeiro a conversar!</p>
                </div>
              ) : (
                Object.entries(messageGroups).map(([date, dayMessages]) => (
                  <div key={date}>
                    {/* Separador de data */}
                    <div style={{
                      textAlign: 'center',
                      margin: '20px 0',
                      fontSize: '12px',
                      color: '#95a5a6'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: '#ecf0f1',
                        padding: '5px 15px',
                        borderRadius: '15px'
                      }}>
                        {date}
                      </div>
                    </div>

                    {/* Mensagens do dia */}
                    {dayMessages.map((message) => {
                      const isOwnMessage = message.username === currentUsername;
                      
                      return (
                        <div
                          key={message.id}
                          style={{
                            display: 'flex',
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                            marginBottom: '15px'
                          }}
                        >
                          <div style={{
                            maxWidth: '70%',
                            backgroundColor: isOwnMessage ? '#3498db' : '#f8f9fa',
                            color: isOwnMessage ? 'white' : '#2c3e50',
                            padding: '12px 15px',
                            borderRadius: '15px',
                            borderBottomRightRadius: isOwnMessage ? '5px' : '15px',
                            borderBottomLeftRadius: isOwnMessage ? '15px' : '5px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}>
                            {!isOwnMessage && (
                              <div style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                marginBottom: '5px',
                                color: message.userRole === 'admin' ? '#e74c3c' : '#27ae60'
                              }}>
                                {message.userRole === 'admin' ? '🔑' : '👤'} {message.username}
                                {message.department && ` • ${message.department}`}
                              </div>
                            )}
                            
                            <div style={{
                              marginBottom: '5px',
                              wordBreak: 'break-word',
                              lineHeight: '1.4'
                            }}>
                              {message.message}
                            </div>
                            
                            <div style={{
                              fontSize: '10px',
                              opacity: 0.7,
                              textAlign: 'right'
                            }}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              
              {/* Ref para scroll automático */}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulário de envio */}
            <form
              onSubmit={sendMessage}
              style={{
                padding: '20px',
                borderTop: '1px solid #ecf0f1',
                backgroundColor: '#f8f9fa'
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem... (Enter para enviar)"
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '25px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    backgroundColor: sending ? '#95a5a6' : '#3498db',
                    color: 'white',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    minWidth: '80px'
                  }}
                >
                  {sending ? '⏳' : '📤 Enviar'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#95a5a6'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <p>Selecione um grupo para começar a conversar</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para informações do grupo */}
      {showGroupInfo && selectedGroupForInfo && (
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
                {getGroupIcon(selectedGroupForInfo)} {selectedGroupForInfo.name}
              </h3>
              <button
                onClick={() => {
                  setShowGroupInfo(false);
                  setSelectedGroupForInfo(null);
                  setShowAddMember(false);
                  setSelectedUserToAdd('');
                }}
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
              <p><strong>Descrição:</strong> {selectedGroupForInfo.description || 'Nenhuma descrição'}</p>
              <p><strong>Tipo:</strong> {
                selectedGroupForInfo.type === 'general' ? 'Geral' :
                selectedGroupForInfo.type === 'department' ? 'Departamento' : 'Customizado'
              }</p>
              {selectedGroupForInfo.type === 'department' && (
                <p><strong>Departamento:</strong> {selectedGroupForInfo.department}</p>
              )}
              <p><strong>Criado por:</strong> {selectedGroupForInfo.createdBy}</p>
              <p><strong>Criado em:</strong> {new Date(selectedGroupForInfo.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>

            {/* Lista de membros */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#2c3e50' }}>
                  Membros ({groupMembers.length})
                </h4>
                
                {selectedGroupForInfo.type === 'custom' && 
                 (selectedGroupForInfo.createdBy === currentUsername || currentUserRole === 'admin') && (
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

              {loadingMembers ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#95a5a6' }}>
                  Carregando membros...
                </div>
              ) : (
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
                      
                      {selectedGroupForInfo.type === 'custom' && 
                       selectedGroupForInfo.createdBy !== member.username &&
                       (selectedGroupForInfo.createdBy === currentUsername || currentUserRole === 'admin') && (
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
              )}
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
      )}

      {/* Modal para criar novo grupo */}
      {showCreateGroup && (
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
              Criar Novo Grupo
            </h3>

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
                <option value="custom">Customizado (todos podem participar)</option>
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

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroup({ name: '', description: '', type: 'custom', department: '', selectedMembers: [] });
                }}
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
              <button
                onClick={createGroup}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Criar Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;
