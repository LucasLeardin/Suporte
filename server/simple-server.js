const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

console.log('Starting server...');

// Sistema de autenticação simples
const users = [
    { id: 1, username: 'admin', password: '123456', role: 'admin' },
    { id: 2, username: 'suporte', password: 'suporte123', role: 'user' }
];

// Simulação de estado do WhatsApp
let whatsAppState = {
    ready: false,
    qrCode: null,
    lastQrGenerated: null
};

// Função para gerar QR code simulado mais realista
function generateMockQR() {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const sessionId = Math.random().toString(36).substr(2, 9);
    
    // Formato mais parecido com QR do WhatsApp Web
    return `1@${randomId},${sessionId},${timestamp}`;
}

// Simular mudança de estado do WhatsApp periodicamente
setInterval(() => {
    if (!whatsAppState.ready) {
        // Gerar novo QR code a cada 30 segundos
        if (!whatsAppState.lastQrGenerated || Date.now() - whatsAppState.lastQrGenerated > 30000) {
            whatsAppState.qrCode = generateMockQR();
            whatsAppState.lastQrGenerated = Date.now();
            console.log('Novo QR code gerado');
        }
    }
}, 5000);

// Auth login
app.post('/auth/login', (req, res) => {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        console.log('Login successful for:', username);
        res.json({
            token: 'valid-token-123',
            user: { username: user.username, role: user.role }
        });
    } else {
        console.log('Login failed for:', username);
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Auth verify
app.get('/auth/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log('Token verification:', token);
    
    if (token === 'valid-token-123') {
        res.json({ username: 'admin', role: 'admin' });
    } else {
        res.status(401).json({ error: 'Token inválido' });
    }
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({ 
        ready: whatsAppState.ready, 
        message: whatsAppState.ready ? 'WhatsApp conectado' : 'Aguardando conexão com WhatsApp'
    });
});

// QR endpoint
app.get('/qr', (req, res) => {
    if (!whatsAppState.qrCode) {
        whatsAppState.qrCode = generateMockQR();
        whatsAppState.lastQrGenerated = Date.now();
    }
    
    res.json({ qr: whatsAppState.qrCode });
});

// Endpoint para simular conexão do WhatsApp
app.post('/connect', (req, res) => {
    whatsAppState.ready = true;
    whatsAppState.qrCode = null;
    console.log('WhatsApp connected (simulated)');
    res.json({ message: 'WhatsApp conectado com sucesso' });
});

// Endpoint para resetar conexão
app.post('/disconnect', (req, res) => {
    whatsAppState.ready = false;
    whatsAppState.qrCode = null;
    console.log('WhatsApp disconnected');
    res.json({ message: 'WhatsApp desconectado' });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is working!', 
        timestamp: new Date().toISOString(),
        whatsAppState: whatsAppState
    });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- POST /auth/login');
    console.log('- GET /auth/verify');
    console.log('- GET /status');
    console.log('- GET /qr');
    console.log('- POST /connect (simulate WhatsApp connection)');
    console.log('- POST /disconnect (simulate WhatsApp disconnection)');
    console.log('- GET /test');
    console.log('');
    console.log('WhatsApp simulation started. QR codes will be generated automatically.');
});
