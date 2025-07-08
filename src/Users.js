import React, { useState, useEffect } from 'react';
import { authenticatedFetch } from './utils/auth';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewDepartment, setShowNewDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user',
    department: ''
  });
  const [editingUser, setEditingUser] = useState(null);

  // Carregar departamentos
  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await authenticatedFetch('http://localhost:8000/departments');
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data);
      } else {
        console.error('Erro ao carregar departamentos:', data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  // Adicionar departamento
  const addDepartment = async () => {
    if (!newDepartmentName.trim()) {
      alert('Nome do departamento é obrigatório');
      return;
    }

    try {
      const response = await authenticatedFetch('http://localhost:8000/departments', {
        method: 'POST',
        body: JSON.stringify({ name: newDepartmentName })
      });

      const data = await response.json();

      if (response.ok) {
        setDepartments([...departments, data.department]);
        setNewUser({...newUser, department: data.department.name});
        setNewDepartmentName('');
        setShowNewDepartment(false);
        alert('Departamento criado com sucesso!');
      } else {
        alert('Erro ao criar departamento: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      alert('Erro ao criar departamento');
    }
  };

  // Carregar usuários
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('http://localhost:8000/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data);
      } else {
        alert('Erro ao carregar usuários: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar usuário
  const addUser = async () => {
    if (!newUser.username.trim() || !newUser.password.trim()) {
      alert('Usuário e senha são obrigatórios');
      return;
    }

    try {
      const response = await authenticatedFetch('http://localhost:8000/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuário adicionado com sucesso!');
        setUsers([...users, data.user]);
        setNewUser({ username: '', password: '', role: 'user', department: '' });
        setShowAddForm(false);
      } else {
        alert('Erro ao adicionar usuário: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      alert('Erro ao adicionar usuário');
    }
  };

  // Excluir usuário
  const deleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`http://localhost:8000/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Usuário excluído com sucesso!');
        setUsers(users.filter(user => user.id !== userId));
      } else {
        const data = await response.json();
        alert('Erro ao excluir usuário: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  // Atualizar usuário
  const updateUser = async () => {
    if (!editingUser.username.trim()) {
      alert('Nome de usuário é obrigatório');
      return;
    }

    try {
      const response = await authenticatedFetch(`http://localhost:8000/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          username: editingUser.username,
          ...(editingUser.password && { password: editingUser.password }),
          role: editingUser.role,
          department: editingUser.department
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Usuário atualizado com sucesso!');
        setUsers(users.map(user => 
          user.id === editingUser.id ? data.user : user
        ));
        setEditingUser(null);
      } else {
        alert('Erro ao atualizar usuário: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  return (
    <div style={{ padding: '30px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>
          👥 Gerenciamento de Usuários
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            backgroundColor: '#27ae60',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Novo Usuário
        </button>
      </div>

      {/* Formulário de Adicionar Usuário */}
      {showAddForm && (
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginBottom: '30px',
          border: '1px solid #ecf0f1'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Adicionar Novo Usuário</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Usuário:
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
                placeholder="Nome do usuário"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Senha:
              </label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
                placeholder="Senha"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Perfil:
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Departamento:
              </label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    boxSizing: 'border-box'
                  }}
                  disabled={loadingDepartments}
                >
                  <option value="">Selecione um departamento</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewDepartment(true)}
                  style={{
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Criar novo departamento"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Formulário de novo departamento */}
          {showNewDepartment && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Criar Novo Departamento</h4>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={newDepartmentName}
                    onChange={(e) => setNewDepartmentName(e.target.value)}
                    placeholder="Nome do departamento"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  onClick={addDepartment}
                  style={{
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setShowNewDepartment(false);
                    setNewDepartmentName('');
                  }}
                  style={{
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    padding: '8px 15px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={addUser}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Salvar
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewUser({ username: '', password: '', role: 'user', department: '' });
                setShowNewDepartment(false);
                setNewDepartmentName('');
              }}
              style={{
                backgroundColor: '#95a5a6',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #ecf0f1'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Carregando usuários...</p>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
              gap: '15px',
              padding: '15px 25px',
              borderBottom: '1px solid #ecf0f1',
              backgroundColor: '#f8f9fa',
              fontWeight: 'bold',
              color: '#2c3e50'
            }}>
              <div>Usuário</div>
              <div>Perfil</div>
              <div>Departamento</div>
              <div>Criado em</div>
              <div>Ações</div>
            </div>

            {users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6' }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
                    gap: '15px',
                    padding: '15px 25px',
                    borderBottom: '1px solid #ecf0f1',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{user.username}</strong>
                    {user.username === localStorage.getItem('username') && (
                      <span style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '11px'
                      }}>
                        Você
                      </span>
                    )}
                  </div>
                  <div>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: user.role === 'admin' ? '#e74c3c' : '#27ae60',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '12px'
                    }}>
                      {user.role === 'admin' ? 'Admin' : 'Usuário'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#34495e' }}>
                    {user.department || '-'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => setEditingUser({...user, password: ''})}
                      style={{
                        backgroundColor: '#f39c12',
                        color: 'white',
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Editar
                    </button>
                    {user.username !== localStorage.getItem('username') && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          padding: '5px 10px',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingUser && (
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
            width: '500px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>
              Editar Usuário
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Usuário:
              </label>
              <input
                type="text"
                value={editingUser.username}
                onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nova Senha (deixe em branco para não alterar):
              </label>
              <input
                type="password"
                value={editingUser.password}
                onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
                placeholder="Nova senha (opcional)"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Perfil:
              </label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Departamento:
              </label>
              <select
                value={editingUser.department || ''}
                onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxSizing: 'border-box'
                }}
                disabled={loadingDepartments}
              >
                <option value="">Selecione um departamento</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingUser(null)}
                style={{
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={updateUser}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
