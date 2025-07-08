import React, { useEffect, useState } from 'react';
import { authenticatedFetch } from './utils/auth';

const Settings = () => {
  const [autoReply, setAutoReply] = useState(true);
  const [businessHours, setBusinessHours] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [welcomeMessage, setWelcomeMessage] = useState('Olá! Como posso te ajudar hoje? 😊');
  const [customCommands, setCustomCommands] = useState([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar configurações
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/config');
      const data = await response.json();
      
      setAutoReply(data.autoReply);
      setBusinessHours(data.businessHours);
      setStartTime(data.startTime);
      setEndTime(data.endTime);
      setWelcomeMessage(data.welcomeMessage);
      setCustomCommands(data.customCommands);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/config', {
        method: 'POST',
        body: JSON.stringify({
          autoReply,
          businessHours,
          startTime,
          endTime,
          welcomeMessage
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Configurações salvas com sucesso!');
      } else {
        alert('Erro ao salvar configurações: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addCommand = async () => {
    if (!newTrigger.trim() || !newResponse.trim()) {
      alert('Por favor, preencha o comando e a resposta');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/config/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trigger: newTrigger,
          response: newResponse
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCustomCommands([...customCommands, data.command]);
        setNewTrigger('');
        setNewResponse('');
        alert('Comando adicionado com sucesso!');
      } else {
        alert('Erro ao adicionar comando');
      }
    } catch (error) {
      console.error('Erro ao adicionar comando:', error);
      alert('Erro ao adicionar comando: ' + error.message);
    }
  };

  const removeCommand = async (commandId) => {
    try {
      const response = await fetch(`http://localhost:8000/config/commands/${commandId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCustomCommands(customCommands.filter(cmd => cmd.id !== commandId));
        alert('Comando removido com sucesso!');
      } else {
        alert('Erro ao remover comando');
      }
    } catch (error) {
      console.error('Erro ao remover comando:', error);
      alert('Erro ao remover comando: ' + error.message);
    }
  };

  return (
    <div 
      className="scroll-container"
      style={{ 
        padding: '30px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollBehavior: 'smooth'
      }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '30px', textAlign: 'center' }}>
        ⚙️ Configurações do WhatsApp
      </h1>
      
      {/* Configurações de Mensagens Automáticas */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          💬 Mensagens Automáticas
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            <input
              type="checkbox"
              checked={autoReply}
              onChange={(e) => setAutoReply(e.target.checked)}
              style={{ transform: 'scale(1.3)' }}
            />
            <span>Ativar respostas automáticas</span>
          </label>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '16px'
          }}>
            <input
              type="checkbox"
              checked={businessHours}
              onChange={(e) => setBusinessHours(e.target.checked)}
              style={{ transform: 'scale(1.3)' }}
            />
            <span>Respeitar horário comercial</span>
          </label>
        </div>

        {businessHours && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            border: '1px solid #e9ecef'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                Hora de início:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
                Hora de fim:
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
          </div>
        )}

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
            Mensagem de Boas-vindas:
          </label>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              minHeight: '80px',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontSize: '16px',
              fontFamily: 'Arial, sans-serif'
            }}
          />
        </div>

        <button 
          onClick={saveConfig}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#95a5a6' : '#3498db',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'background-color 0.3s'
          }}
        >
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Comandos Personalizados */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        border: '1px solid #dee2e6',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🤖 Comandos Personalizados
        </h2>
        
        {/* Lista de comandos existentes */}
        <div style={{ marginBottom: '30px' }}>
          {customCommands.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px', fontSize: '16px' }}>
              Nenhum comando personalizado criado ainda.
            </p>
          ) : (
            customCommands.map((command) => (
              <div key={command.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid #dee2e6'
              }}>
                <span style={{ flex: 1, fontSize: '16px' }}>
                  <strong style={{ color: '#495057' }}>"{command.trigger}"</strong> → {command.response === 'AUTO_TIME' ? 'Horário atual + data' : command.response}
                </span>
                <button 
                  onClick={() => removeCommand(command.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Remover
                </button>
              </div>
            ))
          )}
        </div>

        {/* Adicionar novo comando */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 2fr auto', 
          gap: '15px',
          alignItems: 'end',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          border: '1px solid #e9ecef'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              Comando:
            </label>
            <input
              type="text"
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value)}
              placeholder="ex: oi"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontSize: '16px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>
              Resposta:
            </label>
            <input
              type="text"
              value={newResponse}
              onChange={(e) => setNewResponse(e.target.value)}
              placeholder="ex: Olá! Como posso ajudar?"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box',
                fontSize: '16px'
              }}
            />
          </div>
          <button 
            onClick={addCommand}
            style={{
              backgroundColor: '#27ae60',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              height: 'fit-content',
              fontWeight: 'bold',
              fontSize: '16px',
              transition: 'background-color 0.3s'
            }}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
