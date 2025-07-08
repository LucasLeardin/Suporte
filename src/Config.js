import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from './utils/auth';

const Config = () => {
  const [autoReply, setAutoReply] = useState(true);
  const [businessHours, setBusinessHours] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [welcomeMessage, setWelcomeMessage] = useState('Olá! Como posso te ajudar hoje? 😊');
  const [customCommands, setCustomCommands] = useState([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar configurações do backend
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

  // Salvar configurações
  const saveConfig = async () => {
    try {
      setLoading(true);
      console.log('Salvando configurações:', {
        autoReply,
        businessHours,
        startTime,
        endTime,
        welcomeMessage
      });
      
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
      console.log('Resposta do servidor:', data);

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

  // Adicionar comando personalizado
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
      alert('Erro ao adicionar comando');
    }
  };

  // Remover comando personalizado
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
      alert('Erro ao remover comando');
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>
        ⚙️ Configurações do Sistema
      </h1>

      <div style={{ display: 'grid', gap: '30px' }}>
        {/* Configurações de Mensagens */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ecf0f1'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>💬 Mensagens Automáticas</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={autoReply}
                onChange={(e) => setAutoReply(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span>Ativar respostas automáticas</span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Mensagem de Boas-vindas:
            </label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <button 
            onClick={saveConfig}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#95a5a6' : '#3498db',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>

        {/* Horário de Funcionamento */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ecf0f1'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>🕐 Horário de Funcionamento</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={businessHours}
                onChange={(e) => setBusinessHours(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
              <span>Respeitar horário comercial</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Início:
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Fim:
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Comandos Personalizados */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ecf0f1'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>🤖 Comandos Personalizados</h3>
          
          {customCommands.map((command) => (
            <div key={command.id} style={{ marginBottom: '15px' }}>
              <div style={{
                display: 'flex',
                gap: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                alignItems: 'center'
              }}>
                <strong>Comando:</strong> "{command.trigger}" 
                <span style={{ color: '#95a5a6' }}>→</span>
                <strong>Resposta:</strong> {command.response === 'AUTO_TIME' ? 'Horário atual + data' : command.response}
                <button 
                  onClick={() => removeCommand(command.id)}
                  style={{
                    marginLeft: 'auto',
                    padding: '5px 10px',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr auto', 
            gap: '10px', 
            marginBottom: '15px',
            alignItems: 'end'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Comando:
              </label>
              <input
                type="text"
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                placeholder="ex: oi"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Resposta:
              </label>
              <input
                type="text"
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="ex: Olá! Como posso ajudar?"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px'
                }}
              />
            </div>
            <button 
              onClick={addCommand}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                padding: '10px 15px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                height: 'fit-content'
              }}
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Config;
