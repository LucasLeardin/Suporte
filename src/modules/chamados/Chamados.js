import React, { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../../utils/auth';

const Chamados = () => {
  const [activeTab, setActiveTab] = useState('meus-chamados');
  const [chamados, setChamados] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  
  // Estados para criar novo chamado
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChamado, setNewChamado] = useState({
    title: '',
    description: '',
    priority: 'medium',
    type: 'user', // 'user' ou 'department'
    assignedTo: '',
    departmentId: ''
  });

  // Estados para modal de visualização
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState(null);
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Estados para filtros
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all'
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [userResponse, departmentsResponse, usersResponse] = await Promise.all([
        authenticatedFetch('/api/verify'),
        authenticatedFetch('/api/departments'),
        authenticatedFetch('/api/users')
      ]);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData);
      }

      if (departmentsResponse.ok) {
        const departmentsData = await departmentsResponse.json();
        setDepartments(departmentsData);
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  };

  const loadChamados = useCallback(async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:8000/chamados';
      
      if (activeTab === 'meus-chamados') {
        url += '?createdBy=' + currentUser.username;
      } else if (activeTab === 'atribuidos') {
        url += '?assignedTo=' + currentUser.username;
      }

      const response = await authenticatedFetch(url);
      
      if (response.ok) {
        let data = await response.json();
        
        // Aplicar filtros
        if (filters.status !== 'all') {
          data = data.filter(chamado => chamado.status === filters.status);
        }
        if (filters.priority !== 'all') {
          data = data.filter(chamado => chamado.priority === filters.priority);
        }
        if (filters.type !== 'all') {
          data = data.filter(chamado => chamado.type === filters.type);
        }
        
        setChamados(data);
      }
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUser.username, filters.status, filters.priority, filters.type]);

  useEffect(() => {
    loadChamados();
  }, [activeTab, filters, loadChamados]);

  const createChamado = async () => {
    try {
      if (!newChamado.title.trim() || !newChamado.description.trim()) {
        alert('Por favor, preencha o título e a descrição');
        return;
      }

      if (newChamado.type === 'user' && !newChamado.assignedTo) {
        alert('Por favor, selecione um usuário');
        return;
      }

      if (newChamado.type === 'department' && !newChamado.departmentId) {
        alert('Por favor, selecione um departamento');
        return;
      }

      const response = await authenticatedFetch('http://localhost:8000/chamados', {
        method: 'POST',
        body: JSON.stringify(newChamado)
      });

      if (response.ok) {
        alert('Chamado criado com sucesso!');
        setShowCreateModal(false);
        setNewChamado({
          title: '',
          description: '',
          priority: 'medium',
          type: 'user',
          assignedTo: '',
          departmentId: ''
        });
        loadChamados();
      } else {
        const error = await response.json();
        alert('Erro ao criar chamado: ' + error.message);
      }
    } catch (error) {
      console.error('Erro ao criar chamado:', error);
      alert('Erro ao criar chamado: ' + error.message);
    }
  };

  const updateChamadoStatus = async (chamadoId, newStatus) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8000/chamados/${chamadoId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Status atualizado com sucesso!');
        loadChamados();
      } else {
        alert('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  const openViewModal = async (chamado) => {
    setSelectedChamado(chamado);
    setShowViewModal(true);
    await loadChamadoResponses(chamado.id);
  };

  // Carregar respostas do chamado
  const loadChamadoResponses = async (chamadoId) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8000/chamados/${chamadoId}/responses`);
      if (response.ok) {
        const data = await response.json();
        setResponses(data);
      }
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
    }
  };

  // Adicionar resposta ao chamado
  const addResponse = async () => {
    if (!newResponse.trim() && uploadedFiles.length === 0) {
      alert('Por favor, escreva uma resposta ou anexe um arquivo');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('response', newResponse);
      
      // Adicionar arquivos ao FormData
      uploadedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      console.log('Enviando resposta:', { response: newResponse, files: uploadedFiles });

      const response = await fetch(`http://localhost:8000/chamados/${selectedChamado.id}/responses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'x-username': localStorage.getItem('username') || ''
        },
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setNewResponse('');
        setUploadedFiles([]);
        await loadChamadoResponses(selectedChamado.id);
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        alert('Erro ao enviar resposta: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      alert('Erro ao enviar resposta: ' + error.message);
    }
  };

  // Lidar com upload de arquivos
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  // Remover arquivo da lista
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3498db';
      case 'in_progress': return '#f39c12';
      case 'resolved': return '#27ae60';
      case 'closed': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const renderChamadoCard = (chamado) => (
    <div key={chamado.id} style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '15px',
      border: '1px solid #dee2e6',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <h3 
          style={{ 
            color: '#2c3e50', 
            margin: 0, 
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
          onClick={() => openViewModal(chamado)}
        >
          {chamado.title}
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: getPriorityColor(chamado.priority)
          }}>
            {chamado.priority === 'high' ? 'Alta' : chamado.priority === 'medium' ? 'Média' : 'Baixa'}
          </span>
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: getStatusColor(chamado.status)
          }}>
            {chamado.status === 'open' ? 'Aberto' : 
             chamado.status === 'in_progress' ? 'Em Andamento' : 
             chamado.status === 'resolved' ? 'Resolvido' : 'Fechado'}
          </span>
        </div>
      </div>
      
      <p style={{ color: '#666', marginBottom: '15px' }}>{chamado.description}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '15px' }}>
        <div>
          <strong>Criado por:</strong> {chamado.createdBy}
        </div>
        <div>
          <strong>Atribuído a:</strong> {chamado.assignedTo || 'Não atribuído'}
        </div>
        <div>
          <strong>Departamento:</strong> {chamado.departmentName || 'N/A'}
        </div>
        <div>
          <strong>Criado em:</strong> {formatDate(chamado.createdAt)}
        </div>
      </div>
      
      {(chamado.createdBy === currentUser.username || chamado.assignedTo === currentUser.username || currentUser.role === 'admin') && (
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button
            onClick={() => openViewModal(chamado)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Ver Detalhes
          </button>
          {chamado.status === 'open' && (
            <button
              onClick={() => updateChamadoStatus(chamado.id, 'in_progress')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Iniciar
            </button>
          )}
          {chamado.status === 'in_progress' && (
            <button
              onClick={() => updateChamadoStatus(chamado.id, 'resolved')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Resolver
            </button>
          )}
          {chamado.status === 'resolved' && (
            <button
              onClick={() => updateChamadoStatus(chamado.id, 'closed')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Fechar
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderCreateModal = () => (
    showCreateModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Novo Chamado</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Título:
            </label>
            <input
              type="text"
              value={newChamado.title}
              onChange={(e) => setNewChamado({...newChamado, title: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Descrição:
            </label>
            <textarea
              value={newChamado.description}
              onChange={(e) => setNewChamado({...newChamado, description: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                minHeight: '100px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Prioridade:
            </label>
            <select
              value={newChamado.priority}
              onChange={(e) => setNewChamado({...newChamado, priority: e.target.value})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box'
              }}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Atribuir para:
            </label>
            <select
              value={newChamado.type}
              onChange={(e) => setNewChamado({...newChamado, type: e.target.value, assignedTo: '', departmentId: ''})}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
                marginBottom: '10px'
              }}
            >
              <option value="user">Usuário específico</option>
              <option value="department">Departamento</option>
            </select>

            {newChamado.type === 'user' && (
              <select
                value={newChamado.assignedTo}
                onChange={(e) => setNewChamado({...newChamado, assignedTo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Selecione um usuário</option>
                {users.map(user => (
                  <option key={user.id} value={user.username}>
                    {user.username} - {user.department}
                  </option>
                ))}
              </select>
            )}

            {newChamado.type === 'department' && (
              <select
                value={newChamado.departmentId}
                onChange={(e) => setNewChamado({...newChamado, departmentId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">Selecione um departamento</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={createChamado}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Criar Chamado
            </button>
          </div>
        </div>
      </div>
    )
  );

  // Modal de visualização detalhada
  const renderViewModal = () => (
    showViewModal && selectedChamado && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#2c3e50', margin: 0 }}>{selectedChamado.title}</h2>
            <button
              onClick={() => setShowViewModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#95a5a6'
              }}
            >
              ×
            </button>
          </div>

          {/* Informações do chamado */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Status:</strong>
                <span style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: getStatusColor(selectedChamado.status)
                }}>
                  {selectedChamado.status === 'open' ? 'Aberto' : 
                   selectedChamado.status === 'in_progress' ? 'Em Andamento' : 
                   selectedChamado.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                </span>
              </div>
              <div>
                <strong>Prioridade:</strong>
                <span style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: getPriorityColor(selectedChamado.priority)
                }}>
                  {selectedChamado.priority === 'high' ? 'Alta' : selectedChamado.priority === 'medium' ? 'Média' : 'Baixa'}
                </span>
              </div>
              <div>
                <strong>Criado por:</strong> {selectedChamado.createdBy}
              </div>
              <div>
                <strong>Atribuído a:</strong> {selectedChamado.assignedTo || 'Não atribuído'}
              </div>
              <div>
                <strong>Departamento:</strong> {selectedChamado.departmentName || 'N/A'}
              </div>
              <div>
                <strong>Criado em:</strong> {formatDate(selectedChamado.createdAt)}
              </div>
            </div>
            
            <div style={{ marginTop: '15px' }}>
              <strong>Descrição:</strong>
              <p style={{ margin: '5px 0', color: '#666' }}>{selectedChamado.description}</p>
            </div>
          </div>

          {/* Respostas */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Respostas</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {responses.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  Nenhuma resposta ainda
                </p>
              ) : (
                responses.map((response, index) => (
                  <div key={index} style={{
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong>{response.username}</strong>
                      <span style={{ color: '#666', fontSize: '12px' }}>
                        {formatDate(response.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#333' }}>{response.response}</p>
                    
                    {/* Arquivos anexados */}
                    {response.files && response.files.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <small style={{ color: '#666' }}>Arquivos anexados:</small>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                          {response.files.map((file, fileIndex) => (
                            <a
                              key={fileIndex}
                              href={`http://localhost:8000/uploads/${file.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '2px 6px',
                                backgroundColor: '#3498db',
                                color: 'white',
                                textDecoration: 'none',
                                borderRadius: '3px',
                                fontSize: '11px'
                              }}
                            >
                              📎 {file.originalName}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Adicionar resposta */}
          {(selectedChamado.createdBy === currentUser.username || 
            selectedChamado.assignedTo === currentUser.username || 
            currentUser.role === 'admin') && (
            <div style={{
              borderTop: '1px solid #dee2e6',
              paddingTop: '20px'
            }}>
              <h4 style={{ color: '#2c3e50', marginBottom: '15px' }}>Adicionar Resposta</h4>
              
              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Digite sua resposta..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  marginBottom: '10px'
                }}
              />

              {/* Upload de arquivos */}
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  onChange={handleFileUpload}
                  style={{ marginBottom: '10px' }}
                />
                
                {uploadedFiles.length > 0 && (
                  <div>
                    <small style={{ color: '#666' }}>Arquivos selecionados:</small>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 6px',
                          backgroundColor: '#e9ecef',
                          borderRadius: '3px',
                          fontSize: '11px'
                        }}>
                          <span>📎 {file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#e74c3c',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={addResponse}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Enviar Resposta
              </button>
            </div>
          )}
        </div>
      </div>
    )
  );

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          🎫 Sistema de Chamados
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Novo Chamado
        </button>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #ecf0f1' }}>
        <button
          onClick={() => setActiveTab('meus-chamados')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'meus-chamados' ? '#3498db' : 'transparent',
            color: activeTab === 'meus-chamados' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Meus Chamados
        </button>
        <button
          onClick={() => setActiveTab('atribuidos')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'atribuidos' ? '#3498db' : 'transparent',
            color: activeTab === 'atribuidos' ? 'white' : '#2c3e50',
            border: 'none',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Atribuídos a Mim
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('todos')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'todos' ? '#3498db' : 'transparent',
              color: activeTab === 'todos' ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '5px 5px 0 0',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Todos os Chamados
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          style={{
            padding: '5px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="all">Todos os Status</option>
          <option value="open">Aberto</option>
          <option value="in_progress">Em Andamento</option>
          <option value="resolved">Resolvido</option>
          <option value="closed">Fechado</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters({...filters, priority: e.target.value})}
          style={{
            padding: '5px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="all">Todas as Prioridades</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
          <option value="low">Baixa</option>
        </select>

        <select
          value={filters.type}
          onChange={(e) => setFilters({...filters, type: e.target.value})}
          style={{
            padding: '5px 10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        >
          <option value="all">Todos os Tipos</option>
          <option value="user">Usuário</option>
          <option value="department">Departamento</option>
        </select>
      </div>

      {/* Lista de Chamados */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Carregando chamados...</p>
        </div>
      ) : chamados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p style={{ color: '#666' }}>Nenhum chamado encontrado.</p>
        </div>
      ) : (
        chamados.map(renderChamadoCard)
      )}

      {renderCreateModal()}
      {renderViewModal()}
    </div>
  );
};

export default Chamados;
