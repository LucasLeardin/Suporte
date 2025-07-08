import React from 'react';

const ChatList = ({ 
  groups, 
  conversations, 
  activeChat, 
  chatType, 
  onSelectChat, 
  currentUsername,
  onOpenCreateModal 
}) => {
  const handleChatSelect = (chat, type) => {
    onSelectChat(chat, type);
  };

  const isActiveChat = (chat, type) => {
    if (!activeChat) return false;
    
    if (type === 'group') {
      return chatType === 'group' && activeChat.id === chat.id;
    } else {
      const chatUsername = chat.username || chat.otherUser?.username || chat.otherUser;
      const activeChatUsername = activeChat.username || activeChat;
      return chatType === 'private' && activeChatUsername === chatUsername;
    }
  };

  return (
    <div style={{
      width: '300px',
      backgroundColor: '#f8f9fa',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: '#495057', fontSize: '18px' }}>
          Conversas
        </h3>
        <button
          onClick={onOpenCreateModal}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          title="Criar novo grupo"
        >
          + Novo
        </button>
      </div>

      {/* Lista de Chats */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Grupos */}
        {groups && groups.length > 0 && (
          <div>
            <div style={{
              padding: '10px 20px',
              backgroundColor: '#e9ecef',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#6c757d',
              textTransform: 'uppercase'
            }}>
              Grupos ({groups.length})
            </div>
            {groups.map(group => (
              <div
                key={group.id}
                onClick={() => handleChatSelect(group, 'group')}
                style={{
                  padding: '15px 20px',
                  borderBottom: '1px solid #f1f3f4',
                  cursor: 'pointer',
                  backgroundColor: isActiveChat(group, 'group') ? '#e3f2fd' : 'white',
                  borderLeft: isActiveChat(group, 'group') ? '4px solid #2196f3' : '4px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActiveChat(group, 'group')) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveChat(group, 'group')) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>
                    {group.type === 'general' ? '🌐' : 
                     group.type === 'department' ? '🏢' : '👥'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: isActiveChat(group, 'group') ? 'bold' : '500',
                      color: '#212529',
                      fontSize: '14px',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {group.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6c757d',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {group.description || 'Chat do grupo'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversas Privadas */}
        {conversations && conversations.length > 0 && (
          <div>
            <div style={{
              padding: '10px 20px',
              backgroundColor: '#e9ecef',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#6c757d',
              textTransform: 'uppercase'
            }}>
              Conversas Privadas ({conversations.length})
            </div>
            {conversations.map((conversation, index) => {
              const otherUser = conversation.otherUser || conversation;
              const displayName = otherUser.username || otherUser;
              const role = otherUser.role || 'user';
              const department = otherUser.department || 'N/A';

              return (
                <div
                  key={`conversation-${index}-${displayName}`}
                  onClick={() => handleChatSelect(otherUser, 'private')}
                  style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #f1f3f4',
                    cursor: 'pointer',
                    backgroundColor: isActiveChat(otherUser, 'private') ? '#fff3e0' : 'white',
                    borderLeft: isActiveChat(otherUser, 'private') ? '4px solid #ff9800' : '4px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActiveChat(otherUser, 'private')) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveChat(otherUser, 'private')) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      fontSize: '24px',
                      backgroundColor: role === 'admin' ? '#ff5722' : '#4caf50',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {role === 'admin' ? '🔑' : '👤'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: isActiveChat(otherUser, 'private') ? 'bold' : '500',
                        color: '#212529',
                        fontSize: '14px',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {displayName}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {role === 'admin' ? 'Administrador' : 'Usuário'} • {department}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mensagem quando não há conversas */}
        {(!groups || groups.length === 0) && (!conversations || conversations.length === 0) && (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#495057' }}>Nenhuma conversa</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Clique em "+ Novo" para criar um grupo ou aguarde alguém iniciar uma conversa com você.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
