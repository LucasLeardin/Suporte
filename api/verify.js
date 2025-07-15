export default function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token === 'valid-token-123') {
    res.json({ username: 'admin', role: 'admin' });
  } else {
    res.status(401).json({ error: 'Token inválido' });
  }
}
