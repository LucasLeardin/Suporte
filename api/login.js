export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const users = [
    { id: 1, username: 'admin', password: '123456', role: 'admin' },
    { id: 2, username: 'suporte', password: 'suporte123', role: 'user' }
  ];
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({
      token: 'valid-token-123',
      user: { username: user.username, role: user.role }
    });
  } else {
    res.status(401).json({ error: 'Credenciais inválidas' });
  }
}
