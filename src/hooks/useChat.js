import { useState, useEffect, useCallback } from 'react';
import { groupService, privatechatService, userService } from '../services/chatService';
import { getCurrentUser } from '../services/authService';

export const useChat = () => {
  const [activeChat, setActiveChat] = useState(null);
  const [chatType, setChatType] = useState('group');
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);

  const currentUser = getCurrentUser();

  // Carregar grupos disponíveis
  const fetchGroups = useCallback(async () => {
    try {
      const data = await groupService.fetchGroups();
      setGroups(data);
      
      // NÃO selecionar automaticamente nenhum chat - deixar para o usuário escolher
      // Comentado: Se não há chat ativo, selecionar o primeiro grupo
      // if (!activeChat && data.length > 0) {
      //   setActiveChat(data[0]);
      //   setChatType('group');
      // }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  }, []);

  // Carregar conversas privadas
  const fetchConversations = async () => {
    try {
      const data = await privatechatService.fetchConversations();
      setConversations(data);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  // Carregar usuários disponíveis
  const fetchAvailableUsers = async () => {
    try {
      const data = await userService.fetchAvailableUsers();
      setAvailableUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  // Carregar mensagens do chat ativo
  const fetchMessages = useCallback(async () => {
    if (!activeChat) return;
    
    try {
      setLoading(true);
      let data;
      let conversationId;
      
      console.log('Buscando mensagens para:', activeChat, 'tipo:', chatType);
      
      if (chatType === 'group') {
        console.log('Buscando mensagens do grupo:', activeChat.id);
        data = await groupService.fetchGroupMessages(activeChat.id);
        conversationId = `group_${activeChat.id}`;
      } else {
        // Para conversas privadas, activeChat pode ser um objeto com username ou uma string
        const targetUsername = activeChat.username || activeChat;
        console.log('Buscando mensagens privadas para:', targetUsername);
        data = await privatechatService.fetchPrivateMessages(targetUsername);
        conversationId = `private_${targetUsername}`;
      }
      
      console.log('Mensagens recebidas:', data);
      
      // Garantir que data seja um array e que todas as mensagens tenham timestamp
      const validMessages = Array.isArray(data) ? data.filter(msg => msg && msg.timestamp) : [];
      console.log('Mensagens válidas:', validMessages);
      
      // Verificar se há novas mensagens (simplificado)
      const previousMessageCount = messages.length;
      if (previousMessageCount > 0 && validMessages.length > previousMessageCount) {
        console.log('📋 Mensagens novas detectadas:', validMessages.length - previousMessageCount);
      }
      
      console.log(`📊 Atualizando mensagens: ${previousMessageCount} → ${validMessages.length}`);
      
      setMessages(validMessages);
      
      // Scroll após definir mensagens se há mensagens
      if (validMessages.length > 0) {
        setTimeout(() => {
          const container = document.getElementById('messages-container');
          if (container && container.scrollHeight > container.clientHeight) {
            container.scrollTop = container.scrollHeight;
            console.log('📜 [HOOK] Scroll pós-carregamento executado');
          }
        }, 400);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]); // Definir como array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  }, [activeChat, chatType, currentUser.username]); // Remover messages.length da dependência

  // Buscar membros de um grupo
  const fetchGroupMembers = async (group) => {
    if (!group) return;
    
    try {
      const data = await groupService.fetchGroupMembers(group.id);
      setGroupMembers(data.members || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setGroupMembers([]);
    }
  };

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !activeChat) {
      return;
    }

    try {
      setSending(true);
      let data;
      
      if (chatType === 'group') {
        data = await groupService.sendGroupMessage(activeChat.id, newMessage);
      } else {
        // Para conversas privadas, activeChat pode ser um objeto com username ou uma string
        const targetUsername = activeChat.username || activeChat;
        data = await privatechatService.sendPrivateMessage(targetUsername, newMessage);
      }

      setMessages(prevMessages => [...(prevMessages || []), data.data]);
      setNewMessage('');
      
      // Scroll para baixo após enviar mensagem
      setTimeout(() => {
        const container = document.getElementById('messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
          console.log('📜 Scroll após enviar mensagem');
        }
      }, 100);
      
      // Atualizar lista de conversas se for chat privado
      if (chatType === 'private') {
        fetchConversations();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Selecionar chat (grupo ou conversa privada) - simplificado
  const selectChat = (chat, type) => {
    console.log('Selecionando chat:', chat, 'tipo:', type);
    
    // Definir nova conversa
    setActiveChat(chat);
    setChatType(type);
  };

  // Criar grupo
  const createGroup = async (groupData) => {
    try {
      const response = await groupService.createGroup(groupData);
      
      if (response.group) {
        alert('Grupo criado com sucesso!');
        setGroups(prevGroups => [...prevGroups, response.group]);
        
        // Se há membros selecionados, adicionar cada um
        if (groupData.type === 'custom' && groupData.selectedMembers?.length > 0) {
          for (const memberUsername of groupData.selectedMembers) {
            try {
              await groupService.addMemberToGroup(response.group.id, memberUsername);
            } catch (error) {
              console.error(`Erro ao adicionar membro ${memberUsername}:`, error);
            }
          }
        }
      } else {
        alert('Erro ao criar grupo: ' + response.error);
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
      const success = await groupService.deleteGroup(group.id);
      
      if (success) {
        alert('Grupo deletado com sucesso!');
        setGroups(prevGroups => prevGroups.filter(g => g.id !== group.id));
        
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
      }
    } catch (error) {
      console.error('Erro ao deletar grupo:', error);
      alert('Erro ao deletar grupo');
    }
  };

  // Iniciar nova conversa privada
  const startPrivateChat = (username) => {
    // Verificar se já existe conversa
    const existingConversation = conversations.find(c => {
      const otherUsername = c.otherUser?.username || c.otherUser;
      return otherUsername === username;
    });
    if (existingConversation) {
      const otherUser = existingConversation.otherUser?.username || existingConversation.otherUser;
      selectChat(otherUser, 'private');
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
      
      // Forçar scroll para baixo após carregar mensagens
      setTimeout(() => {
        const container = document.getElementById('messages-container');
        if (container && container.scrollHeight > container.clientHeight) {
          container.scrollTop = container.scrollHeight;
          console.log('📜 [HOOK] Scroll forçado final após carregar mensagens');
        }
      }, 600);
      
      // Atualizar mensagens a cada 5 segundos
      const interval = setInterval(() => {
        fetchMessages();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [activeChat, chatType, fetchMessages]);

  // Buscar membros do grupo ativo para mostrar contador
  useEffect(() => {
    if (activeChat && chatType === 'group') {
      fetchGroupMembers(activeChat);
    }
  }, [activeChat, chatType]);

  // Atualizar conversas privadas periodicamente (simplificado)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    // State
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

    // Setters
    setNewMessage,

    // Actions
    selectChat,
    sendMessage,
    createGroup,
    deleteGroup,
    startPrivateChat,
    fetchGroupMembers
  };
};
