import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatArea from './ChatArea';
import CreateModal from './CreateModal';
import GroupInfoModal from './GroupInfoModal';
import { useChat } from '../../hooks/useChat';

const UnifiedChat = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [selectedGroupForInfo, setSelectedGroupForInfo] = useState(null);

  const {
    activeChat,
    chatType,
    groups,
    conversations,
    messages,
    newMessage,
    loading,
    sending,
    availableUsers,
    groupMembers,
    currentUser,
    setNewMessage,
    selectChat,
    sendMessage,
    createGroup,
    deleteGroup,
    startPrivateChat,
    fetchGroupMembers
  } = useChat();

  // Abrir informações do grupo
  const openGroupInfo = (group) => {
    setSelectedGroupForInfo(group);
    setShowGroupInfo(true);
    fetchGroupMembers(group);
  };

  // Fechar modal de informações do grupo
  const closeGroupInfo = () => {
    setShowGroupInfo(false);
    setSelectedGroupForInfo(null);
  };

  return (
    <div style={{ 
      height: '100%', 
      width: '100%',
      display: 'flex',
      overflow: 'hidden',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
      maxWidth: '100%',
      maxHeight: '100%'
    }}>
      {/* Lista de conversas (grupos + privadas) */}
      <ChatList
        groups={groups}
        conversations={conversations}
        activeChat={activeChat}
        chatType={chatType}
        onSelectChat={selectChat}
        onCreateNew={() => setShowCreateModal(true)}
        onOpenGroupInfo={openGroupInfo}
        onDeleteGroup={deleteGroup}
        currentUsername={currentUser.username}
        currentUserRole={currentUser.role}
      />

      {/* Área do chat */}
      <ChatArea
        activeChat={activeChat}
        chatType={chatType}
        messages={messages}
        loading={loading}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sending={sending}
        onSendMessage={sendMessage}
        onOpenGroupInfo={openGroupInfo}
        groupMembers={groupMembers}
        currentUsername={currentUser.username}
      />

      {/* Modal para criar grupo ou iniciar conversa */}
      <CreateModal
        showModal={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={createGroup}
        onStartPrivateChat={startPrivateChat}
        availableUsers={availableUsers}
        conversations={conversations}
        currentUsername={currentUser.username}
      />

      {/* Modal para informações do grupo */}
      <GroupInfoModal
        show={showGroupInfo}
        group={selectedGroupForInfo}
        groupMembers={groupMembers}
        availableUsers={availableUsers}
        currentUsername={currentUser.username}
        currentUserRole={currentUser.role}
        onClose={closeGroupInfo}
        onRefreshMembers={() => fetchGroupMembers(selectedGroupForInfo)}
      />
    </div>
  );
};

export default UnifiedChat;
