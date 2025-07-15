import React, { useState, useEffect, useRef } from 'react';
import { authenticatedFetch } from '../../utils/auth';

const PrivateChat = () => {
  const [conversations, setConversations] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUsername = localStorage.getItem('username');

  // Função para rolar para o final das mensagens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar conversas existentes
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

  // Carregar usuários disponíveis
  const fetchAvailableUsers = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/private-chat/users');
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

  // Carregar mensagens de uma conversa específica
  const fetchMessages = async (targetUsername) => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(`http://localhost:8000/private-chat/messages/${targetUsername}`);
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
    
    if (!newMessage.trim() || sending || !selectedConversation) {
      return;
    }

    try {
      setSending(true);
      const response = await authenticatedFetch(`http://localhost:8000/private-chat/messages/${selectedConversation.otherUser.username}`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        fetchConversations(); // Atualizar lista de conversas
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

  // Selecionar conversa
  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.otherUser.username);
  };

  // Iniciar nova conversa
  const startNewConversation = (user) => {
    const newConversation = {
      chatKey: [currentUsername, user.username].sort().join('-'),
      otherUser: user,
      lastMessage: null,
      messageCount: 0,
      updatedAt: new Date()
    };
    
    setSelectedConversation(newConversation);
    setMessages([]);
    setShowNewChatModal(false);
  };

  // Lidar com teclas pressionadas
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();
    
    // Atualizar conversas a cada 5 segundos
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConversation) {
        fetchMessages(selectedConversation.otherUser.username);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Atualizar mensagens quando conversa selecionada mudar
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.otherUser.username);
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

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
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  return (
    <div style={{ padding: '30px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          💬 Mensagens Privadas
        </h1>
        
        <button
          onClick={() => setShowNewChatModal(true)}
          style={{
            backgroundColor: '#27ae60',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Nova Conversa
        </button>
      </div>

      {/* Layout principal */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '20px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ecf0f1',
        overflow: 'hidden'
      }}>
        {/* Lista de conversas */}
        <div style={{
          width: '350px',
          borderRight: '1px solid #ecf0f1',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #ecf0f1',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>Conversas</h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#95a5a6' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                <p>Nenhuma conversa ainda</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Iniciar conversa
                </button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.chatKey}
                  onClick={() => selectConversation(conversation)}
                  style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: selectedConversation?.chatKey === conversation.chatKey ? '#e3f2fd' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.chatKey !== conversation.chatKey) {
                      e.target.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.chatKey !== conversation.chatKey) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{
                      fontSize: '20px',
                      marginRight: '10px'
                    }}>
                      {conversation.otherUser.role === 'admin' ? '🔑' : '👤'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {conversation.otherUser.username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {conversation.otherUser.department}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: '#95a5a6' }}>
                      {conversation.lastMessage ? formatDate(conversation.lastMessage.timestamp) : ''}
                    </div>
                  </div>
                  
                  {conversation.lastMessage && (
                    <div style={{
                      fontSize: '13px',
                      color: '#7f8c8d',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conversation.lastMessage.fromUsername === currentUsername ? 'Você: ' : ''}
                      {conversation.lastMessage.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Área de mensagens */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Header da conversa */}
              <div style={{
                padding: '20px',
                borderBottom: '1px solid #ecf0f1',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>
                  {selectedConversation.otherUser.role === 'admin' ? '🔑' : '👤'}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {selectedConversation.otherUser.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    {selectedConversation.otherUser.department} • {selectedConversation.otherUser.role === 'admin' ? 'Administrador' : 'Usuário'}
                  </div>
                </div>
              </div>

              {/* Mensagens */}
              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: '#fafafa'
              }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                    <p>Carregando mensagens...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                    <p>Nenhuma mensagem ainda. Envie a primeira!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.fromUsername === currentUsername;
                    
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
                          backgroundColor: isOwnMessage ? '#3498db' : 'white',
                          color: isOwnMessage ? 'white' : '#2c3e50',
                          padding: '12px 15px',
                          borderRadius: '15px',
                          borderBottomRightRadius: isOwnMessage ? '5px' : '15px',
                          borderBottomLeftRadius: isOwnMessage ? '15px' : '5px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
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
                  })
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Formulário de envio */}
              <form
                onSubmit={sendMessage}
                style={{
                  padding: '20px',
                  borderTop: '1px solid #ecf0f1',
                  backgroundColor: 'white'
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
                      outline: 'none'
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
                    {sending ? '⏳' : '📤'}
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
              backgroundColor: '#fafafa'
            }}>
              <div style={{ textAlign: 'center', color: '#95a5a6' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
                <h3>Selecione uma conversa</h3>
                <p>Escolha uma conversa da lista ou inicie uma nova</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para nova conversa */}
      {showNewChatModal && (
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
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
              Nova Conversa
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Selecione um usuário para conversar:
              </label>
              
              {availableUsers.length === 0 ? (
                <p style={{ color: '#95a5a6' }}>Nenhum usuário disponível</p>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {availableUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => startNewConversation(user)}
                      style={{
                        padding: '12px',
                        border: '1px solid #ecf0f1',
                        borderRadius: '5px',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      <span style={{ fontSize: '20px', marginRight: '10px' }}>
                        {user.role === 'admin' ? '🔑' : '👤'}
                      </span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{user.username}</div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                          {user.department} • {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewChatModal(false)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateChat;
