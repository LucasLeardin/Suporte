import React, { useRef, useEffect, useState } from 'react';

const ChatArea = ({ 
  activeChat, 
  chatType, 
  messages, 
  loading, 
  newMessage, 
  setNewMessage,
  sending,
  onSendMessage,
  onOpenGroupInfo,
  groupMembers,
  currentUsername 
}) => {
  const messagesEndRef = useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = (force = false) => {
    // Apenas fazer scroll se explicitamente forçado (troca de chat)
    if (!force) {
      console.log('📜 [SCROLL] Scroll não forçado, ignorando');
      return;
    }

    console.log('📜 [SCROLL] Scroll inicial para novo chat');
    
    const container = document.getElementById('messages-container');
    if (!container) {
      console.log('📜 [SCROLL] ❌ Container não encontrado');
      return;
    }
    
    // Aguardar DOM estar pronto
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        if (container.scrollHeight <= container.clientHeight) {
          console.log('📜 [SCROLL] ⚠️ Container sem conteúdo suficiente para scroll');
          return;
        }
        
        // Scroll direto para o final
        container.scrollTop = maxScroll;
        console.log('📜 [SCROLL] Scroll inicial executado');
      });
    });
  };

  // Remover scroll automático - apenas scroll manual via botão
  // useEffect removido para evitar scroll automático indesejado

  // Scroll inicial apenas quando trocar de chat (primeira vez)
  useEffect(() => {
    if (activeChat) {
      console.log('🔄 [CHAT] Novo chat aberto, fazendo scroll inicial...');
      // Scroll inicial apenas quando muda de chat
      setTimeout(() => scrollToBottom(true), 300);
    }
  }, [activeChat]); // Apenas quando activeChat mudar

  // Atualizar timestamp quando usuário foca na janela ou seleciona o chat
  useEffect(() => {
    if (activeChat && messages && messages.length > 0) {
      let conversationId;
      if (chatType === 'group') {
        conversationId = `group_${activeChat.id}`;
      } else {
        const username = activeChat.username || activeChat;
        conversationId = `private_${username}`;
      }
      
      // Marcar como lido (simplificado sem notificationService)
      console.log(`📖 Chat ${conversationId} aberto`);
    }
  }, [activeChat, chatType, currentUsername, messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Data inválida';
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      // Verificar se a mensagem tem timestamp válido
      if (!message || !message.timestamp) {
        console.warn('Mensagem sem timestamp:', message);
        return; // Pular esta mensagem
      }
      
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const getGroupIcon = (group) => {
    switch (group.type) {
      case 'general': return '🌐';
      case 'department': return '🏢';
      case 'custom': return '👥';
      default: return '💬';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e);
    }
  };

  const messageGroups = groupMessagesByDate(messages || []);

  // Verificar se o usuário está no final do chat
  const checkScrollPosition = () => {
    const container = document.getElementById('messages-container');
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px de tolerância
    
    setShowScrollToBottom(!isNearBottom);
  };

  // Handler para o scroll do usuário
  const handleScroll = () => {
    checkScrollPosition();
  };

  // Função para rolar para baixo quando o botão for clicado
  const scrollToBottomSmooth = () => {
    const container = document.getElementById('messages-container');
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
    
    setShowScrollToBottom(false);
  };

  if (!activeChat) {
    return (
      <div style={{
        flex: 1,
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6c757d',
        overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>💬</div>
          <h3 style={{ color: '#495057', marginBottom: '10px' }}>Chat Interno</h3>
          <p style={{ fontSize: '16px', color: '#6c757d' }}>
            Selecione um grupo ou conversa privada para começar a conversar
          </p>
          <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.7 }}>
            <p>• Clique em um grupo para participar da conversa</p>
            <p>• Inicie uma conversa privada com outros usuários</p>
            <p>• Use o botão "+ Novo" para criar grupos</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      border: 'none',
      maxWidth: '100%',
      boxSizing: 'border-box',
      position: 'relative' // Para posicionamento correto do botão
    }}>
      {/* CSS para animação de mensagens novas */}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          #messages-container {
            scroll-behavior: smooth;
          }
          
          @keyframes fadeInGlow {
            0% { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
              box-shadow: 0 0 0 rgba(255, 152, 0, 0);
            }
            25% {
              opacity: 0.7;
              transform: translateY(10px) scale(0.98);
              box-shadow: 0 0 30px rgba(255, 152, 0, 0.8);
            }
            50% {
              opacity: 1;
              transform: translateY(0) scale(1.05);
              box-shadow: 0 0 40px rgba(255, 152, 0, 1);
            }
            75% {
              opacity: 1;
              transform: translateY(0) scale(1.02);
              box-shadow: 0 4px 20px rgba(255, 152, 0, 0.7);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1.02);
              box-shadow: 0 4px 12px rgba(255, 235, 59, 0.6), 0 0 0 2px #ffc107;
            }
          }
          
          @keyframes fadeIn {
            0% {
              opacity: 0;
              transform: translateY(20px) scale(0.8);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>
      {/* Header do chat */}
      <div style={{
        padding: '15px 20px', // Padding reduzido
        borderBottom: '1px solid #ecf0f1',
        backgroundColor: '#f8f9fa',
        flexShrink: 0, // Não encolher
        boxSizing: 'border-box',
        maxWidth: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '22px' }}> {/* Tamanho reduzido */}
              {chatType === 'group' ? getGroupIcon(activeChat) : '👤'}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> {/* Tamanho reduzido */}
                {chatType === 'group' ? activeChat.name : (activeChat.username || activeChat)}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#7f8c8d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> {/* Tamanho reduzido */}
                {chatType === 'group' 
                  ? `${activeChat.description || 'Chat do grupo'} • ${groupMembers.length} ${groupMembers.length === 1 ? 'membro' : 'membros'}`
                  : `Chat privado • ${activeChat.role || 'user'}`
                }
              </p>
            </div>
          </div>
          
          {chatType === 'group' && (
            <button
              onClick={() => onOpenGroupInfo(activeChat)}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '12px',
                flexShrink: 0,
                boxSizing: 'border-box'
              }}
              title="Informações do grupo"
            >
              ℹ️ Info
            </button>
          )}
        </div>
      </div>

      {/* Mensagens */}
      <div 
        style={{
          flex: 1,
          padding: '10px 15px',
          paddingRight: '2px',
          overflowY: 'scroll',
          overflowX: 'hidden',
          maxWidth: '100%',
          minHeight: 0,
          boxSizing: 'border-box',
          backgroundColor: '#ffffff'
        }}
        id="messages-container"
        onScroll={handleScroll}
      >
        {loading && (!messages || messages.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#95a5a6' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
            <p>Carregando mensagens...</p>
          </div>
        ) : (!messages || messages.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#95a5a6' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
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
                
                // Lógica simplificada para destaque de mensagens
                let isUnreadMessage = false;
                let isVeryRecentMessage = false;
                
                if (!isOwnMessage) {
                  // Verificar se a mensagem é muito recente (últimos 5 minutos)
                  isVeryRecentMessage = new Date(message.timestamp) > new Date(Date.now() - 300000);
                  
                  // Simplificado: destacar mensagens recentes
                  isUnreadMessage = isVeryRecentMessage;
                }
                
                const shouldHighlight = isUnreadMessage || isVeryRecentMessage;
                
                console.log(`Mensagem ${message.id}:`, {
                  isOwnMessage,
                  isUnreadMessage,
                  isVeryRecentMessage,
                  shouldHighlight,
                  messageTime: new Date(message.timestamp).toLocaleTimeString(),
                  lastRead: 'nunca'
                });
                
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      marginBottom: '15px',
                      maxWidth: '100%',
                      animation: shouldHighlight ? 'fadeInGlow 1s ease-in-out' : 'none'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      backgroundColor: isOwnMessage 
                        ? '#3498db' 
                        : shouldHighlight 
                          ? '#ffeb3b'  // Amarelo mais vibrante para melhor visibilidade
                          : '#f8f9fa',
                      color: isOwnMessage ? 'white' : shouldHighlight ? '#1a1a1a' : '#2c3e50',
                      padding: '12px 15px',
                      borderRadius: '15px',
                      borderBottomRightRadius: isOwnMessage ? '5px' : '15px',
                      borderBottomLeftRadius: isOwnMessage ? '15px' : '5px',
                      boxShadow: shouldHighlight 
                        ? '0 4px 12px rgba(255, 235, 59, 0.6), 0 0 0 2px #ffc107' 
                        : '0 1px 2px rgba(0,0,0,0.1)',
                      border: shouldHighlight 
                        ? '2px solid #ff9800' 
                        : 'none',
                      boxSizing: 'border-box',
                      overflowWrap: 'break-word',
                      wordWrap: 'break-word',
                      transform: shouldHighlight ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.3s ease'
                    }}>
                      {!isOwnMessage && shouldHighlight && (
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '8px',
                          color: '#ff6f00',
                          backgroundColor: '#fff8e1',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          textAlign: 'center',
                          border: '1px solid #ffb74d'
                        }}>
                          ⭐ MENSAGEM RECENTE/NÃO LIDA ⭐
                        </div>
                      )}
                      
                      {!isOwnMessage && chatType === 'group' && (
                        <div style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          marginBottom: '5px',
                          color: messageUserRole === 'admin' ? '#e74c3c' : '#27ae60'
                        }}>
                          {messageUserRole === 'admin' ? '🔑' : '👤'} {messageUsername}
                          {messageDepartment && ` • ${messageDepartment}`}
                          {shouldHighlight && ' 🆕'}
                        </div>
                      )}
                      
                      {!isOwnMessage && chatType === 'private' && shouldHighlight && (
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          marginBottom: '5px',
                          color: '#ff6f00'
                        }}>
                          🆕 Nova mensagem não lida
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
        onSubmit={onSendMessage}
        style={{
          padding: '15px 20px', // Padding reduzido
          borderTop: '1px solid #ecf0f1',
          backgroundColor: '#f8f9fa',
          flexShrink: 0, // Não encolher
          boxSizing: 'border-box',
          maxWidth: '100%'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', maxWidth: '100%' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            disabled={sending}
            style={{
              flex: 1,
              padding: '10px 15px', // Padding reduzido
              border: '1px solid #ddd',
              borderRadius: '25px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            style={{
              backgroundColor: sending ? '#95a5a6' : '#3498db',
              color: 'white',
              padding: '10px 18px', // Padding reduzido
              border: 'none',
              borderRadius: '25px',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              minWidth: '75px',
              maxWidth: '100px',
              boxSizing: 'border-box'
            }}
          >
            {sending ? '⏳' : '📤 Enviar'}
          </button>
        </div>
      </form>

      {/* Observer para detectar mudanças no conteúdo e forçar scroll */}
      <div style={{ display: 'none' }}>
        <div id="observer-target" ref={messagesEndRef} />
      </div>

      {/* Botão flutuante para voltar ao final */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottomSmooth}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#4fc3f7'; // Azul hover igual ao scroll
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 8px 20px rgba(79, 195, 247, 0.5)';
            e.target.style.opacity = '1'; // Opacidade total no hover
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#87ceeb'; // Volta para azul claro
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 6px 16px rgba(135, 206, 235, 0.4)';
            e.target.style.opacity = '0.7'; // Volta para 70% de transparência
          }}
          style={{
            position: 'absolute',
            bottom: '90px',
            left: '50%',
            marginLeft: '-27.5px', // Metade da largura (55px / 2) para centralizar
            width: '55px',
            height: '55px',
            borderRadius: '50%',
            backgroundColor: '#87ceeb', // Mesma cor azul claro da barra de scroll
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(135, 206, 235, 0.4)', // Sombra azul suave
            zIndex: 1000,
            transition: 'all 0.3s ease',
            animation: 'fadeInUp 0.3s ease-out',
            transform: 'scale(1)', // Garantir estado inicial
            opacity: '0.7' // 70% de transparência
          }}
          title="Ir para o final da conversa"
        >
          ⬇️
        </button>
      )}
      
      {/* Script removido para evitar scroll automático indesejado */}
    </div>
  );
};

export default ChatArea;
