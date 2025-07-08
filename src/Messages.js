import React, { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from './utils/auth';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Buscar conversas
  const fetchConversations = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    }
  };

  // Buscar mensagens de uma conversa
  const fetchMessages = useCallback(async (contactId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await authenticatedFetch(`http://localhost:8000/conversations/${contactId}/messages`);
      const data = await response.json();
      
      if (response.ok) {
        // Verificar se há novas mensagens antes de atualizar
        const currentMessageCount = messages.length;
        const newMessageCount = data.messages.length;
        
        setMessages(data.messages);
        setSelectedConversation(data.conversation);
        
        // Log para debug
        if (silent && newMessageCount > currentMessageCount) {
          console.log(`Nova mensagem detectada: ${newMessageCount - currentMessageCount} mensagens`);
        }
        
        // Atualizar também a conversa na lista se necessário
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === contactId ? { ...conv, unread: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [messages.length]); // Adicionar dependência

  // Enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await authenticatedFetch(`http://localhost:8000/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        // Recarregar mensagens
        fetchMessages(selectedConversation.id);
        // Recarregar lista de conversas
        fetchConversations();
      } else {
        const error = await response.json();
        alert('Erro ao enviar mensagem: ' + error.error);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    }
  };

  useEffect(() => {
    fetchConversations();
    // Atualizar conversas a cada 3 segundos
    const conversationsInterval = setInterval(fetchConversations, 3000);
    return () => clearInterval(conversationsInterval);
  }, []);

  // Atualizar mensagens da conversa selecionada automaticamente
  useEffect(() => {
    let messagesInterval;
    
    if (selectedConversation) {
      console.log('Iniciando atualização automática para conversa:', selectedConversation.id);
      
      // Atualizar mensagens da conversa selecionada a cada 2 segundos (silencioso)
      messagesInterval = setInterval(() => {
        console.log('Atualizando mensagens automaticamente...');
        fetchMessages(selectedConversation.id, true); // true = silent mode
      }, 2000);
    }
    
    return () => {
      if (messagesInterval) {
        console.log('Parando atualização automática');
        clearInterval(messagesInterval);
      }
    };
  }, [selectedConversation, fetchMessages]); // Incluir selectedConversation completo

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ 
      padding: '0',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 30px',
        backgroundColor: 'white',
        borderBottom: '1px solid #ecf0f1',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          📝 Central de Mensagens WhatsApp
        </h1>
      </div>

      <div style={{ 
        display: 'flex', 
        flex: 1,
        height: 'calc(100vh - 100px)'
      }}>
        {/* Lista de Conversas */}
        <div style={{
          width: '350px',
          backgroundColor: 'white',
          borderRight: '1px solid #ecf0f1',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '15px',
            borderBottom: '1px solid #ecf0f1',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
              Conversas ({conversations.length})
            </h3>
          </div>

          {conversations.length === 0 ? (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              color: '#95a5a6'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
              <p>Nenhuma conversa ainda</p>
              <p style={{ fontSize: '14px' }}>
                As conversas aparecerão aqui quando alguém enviar uma mensagem
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => fetchMessages(conversation.id)}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #ecf0f1',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?.id === conversation.id ? '#e3f2fd' : 'white',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation?.id !== conversation.id) {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?.id !== conversation.id) {
                    e.target.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: '#3498db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    {conversation.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#2c3e50',
                        fontWeight: conversation.unread > 0 ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conversation.name}
                      </h4>
                      <span style={{
                        fontSize: '12px',
                        color: '#95a5a6'
                      }}>
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#7f8c8d',
                        fontWeight: conversation.unread > 0 ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}>
                        {conversation.lastMessage}
                      </p>
                      
                      {conversation.unread > 0 && (
                        <span style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Área de Chat */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f5f5f5'
        }}>
          {selectedConversation ? (
            <>
              {/* Header do Chat */}
              <div style={{
                padding: '15px 20px',
                backgroundColor: 'white',
                borderBottom: '1px solid #ecf0f1',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#3498db',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {selectedConversation.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: '#2c3e50' }}>
                    {selectedConversation.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#95a5a6' }}>
                    {selectedConversation.contact}
                  </p>
                </div>
              </div>

              {/* Mensagens */}
              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#95a5a6' }}>
                    Carregando mensagens...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#95a5a6' }}>
                    Nenhuma mensagem ainda
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: message.from === 'me' || message.from === 'bot' ? 'flex-end' : 'flex-start',
                        maxWidth: '70%'
                      }}
                    >
                      <div style={{
                        padding: '10px 15px',
                        borderRadius: '18px',
                        backgroundColor: message.from === 'me' || message.from === 'bot' ? '#3498db' : 'white',
                        color: message.from === 'me' || message.from === 'bot' ? 'white' : '#2c3e50',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        wordWrap: 'break-word'
                      }}>
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                          {message.body}
                        </p>
                        <div style={{
                          fontSize: '11px',
                          opacity: 0.7,
                          marginTop: '5px',
                          textAlign: 'right'
                        }}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input de Nova Mensagem */}
              <div style={{
                padding: '15px 20px',
                backgroundColor: 'white',
                borderTop: '1px solid #ecf0f1',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1,
                    padding: '12px 15px',
                    border: '1px solid #ddd',
                    borderRadius: '25px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: newMessage.trim() ? '#3498db' : '#bdc3c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#95a5a6'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <h3>Selecione uma conversa</h3>
              <p>Escolha uma conversa da lista para ver as mensagens</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
