// Utilitário para fazer requisições autenticadas
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  const username = localStorage.getItem('username');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(username && { 'x-username': username }),
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(url, defaultOptions);
  
  // Se token inválido, redirecionar para login
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    window.location.reload();
  }
  
  return response;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};
