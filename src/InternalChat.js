import React, { useState, useEffect, useRef } from 'react';
import { authenticatedFetch } from './utils/auth';

const InternalChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const currentUsername = localStorage.getItem('username');
  const currentUserRole = localStorage.getItem('userRole');

  // Função para rolar para o final das mensagens
  const scrollToBottom = () => {
    console.log('scrollToBottom chamada');
    
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      console.log('Container encontrado, scrollHeight:', container.scrollHeight);
      
      // Aguardar um momento para garantir que o DOM foi atualizado
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
        console.log('Scroll aplicado para:', container.scrollHeight);
      }, 50);
    }
  };

  // Função para verificar se está no final da conversa
  const checkIfAtBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px de tolerância
      setShowScrollButton(!isAtBottom && messages.length > 0);
    }
  };

  // Função para lidar com o scroll
  const handleScroll = () => {
    checkIfAtBottom();
  };

  // Carregar mensagens
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/internal-chat/messages');
      const data = await response.json();
      
      if (response.ok) {
        // Verificar se há novas mensagens de outros usuários
        const newMessagesFromOthers = data.filter(msg => {
          const isFromOther = msg.username !== currentUsername;
          const isRecent = new Date(msg.timestamp) > new Date(Date.now() - 10000); // Últimos 10 segundos
          return isFromOther && isRecent;
        });
        
        // Se há mensagens anteriores, verificar se há novas
        if (messages.length > 0 && newMessagesFromOthers.length > 0) {
          const previousMessageIds = messages.map(m => m.id);
          const reallyNewMessages = newMessagesFromOthers.filter(msg => !previousMessageIds.includes(msg.id));
          
          if (reallyNewMessages.length > 0) {
            console.log('🔔 Novas mensagens detectadas:', reallyNewMessages.length);
          }
        }
        
        // Ordenar mensagens por timestamp (mais antigas primeiro)
        const sortedMessages = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setMessages(sortedMessages);
        
        // Atualização simplificada sem notificationService
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
    
    if (!newMessage.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      const response = await authenticatedFetch('http://localhost:8000/internal-chat/messages', {
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

  // Lidar com teclas pressionadas no input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Limpar chat (apenas admin)
  const clearChat = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todo o histórico do chat?')) {
      return;
    }

    try {
      const response = await authenticatedFetch('http://localhost:8000/internal-chat/messages', {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages([]);
        alert('Chat limpo com sucesso!');
      } else {
        const data = await response.json();
        alert('Erro ao limpar chat: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao limpar chat:', error);
      alert('Erro ao limpar chat');
    }
  };

  // Carregar mensagens ao montar o componente
  useEffect(() => {
    fetchMessages();
    
    // Marcar timestamp da última leitura e limpar notificações
    const conversationId = 'internal_chat_group';
    setLastReadTimestamp(Date.now());
    // Atualizar mensagens a cada 2 segundos para ser mais responsivo
    const interval = setInterval(fetchMessages, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Rolar para o final quando novas mensagens chegarem E atualizar timestamp de leitura
  useEffect(() => {
    scrollToBottom();
    // Atualizar timestamp da última leitura quando há novas mensagens
    if (messages.length > 0) {
      setLastReadTimestamp(Date.now());
    }
    // Verificar se precisa mostrar o botão de scroll após um pequeno delay
    setTimeout(checkIfAtBottom, 100);
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
    
    // Primeiro, ordenar todas as mensagens por timestamp
    const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    sortedMessages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div style={{ padding: '30px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* CSS para animação de mensagens novas */}
      <style>
        {`
          @keyframes fadeInGlow {
            0% { 
              opacity: 0;
              transform: translateY(20px);
              box-shadow: 0 0 0 rgba(255, 193, 7, 0);
            }
            50% {
              opacity: 1;
              transform: translateY(0);
              box-shadow: 0 0 20px rgba(255, 193, 7, 0.6);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
              box-shadow: 0 2px 8px rgba(255, 193, 7, 0.4);
            }
          }
          
          @keyframes bounceIn {
            0% { 
              opacity: 0;
              transform: scale(0.3) translateY(100px);
            }
            50% {
              opacity: 1;
              transform: scale(1.05) translateY(0);
            }
            70% {
              transform: scale(0.9) translateY(0);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          .scroll-button {
            animation: bounceIn 0.6s ease-out;
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          � Chat do Grupo
        </h1>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchMessages}
            disabled={loading}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            {loading ? '🔄 Atualizando...' : '🔄 Atualizar'}
          </button>
          
          {currentUserRole === 'admin' && (
            <button
              onClick={clearChat}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                padding: '8px 15px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🗑️ Limpar Chat
            </button>
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ecf0f1',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Lista de mensagens */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            overflowX: 'hidden',
            maxHeight: 'calc(100vh - 250px)',
            position: 'relative',
            scrollBehavior: 'smooth'
          }}
        >
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
                  // Mensagem é não lida se for de outro usuário e posterior ao último timestamp de leitura
                  const isUnreadMessage = !isOwnMessage && lastReadTimestamp && new Date(message.timestamp) > new Date(lastReadTimestamp - 5000);
                  // Mensagem é muito recente (últimos 30 segundos)
                  const isVeryRecentMessage = new Date(message.timestamp) > new Date(Date.now() - 30000);
                  
                  const shouldHighlight = isUnreadMessage || (isVeryRecentMessage && !isOwnMessage);
                  
                  return (
                    <div
                      key={message.id}
                      data-message-id={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        marginBottom: '15px',
                        animation: shouldHighlight ? 'fadeInGlow 1s ease-in-out' : 'none'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        backgroundColor: isOwnMessage 
                          ? '#3498db' 
                          : shouldHighlight 
                            ? '#fff3cd'  // Amarelo claro para não lidas
                            : '#f8f9fa',
                        color: isOwnMessage ? 'white' : '#2c3e50',
                        padding: '12px 15px',
                        borderRadius: '15px',
                        borderBottomRightRadius: isOwnMessage ? '5px' : '15px',
                        borderBottomLeftRadius: isOwnMessage ? '15px' : '5px',
                        boxShadow: shouldHighlight 
                          ? '0 2px 8px rgba(255, 193, 7, 0.4)' 
                          : '0 1px 2px rgba(0,0,0,0.1)',
                        border: shouldHighlight 
                          ? '2px solid #ffc107' 
                          : 'none'
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
                            {shouldHighlight && ' 🆕'}
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
          <div 
            ref={messagesEndRef} 
            style={{ 
              height: '20px', 
              backgroundColor: 'red',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'white',
              fontWeight: 'bold',
              margin: '10px 0'
            }}
          >
            🔴 FIM DAS MENSAGENS 🔴
          </div>
          
          {/* Botão para rolar para baixo */}
          {showScrollButton && (
            <button
              onClick={() => {
                console.log('=== BOTÃO CLICADO ===');
                
                // Abordagem mais agressiva - encontrar o último elemento de mensagem
                const allMessages = document.querySelectorAll('[data-message-id]');
                const lastMessage = allMessages[allMessages.length - 1];
                
                if (lastMessage) {
                  console.log('Último elemento de mensagem encontrado, fazendo scroll...');
                  lastMessage.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end',
                    inline: 'nearest' 
                  });
                } else if (messagesEndRef.current) {
                  console.log('Usando messagesEndRef...');
                  messagesEndRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'end' 
                  });
                } else if (messagesContainerRef.current) {
                  console.log('Usando scroll direto no container...');
                  const container = messagesContainerRef.current;
                  container.scrollTop = container.scrollHeight - container.clientHeight;
                } else {
                  console.log('Nenhum método funcionou!');
                }
                
                // Forçar atualização do estado do botão
                setTimeout(() => {
                  checkIfAtBottom();
                }, 500);
              }}
              className="scroll-button"
              style={{
                position: 'absolute',
                bottom: '30px',
                right: '30px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                cursor: 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'all 0.3s ease',
                opacity: 0.9
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '0.9';
                e.target.style.transform = 'scale(1)';
              }}
              title="Ir para as mensagens mais recentes"
            >
              ⬇️
            </button>
          )}
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
      </div>
    </div>
  );
};

export default InternalChat;
