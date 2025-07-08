import React, { useState } from 'react';
import '../../styles/login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Tentando fazer login com:', { username, password: '***' });

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        // Salvar token no localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('userRole', data.user.role);
        
        console.log('Login bem-sucedido, dados salvos no localStorage');
        
        onLogin({
          username: data.user.username,
          role: data.user.role,
          token: data.token
        });
      } else {
        console.error('Erro no login:', data);
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro de conexão. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <div className="login-header">
          <h1 className="login-title">
            🔐 Login
          </h1>
          <p className="login-subtitle">
            Central de Mensagens WhatsApp
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label className="login-label">
              Usuário:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="login-input"
              placeholder="Digite seu usuário"
            />
          </div>

          <div className="login-form-group">
            <label className="login-label">
              Senha:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
              placeholder="Digite sua senha"
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-credentials">
          <strong>Credenciais padrão:</strong><br />
          Usuário: <code>admin</code><br />
          Senha: <code>123456</code>
        </div>
      </div>
    </div>
  );
};

export default Login;
