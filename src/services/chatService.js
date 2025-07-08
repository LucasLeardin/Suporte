import { authenticatedFetch } from './authService';

const API_BASE_URL = 'http://localhost:8000';

// ========== GRUPOS ==========

export const groupService = {
  // Buscar todos os grupos
  async fetchGroups() {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups`);
    return response.json();
  },

  // Criar novo grupo
  async createGroup(groupData) {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
    return response.json();
  },

  // Deletar grupo
  async deleteGroup(groupId) {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups/${groupId}`, {
      method: 'DELETE'
    });
    return response.ok;
  },

  // Buscar mensagens do grupo
  async fetchGroupMessages(groupId) {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups/${groupId}/messages`);
    return response.json();
  },

  // Enviar mensagem para grupo
  async sendGroupMessage(groupId, message) {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return response.json();
  },

  // Buscar membros do grupo
  async fetchGroupMembers(groupId) {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups/${groupId}/members`);
    return response.json();
  },

  // Adicionar membro ao grupo
  async addMemberToGroup(groupId, username) {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    return response.json();
  },

  // Remover membro do grupo
  async removeMemberFromGroup(groupId, username) {
    const response = await authenticatedFetch(`${API_BASE_URL}/groups/${groupId}/members/${username}`, {
      method: 'DELETE'
    });
    return response.ok;
  }
};

// ========== CONVERSAS PRIVADAS ==========

export const privatechatService = {
  // Buscar conversas privadas
  async fetchConversations() {
    const response = await authenticatedFetch(`${API_BASE_URL}/private-chat/conversations`);
    return response.json();
  },

  // Buscar mensagens de conversa privada
  async fetchPrivateMessages(username) {
    const response = await authenticatedFetch(`${API_BASE_URL}/private-chat/messages/${username}`);
    return response.json();
  },

  // Enviar mensagem privada
  async sendPrivateMessage(username, message) {
    const response = await authenticatedFetch(`${API_BASE_URL}/private-chat/messages/${username}`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    return response.json();
  }
};

// ========== USUÁRIOS ==========

export const userService = {
  // Buscar usuários disponíveis
  async fetchAvailableUsers() {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/available`);
    return response.json();
  }
};
