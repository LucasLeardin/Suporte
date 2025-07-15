let users = [
  { id: 1, username: 'admin', password: '123456', role: 'admin', department: 'Suporte' },
  { id: 2, username: 'suporte', password: 'suporte123', role: 'user', department: 'Suporte' }
];
let nextId = 3;

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Não retornar senha
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.status(200).json(safeUsers);
  } else if (req.method === 'POST') {
    const { username, password, role, department } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    const user = { id: nextId++, username, password, role: role || 'user', department: department || '' };
    users.push(user);
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword });
  } else if (req.method === 'PUT') {
    const { id, username, password, role, department } = req.body;
    const user = users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (username) user.username = username;
    if (password) user.password = password;
    if (role) user.role = role;
    if (department) user.department = department;
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } else if (req.method === 'DELETE') {
    const { id } = req.body;
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Usuário não encontrado' });
    users.splice(idx, 1);
    res.status(204).end();
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
