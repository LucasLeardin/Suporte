
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { authenticatedFetch } from '../../utils/auth';

const UnifiedChat = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [chatType, setChatType] = useState('group'); // 'group' ou 'private'
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  // Removido showCreateGroup, modal de criação agora é unificado
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState(null); // null, 'group' ou 'private'
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
  const fetchGroups = useCallback(async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/groups');
      const data = await response.json();
      
      if (response.ok) {
        setGroups(data);
        
        // Se não há chat ativo, selecionar o primeiro grupo
        if (!activeChat && data.length > 0) {
          setActiveChat(data[0]);
          setChatType('group');
        }
      } else {
        console.error('Erro ao carregar grupos:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  }, [activeChat, setActiveChat, setChatType, setGroups]);

  // Carregar conversas privadas
  const fetchConversations = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/private-chat/conversations');
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data);
      } else {
        console.error('Erro ao carregar conversas:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  // Carregar mensagens do chat ativo
  const fetchMessages = useCallback(async () => {
    if (!activeChat) return;
    try {
      setLoading(true);
      let response;
      if (chatType === 'group') {
        response = await authenticatedFetch(`http://localhost:8000/groups/${activeChat.id}/messages`);
      } else {
        response = await authenticatedFetch(`http://localhost:8000/private-chat/messages/${activeChat.username}`);
      }
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
  }, [activeChat, chatType, setLoading, setMessages]);

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !activeChat) {
      return;
    }

    try {
      setSending(true);
      let response;
      
      if (chatType === 'group') {
        response = await authenticatedFetch(`http://localhost:8000/groups/${activeChat.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message: newMessage })
        });
      } else {
        response = await authenticatedFetch(`http://localhost:8000/private-chat/messages/${activeChat.username}`, {
          method: 'POST',
          body: JSON.stringify({ message: newMessage })
        });
      }

      const data = await response.json();

      if (response.ok) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
        
        // Atualizar lista de conversas se for chat privado
        if (chatType === 'private') {
          fetchConversations();
        }
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

  // Selecionar chat (grupo ou conversa privada)
  const selectChat = (chat, type) => {
    setActiveChat(chat);
    setChatType(type);
  };

  // Lidar com teclas pressionadas no input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    fetchGroups();
    fetchConversations();
    fetchAvailableUsers();
  }, [fetchGroups]);

  // Carregar mensagens quando o chat ativo mudar
  useEffect(() => {
    if (activeChat) {
      fetchMessages();
      
      // Atualizar mensagens a cada 5 segundos
      const interval = setInterval(fetchMessages, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeChat, chatType, fetchMessages]);

  // Buscar membros do grupo ativo para mostrar contador
  useEffect(() => {
    if (activeChat && chatType === 'group') {
      fetchGroupMembers(activeChat);
    }
  }, [activeChat, chatType]);

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Atualizar conversas privadas periodicamente
  useEffect(() => {
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Funcões para gerenciamento de grupos (reutilizadas do GroupChat)
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
        // Removido setShowCreateGroup, modal de criação agora é unificado
      } else {
        alert('Erro ao criar grupo: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      alert('Erro ao criar grupo');
    }
  };

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
        if (activeChat && chatType === 'group' && activeChat.id === group.id) {
          const remainingGroups = groups.filter(g => g.id !== group.id);
          if (remainingGroups.length > 0) {
            setActiveChat(remainingGroups[0]);
            setChatType('group');
          } else {
            setActiveChat(null);
          }
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

  // Iniciar nova conversa privada
  const startPrivateChat = (username) => {
    // Verificar se já existe conversa
    const existingConversation = conversations.find(c => c.otherUser && c.otherUser.username === username);
    if (existingConversation) {
      selectChat(existingConversation.otherUser, 'private');
    } else {
      // Criar nova conversa
      const user = availableUsers.find(u => u.username === username);
      const newConversation = { 
        username, 
        role: user ? user.role : 'user', 
        department: user ? user.department : 'N/A' 
      };
      selectChat(newConversation, 'private');
    }
  };

  // Abrir informações do grupo
  const openGroupInfo = (group) => {
    setSelectedGroupForInfo(group);
    setShowGroupInfo(true);
    fetchGroupMembers(group);
    fetchAvailableUsers();
  };

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Lista de conversas (grupos + privadas) */}
      <div style={{
        width: '350px',
        backgroundColor: 'white',
        border: '1px solid #ecf0f1',
        borderRight: 'none',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #ecf0f1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Chat Interno</h3>
          <button
            onClick={() => {
              setCreateMode(null);
              setShowCreateModal(true);
              setNewGroup({ name: '', description: '', type: 'custom', department: '', selectedMembers: [] });
            }}
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
            + Nova
          </button>
        </div>

        {/* Lista unificada */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Seção de Grupos */}
          <div style={{
            padding: '15px 20px 10px',
            borderBottom: '1px solid #f8f9fa',
            backgroundColor: '#f8f9fa',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#7f8c8d',
            textTransform: 'uppercase'
          }}>
            GRUPOS ({groups.length})
          </div>
          
          {groups.map(group => (
            <div
              key={`group-${group.id}`}
              onClick={() => selectChat(group, 'group')}
              style={{
                padding: '15px 20px',
                borderBottom: '1px solid #f8f9fa',
                cursor: 'pointer',
                backgroundColor: activeChat && chatType === 'group' && activeChat.id === group.id ? '#e3f2fd' : 'transparent',
                borderLeft: activeChat && chatType === 'group' && activeChat.id === group.id ? '4px solid #2196f3' : '4px solid transparent',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!activeChat || chatType !== 'group' || activeChat.id !== group.id) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (!activeChat || chatType !== 'group' || activeChat.id !== group.id) {
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

          {/* Seção de Conversas Privadas */}
          <div style={{
            padding: '15px 20px 10px',
            borderBottom: '1px solid #f8f9fa',
            backgroundColor: '#f8f9fa',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#7f8c8d',
            textTransform: 'uppercase'
          }}>
            CONVERSAS PRIVADAS ({conversations.length})
          </div>

          {conversations.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#95a5a6',
              fontSize: '14px'
            }}>
              Nenhuma conversa privada ainda
            </div>
          ) : (
            conversations.map(conversation => (
              <div
                key={`private-${conversation.otherUser.username}`}
                onClick={() => selectChat(conversation.otherUser, 'private')}
                style={{
                  padding: '15px 20px',
                  borderBottom: '1px solid #f8f9fa',
                  cursor: 'pointer',
                  backgroundColor: activeChat && chatType === 'private' && activeChat.username === conversation.otherUser.username ? '#e8f5e8' : 'transparent',
                  borderLeft: activeChat && chatType === 'private' && activeChat.username === conversation.otherUser.username ? '4px solid #27ae60' : '4px solid transparent',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!activeChat || chatType !== 'private' || activeChat.username !== conversation.otherUser.username) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!activeChat || chatType !== 'private' || activeChat.username !== conversation.otherUser.username) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>👤</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: '#2c3e50'
                    }}>
                      {conversation.otherUser.username}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#7f8c8d',
                      marginTop: '2px'
                    }}>
                      {conversation.otherUser.role} • {conversation.otherUser.department}
                    </div>
                  </div>
                  {conversation.lastMessage && (
                    <div style={{
                      fontSize: '10px',
                      color: '#95a5a6'
                    }}>
                      {formatTime(conversation.lastMessage.timestamp)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Área do chat */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        border: '1px solid #ecf0f1',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeChat ? (
          <>
            {/* Header do chat */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #ecf0f1',
              backgroundColor: '#f8f9fa'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>
                    {chatType === 'group' ? getGroupIcon(activeChat) : '👤'}
                  </span>
                  <div>
                    <h3 style={{ margin: 0, color: '#2c3e50' }}>
                      {chatType === 'group' ? activeChat.name : activeChat.username}
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>
                      {chatType === 'group' 
                        ? `${activeChat.description || 'Chat do grupo'} • ${groupMembers.length} ${groupMembers.length === 1 ? 'membro' : 'membros'}`
                        : `Chat privado • ${activeChat.role || 'user'}`
                      }
                    </p>
                  </div>
                </div>
                
                {chatType === 'group' && (
                  <button
                    onClick={() => openGroupInfo(activeChat)}
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
                )}
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
                  <p>
                    {chatType === 'group' 
                      ? 'Nenhuma mensagem ainda. Seja o primeiro a conversar!' 
                      : 'Inicie a conversa enviando uma mensagem!'
                    }
                  </p>
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
                      // Para mensagens privadas, usar fromUsername; para grupos, usar username
                      const messageUsername = chatType === 'private' ? message.fromUsername : message.username;
                      const messageUserRole = chatType === 'private' ? message.fromRole : message.userRole;
                      const messageDepartment = chatType === 'private' ? message.fromDepartment : message.department;
                      
                      const isOwnMessage = messageUsername === currentUsername;
                      
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
                            {!isOwnMessage && chatType === 'group' && (
                              <div style={{
                                fontSize: '11px',
                                fontWeight: 'bold',
                                marginBottom: '5px',
                                color: messageUserRole === 'admin' ? '#e74c3c' : '#27ae60'
                              }}>
                                {messageUserRole === 'admin' ? '🔑' : '👤'} {messageUsername}
                                {messageDepartment && ` • ${messageDepartment}`}
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
              <p>Selecione uma conversa para começar</p>
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

      {/* Modal unificado para criar grupo ou iniciar conversa */}
      {showCreateModal && (
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
              {createMode === null && 'O que você deseja fazer?'}
              {createMode === 'group' && 'Criar Novo Grupo'}
              {createMode === 'private' && 'Iniciar Conversa Privada'}
            </h3>

            {/* Seleção do tipo */}
            {createMode === null && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setCreateMode('group')}
                    style={{
                      flex: 1,
                      padding: '15px',
                      border: '2px solid #3498db',
                      borderRadius: '8px',
                      backgroundColor: '#e3f2fd',
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
                      border: '2px solid #27ae60',
                      borderRadius: '8px',
                      backgroundColor: '#e8f5e8',
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
            )}

            {/* Formulário baseado no modo selecionado */}
            {createMode === 'group' && (
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
            )}
            {createMode === 'private' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Selecionar Usuário:
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      startPrivateChat(e.target.value);
                      setShowCreateModal(false);
                      setCreateMode(null);
                    }
                  }}
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
                onClick={() => {
                  if (createMode === null) {
                    setShowCreateModal(false);
                  } else {
                    setCreateMode(null);
                  }
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
                {createMode === null ? 'Cancelar' : 'Voltar'}
              </button>
              {createMode === 'group' && (
                <button
                  onClick={() => {
                    createGroup();
                    setShowCreateModal(false);
                    setCreateMode(null);
                  }}
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
      )}
    </div>
  );
};

export default UnifiedChat;
