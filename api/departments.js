let departments = [
  { id: 1, name: 'Suporte' },
  { id: 2, name: 'Financeiro' }
];
let nextId = 3;

export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json(departments);
  } else if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome do departamento é obrigatório' });
    }
    const department = { id: nextId++, name };
    departments.push(department);
    res.status(201).json({ department });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
