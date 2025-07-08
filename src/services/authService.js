// Serviço de autenticação
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');
  
  if (!token) {
    throw new Error('Token não encontrado');
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-username': username || ''
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  return fetch(url, mergedOptions);
};

// Verificar se o usuário está logado
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

// Fazer logout
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('username');
  localStorage.removeItem('userRole');
  window.location.reload();
};

// Obter dados do usuário atual
export const getCurrentUser = () => {
  return {
    username: localStorage.getItem('username'),
    role: localStorage.getItem('userRole'),
    token: localStorage.getItem('authToken')
  };
};
