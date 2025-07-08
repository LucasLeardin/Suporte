const express = require('express');
const cors = require('cors');
const { Client, MessageMedia } = require('whatsapp-web.js');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sistema de autenticação simples
const users = [
    { id: 1, username: 'admin', password: '123456', role: 'admin', department: 'TI', createdAt: new Date() },
    { id: 2, username: 'suporte', password: 'suporte123', role: 'user', department: 'Suporte', createdAt: new Date() }
];

// Departamentos
const departments = [
    { id: 1, name: 'TI', createdAt: new Date() },
    { id: 2, name: 'Suporte', createdAt: new Date() },
    { id: 3, name: 'Vendas', createdAt: new Date() },
    { id: 4, name: 'RH', createdAt: new Date() }
];

let nextUserId = 3;
let nextDepartmentId = 5;

// Middleware para verificar autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    // Verificação simples do token (em produção use JWT)
    if (token === 'valid-token-123') {
        next();
    } else {
        res.status(403).json({ error: 'Token inválido' });
    }
};

let latestQr = '';
let isClientReady = false;
let conversations = new Map(); // Armazenar conversas em memória
let allMessages = []; // Armazenar todas as mensagens

// Sistema de grupos de chat
let groups = [
    {
        id: 1,
        name: 'Geral',
        description: 'Chat geral da equipe - todos podem participar',
        type: 'general', // 'general', 'department', 'custom'
        members: [], // Array de usernames, vazio = todos podem participar
        createdBy: 'system',
        createdAt: new Date(),
        isDefault: true
    }
];
let groupMessages = []; // Array de mensagens com groupId
let nextGroupId = 2;
let nextGroupMessageId = 1;

// Chat interno entre usuários (DEPRECATED - mantido para compatibilidade)
let internalMessages = []; // Armazenar mensagens do chat interno (grupo)
let nextInternalMessageId = 1;

// Chats privados entre usuários
let privateChats = new Map(); // Armazenar conversas privadas: "user1-user2" => [messages]
let nextPrivateMessageId = 1;

// Configurações do sistema
let systemConfig = {
    autoReply: true, // Habilitado por padrão
    businessHours: true, // Habilitado por padrão
    startTime: '09:00',
    endTime: '18:00',
    welcomeMessage: 'Olá! Como posso te ajudar hoje? 😊',
    customCommands: [
        {
            id: 1,
            trigger: 'oi',
            response: 'Olá! Como posso te ajudar hoje? 😊'
        },
        {
            id: 2,
            trigger: 'horario',
            response: 'AUTO_TIME' // Palavra especial para horário automático
        }
    ]
};

const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Evento para capturar QR Code
client.on('qr', (qr) => {
    console.log('QR Code gerado');
    latestQr = qr;
});

// Evento quando o cliente está pronto
client.on('ready', () => {
    console.log('WhatsApp Web está pronto!');
    isClientReady = true;
});

// Evento quando o cliente é autenticado
client.on('authenticated', () => {
    console.log('Cliente autenticado com sucesso!');
    isClientReady = true;
});

// Evento de falha na autenticação
client.on('auth_failure', () => {
    console.log('Falha na autenticação!');
    isClientReady = false;
    latestQr = '';
});

// Evento de desconexão
client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    isClientReady = false;
    latestQr = '';
});

// Evento quando a sessão é removida/logout
client.on('logout', () => {
    console.log('Logout do WhatsApp Web');
    isClientReady = false;
    latestQr = '';
});

// Evento de mudança de estado
client.on('change_state', (state) => {
    console.log('Mudança de estado:', state);
    if (state === 'DISCONNECTED' || state === 'UNPAIRED') {
        isClientReady = false;
        latestQr = '';
    }
});

// Evento para receber mensagens
client.on('message', async (message) => {
    // Verificar se ainda está conectado antes de responder
    if (!isClientReady) return;
    
    // Filtrar mensagens de status, broadcast e outras mensagens do sistema
    if (message.from.includes('status@broadcast') || 
        message.from.includes('@broadcast') ||
        message.from.includes('@g.us') ||
        message.type === 'notification_template' ||
        message.type === 'system') {
        console.log(`Mensagem filtrada (sistema/status): ${message.from}`);
        return;
    }
    
    console.log(`Mensagem recebida de ${message.from}: ${message.body}`);
    
    // Armazenar a mensagem
    const messageData = {
        id: Date.now() + Math.random(),
        from: message.from,
        body: message.body,
        timestamp: new Date(),
        type: 'received',
        contact: await getContactInfo(message.from)
    };
    
    allMessages.push(messageData);
    
    // Atualizar conversa
    if (!conversations.has(message.from)) {
        conversations.set(message.from, {
            id: message.from,
            contact: message.from,
            name: messageData.contact.name || message.from.replace('@c.us', ''),
            lastMessage: message.body,
            timestamp: new Date(),
            unread: 1,
            messages: []
        });
    } else {
        const conversation = conversations.get(message.from);
        conversation.lastMessage = message.body;
        conversation.timestamp = new Date();
        conversation.unread += 1;
    }
    
    const conversation = conversations.get(message.from);
    conversation.messages.push(messageData);
    
    // Verificar se deve enviar resposta automática
    if (systemConfig.autoReply) {
        await handleAutoReply(message, conversation);
    }
});

// Função para obter informações do contato
async function getContactInfo(contactId) {
    try {
        if (client && isClientReady) {
            const contact = await client.getContactById(contactId);
            return {
                name: contact.name || contact.pushname || contactId.replace('@c.us', ''),
                number: contact.number
            };
        }
    } catch (error) {
        console.log('Erro ao obter info do contato:', error.message);
    }
    return {
        name: contactId.replace('@c.us', ''),
        number: contactId.replace('@c.us', '')
    };
}

// Função para lidar com respostas automáticas
async function handleAutoReply(message, conversation) {
    try {
        console.log('Processando resposta automática para:', message.from);
        
        // Verificar horário de funcionamento
        if (systemConfig.businessHours) {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
            
            if (currentTime < systemConfig.startTime || currentTime > systemConfig.endTime) {
                const outOfHoursMessage = `Obrigado pela sua mensagem! Nosso horário de atendimento é das ${systemConfig.startTime} às ${systemConfig.endTime}. Retornaremos assim que possível.`;
                console.log('Enviando mensagem fora do horário:', outOfHoursMessage);
                
                await client.sendMessage(message.from, outOfHoursMessage);
                
                // Armazenar resposta do bot
                const botMessageData = {
                    id: Date.now() + Math.random(),
                    from: 'bot',
                    body: outOfHoursMessage,
                    timestamp: new Date(),
                    type: 'sent'
                };
                allMessages.push(botMessageData);
                conversation.messages.push(botMessageData);
                
                // Atualizar timestamp e última mensagem da conversa
                conversation.lastMessage = outOfHoursMessage;
                conversation.timestamp = new Date();
                
                return;
            }
        }

        const messageBody = message.body.toLowerCase();
        let botResponse = null;

        // Verificar comandos personalizados
        for (const command of systemConfig.customCommands) {
            if (messageBody.includes(command.trigger.toLowerCase())) {
                if (command.response === 'AUTO_TIME') {
                    const now = new Date();
                    const horario = now.toLocaleString('pt-BR');
                    botResponse = `O horário atual é: ${horario}`;
                } else {
                    botResponse = command.response;
                }
                break;
            }
        }

        // Se não encontrou comando específico, usar mensagem de boas-vindas para primeira interação
        if (!botResponse && conversation.messages.length === 1) {
            botResponse = systemConfig.welcomeMessage;
        }

        if (botResponse) {
            console.log('Enviando resposta automática:', botResponse);
            await client.sendMessage(message.from, botResponse);
            
            // Armazenar resposta do bot
            const botMessageData = {
                id: Date.now() + Math.random(),
                from: 'bot',
                body: botResponse,
                timestamp: new Date(),
                type: 'sent'
            };
            allMessages.push(botMessageData);
            conversation.messages.push(botMessageData);
            
            // Atualizar timestamp e última mensagem da conversa
            conversation.lastMessage = botResponse;
            conversation.timestamp = new Date();
            
            console.log('Resposta automática enviada com sucesso');
        } else {
            console.log('Nenhuma resposta automática encontrada para:', messageBody);
        }
    } catch (error) {
        console.error('Erro ao enviar resposta automática:', error);
    }
}

// Evento de autenticação
client.on('authenticated', () => {
    console.log('Cliente autenticado com sucesso!');
});

// Evento de falha na autenticação
client.on('auth_failure', () => {
    console.log('Falha na autenticação!');
});

// Evento de desconexão
client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    isClientReady = false;
});

// Inicializar o cliente
client.initialize();

// Verificação periódica do status da conexão
setInterval(async () => {
    try {
        if (isClientReady) {
            const state = await client.getState();
            if (state !== 'CONNECTED') {
                console.log('Conexão perdida detectada. Estado:', state);
                isClientReady = false;
                if (state === 'UNPAIRED') {
                    latestQr = '';
                }
            }
        }
    } catch (error) {
        if (isClientReady) {
            console.log('Erro ao verificar estado da conexão:', error.message);
            isClientReady = false;
        }
    }
}, 5000); // Verifica a cada 5 segundos

// Rotas da API

// Rota de login
app.post('/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }
        
        // Verificar credenciais
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }
        
        // Em produção, usar JWT
        const token = 'valid-token-123';
        
        console.log(`Login realizado com sucesso: ${username}`);
        res.json({ 
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para verificar se o token é válido
app.get('/auth/verify', authenticateToken, (req, res) => {
    try {
        // Tentar obter informações do usuário do header ou localStorage
        const username = req.headers['x-username'] || req.headers['username'];
        
        if (username) {
            const user = users.find(u => u.username === username);
            if (user) {
                res.json({ 
                    valid: true, 
                    message: 'Token válido',
                    username: user.username,
                    role: user.role,
                    department: user.department
                });
                return;
            }
        }
        
        res.json({ valid: true, message: 'Token válido' });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas de gerenciamento de usuários
app.get('/users', authenticateToken, (req, res) => {
    try {
        // Retornar usuários sem as senhas
        const safeUsers = users.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role,
            department: user.department,
            createdAt: user.createdAt
        }));
        
        res.json(safeUsers);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/users', authenticateToken, (req, res) => {
    try {
        const { username, password, role, department } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username e password são obrigatórios' });
        }
        
        // Verificar se o usuário já existe
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Usuário já existe' });
        }
        
        const newUser = {
            id: nextUserId++,
            username,
            password,
            role: role || 'user',
            department: department || '',
            createdAt: new Date()
        };
        
        users.push(newUser);
        
        console.log(`Novo usuário criado: ${username} (${role}) - ${department}`);
        
        // Retornar usuário sem senha
        const safeUser = {
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            department: newUser.department,
            createdAt: newUser.createdAt
        };
        
        res.json({ message: 'Usuário criado com sucesso', user: safeUser });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/users/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role, department } = req.body;
        
        const userIndex = users.findIndex(u => u.id == id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar se o novo username já existe (se diferente do atual)
        if (username && username !== users[userIndex].username) {
            if (users.find(u => u.username === username && u.id != id)) {
                return res.status(400).json({ error: 'Nome de usuário já existe' });
            }
        }
        
        // Atualizar dados
        if (username) users[userIndex].username = username;
        if (password) users[userIndex].password = password;
        if (role) users[userIndex].role = role;
        if (department !== undefined) users[userIndex].department = department;
        
        console.log(`Usuário atualizado: ${users[userIndex].username}`);
        
        // Retornar usuário sem senha
        const safeUser = {
            id: users[userIndex].id,
            username: users[userIndex].username,
            role: users[userIndex].role,
            department: users[userIndex].department,
            createdAt: users[userIndex].createdAt
        };
        
        res.json({ message: 'Usuário atualizado com sucesso', user: safeUser });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/users/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        
        const userIndex = users.findIndex(u => u.id == id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Não permitir excluir o último admin
        if (users[userIndex].role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Não é possível excluir o último administrador' });
            }
        }
        
        const deletedUser = users.splice(userIndex, 1)[0];
        console.log(`Usuário excluído: ${deletedUser.username}`);
        
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas de departamentos
app.get('/departments', authenticateToken, (req, res) => {
    try {
        res.json(departments);
    } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/departments', authenticateToken, (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Nome do departamento é obrigatório' });
        }
        
        // Verificar se o departamento já existe
        if (departments.find(d => d.name.toLowerCase() === name.toLowerCase())) {
            return res.status(400).json({ error: 'Departamento já existe' });
        }
        
        const newDepartment = {
            id: nextDepartmentId++,
            name: name.trim(),
            createdAt: new Date()
        };
        
        departments.push(newDepartment);
        
        console.log(`Novo departamento criado: ${name}`);
        res.json({ message: 'Departamento criado com sucesso', department: newDepartment });
    } catch (error) {
        console.error('Erro ao criar departamento:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/users/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role } = req.body;
        
        const userIndex = users.findIndex(u => u.id == id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar se o novo username já existe (se diferente do atual)
        if (username && username !== users[userIndex].username) {
            if (users.find(u => u.username === username && u.id != id)) {
                return res.status(400).json({ error: 'Nome de usuário já existe' });
            }
        }
        
        // Atualizar dados
        if (username) users[userIndex].username = username;
        if (password) users[userIndex].password = password;
        if (role) users[userIndex].role = role;
        
        console.log(`Usuário atualizado: ${users[userIndex].username}`);
        
        // Retornar usuário sem senha
        const safeUser = {
            id: users[userIndex].id,
            username: users[userIndex].username,
            role: users[userIndex].role,
            createdAt: users[userIndex].createdAt
        };
        
        res.json({ message: 'Usuário atualizado com sucesso', user: safeUser });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.delete('/users/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        
        const userIndex = users.findIndex(u => u.id == id);
        
        if (userIndex === -1) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Não permitir excluir o último admin
        if (users[userIndex].role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Não é possível excluir o último administrador' });
            }
        }
        
        const deletedUser = users.splice(userIndex, 1)[0];
        console.log(`Usuário excluído: ${deletedUser.username}`);
        
        res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/qr', (req, res) => {
    res.json({ qr: latestQr });
});

app.get('/status', async (req, res) => {
    try {
        // Verifica se o cliente está realmente conectado
        if (isClientReady && client.info) {
            // Tenta obter informações do cliente para confirmar a conexão
            const clientState = await client.getState();
            if (clientState === 'CONNECTED') {
                res.json({ 
                    ready: true,
                    message: 'WhatsApp conectado e pronto',
                    state: clientState
                });
            } else {
                isClientReady = false;
                res.json({ 
                    ready: false,
                    message: 'WhatsApp desconectado',
                    state: clientState
                });
            }
        } else {
            res.json({ 
                ready: false,
                message: isClientReady ? 'WhatsApp conectando...' : 'WhatsApp não conectado'
            });
        }
    } catch (error) {
        console.log('Erro ao verificar status:', error.message);
        isClientReady = false;
        res.json({ 
            ready: false,
            message: 'WhatsApp não conectado'
        });
    }
});

// Rota para obter todas as conversas
app.get('/conversations', authenticateToken, (req, res) => {
    // Filtrar conversas indesejadas
    const filteredConversations = Array.from(conversations.values()).filter(conv => {
        return !conv.id.includes('status@broadcast') && 
               !conv.id.includes('@broadcast') && 
               !conv.id.includes('@g.us');
    });
    
    const conversationsList = filteredConversations.map(conv => ({
        ...conv,
        messages: undefined // Não enviar mensagens na lista
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(conversationsList);
});

// Rota para limpar conversas indesejadas
app.post('/conversations/clean', (req, res) => {
    // Remover conversas de status e broadcast
    for (let [key, value] of conversations.entries()) {
        if (key.includes('status@broadcast') || 
            key.includes('@broadcast') || 
            key.includes('@g.us')) {
            conversations.delete(key);
        }
    }
    
    // Filtrar mensagens do array global
    allMessages = allMessages.filter(msg => 
        !msg.from.includes('status@broadcast') && 
        !msg.from.includes('@broadcast') && 
        !msg.from.includes('@g.us')
    );
    
    res.json({ message: 'Conversas limpas com sucesso' });
});

// Rotas para configurações
app.get('/config', authenticateToken, (req, res) => {
    try {
        res.json(systemConfig);
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/config', authenticateToken, (req, res) => {
    try {
        console.log('Dados recebidos:', req.body);
        
        const { autoReply, businessHours, startTime, endTime, welcomeMessage } = req.body;
        
        if (autoReply !== undefined) systemConfig.autoReply = autoReply;
        if (businessHours !== undefined) systemConfig.businessHours = businessHours;
        if (startTime) systemConfig.startTime = startTime;
        if (endTime) systemConfig.endTime = endTime;
        if (welcomeMessage) systemConfig.welcomeMessage = welcomeMessage;
        
        console.log('Configurações atualizadas:', systemConfig);
        res.json({ message: 'Configurações salvas com sucesso', config: systemConfig });
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
});

// Rota para adicionar comando personalizado
app.post('/config/commands', (req, res) => {
    try {
        const { trigger, response } = req.body;
        
        if (!trigger || !response) {
            return res.status(400).json({ error: 'Trigger e response são obrigatórios' });
        }
        
        const newCommand = {
            id: Date.now(),
            trigger: trigger.toLowerCase(),
            response
        };
        
        systemConfig.customCommands.push(newCommand);
        res.json({ message: 'Comando adicionado com sucesso', command: newCommand });
    } catch (error) {
        console.error('Erro ao adicionar comando:', error);
        res.status(500).json({ error: 'Erro ao adicionar comando' });
    }
});

// Rota para remover comando personalizado
app.delete('/config/commands/:id', (req, res) => {
    try {
        const { id } = req.params;
        const commandIndex = systemConfig.customCommands.findIndex(cmd => cmd.id == id);
        
        if (commandIndex === -1) {
            return res.status(404).json({ error: 'Comando não encontrado' });
        }
        
        systemConfig.customCommands.splice(commandIndex, 1);
        res.json({ message: 'Comando removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover comando:', error);
        res.status(500).json({ error: 'Erro ao remover comando' });
    }
});

// Rota para obter mensagens de uma conversa específica
app.get('/conversations/:contactId/messages', authenticateToken, (req, res) => {
    try {
        const { contactId } = req.params;
        console.log('Buscando mensagens para conversa:', contactId);
        
        const conversation = conversations.get(contactId);
        
        if (!conversation) {
            console.log('Conversa não encontrada:', contactId);
            return res.status(404).json({ error: 'Conversa não encontrada' });
        }
        
        // Marcar como lida
        conversation.unread = 0;
        
        console.log(`Retornando ${conversation.messages.length} mensagens para ${contactId}`);
        
        res.json({
            conversation: {
                id: conversation.id,
                contact: conversation.contact,
                name: conversation.name
            },
            messages: conversation.messages || []
        });
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens' });
    }
});

// Rota para enviar mensagem
app.post('/conversations/:contactId/send', authenticateToken, async (req, res) => {
    try {
        const { contactId } = req.params;
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        
        if (!isClientReady) {
            return res.status(503).json({ error: 'WhatsApp não está conectado' });
        }
        
        // Enviar mensagem
        await client.sendMessage(contactId, message);
        
        // Armazenar mensagem enviada
        const messageData = {
            id: Date.now() + Math.random(),
            from: 'bot',
            body: message,
            timestamp: new Date(),
            type: 'sent'
        };
        
        allMessages.push(messageData);
        
        // Atualizar conversa
        if (conversations.has(contactId)) {
            const conversation = conversations.get(contactId);
            conversation.messages.push(messageData);
            conversation.lastMessage = message;
            conversation.timestamp = new Date();
            
            console.log('Conversa atualizada com nova mensagem manual');
        }
        
        res.json({ message: 'Mensagem enviada com sucesso' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// ========== ROTAS DOS GRUPOS ==========

// Listar todos os grupos disponíveis para o usuário
app.get('/groups', authenticateToken, (req, res) => {
    try {
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        // Filtrar grupos que o usuário pode ver
        const userGroups = groups.filter(group => {
            // Grupo geral todos podem ver
            if (group.type === 'general') return true;
            
            // Grupos por departamento - apenas users do mesmo departamento
            if (group.type === 'department') {
                return user && user.department === group.department;
            }
            
            // Grupos customizados - apenas membros, criador ou admins
            if (group.type === 'custom') {
                return group.members.length === 0 || 
                       group.members.includes(username) || 
                       group.createdBy === username ||
                       (user && user.role === 'admin');
            }
            
            return false;
        });
        
        res.json(userGroups);
    } catch (error) {
        console.error('Erro ao buscar grupos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar novo grupo
app.post('/groups', authenticateToken, (req, res) => {
    try {
        const { name, description, type, members, department } = req.body;
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
        }
        
        // Verificar se já existe grupo com o mesmo nome
        if (groups.find(g => g.name.toLowerCase() === name.toLowerCase())) {
            return res.status(400).json({ error: 'Já existe um grupo com este nome' });
        }
        
        const newGroup = {
            id: nextGroupId++,
            name: name.trim(),
            description: description || '',
            type: type || 'custom',
            members: type === 'custom' ? [username] : (members || []), // Creator is automatically a member
            department: department || '',
            createdBy: username,
            createdAt: new Date(),
            isDefault: false
        };
        
        groups.push(newGroup);
        
        console.log(`Novo grupo criado: ${name} por ${username}`);
        
        res.json({ 
            message: 'Grupo criado com sucesso',
            group: newGroup
        });
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Buscar mensagens de um grupo específico
app.get('/groups/:groupId/messages', authenticateToken, (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const username = req.headers['x-username'] || '';
        
        // Verificar se o grupo existe
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }
        
        // Verificar se o usuário pode acessar este grupo
        const user = users.find(u => u.username === username);
        const canAccess = 
            group.type === 'general' || 
            (group.type === 'department' && user && user.department === group.department) ||
            (group.type === 'custom' && (group.members.length === 0 || 
                                        group.members.includes(username) || 
                                        group.createdBy === username ||
                                        (user && user.role === 'admin')));
            
        if (!canAccess) {
            return res.status(403).json({ error: 'Acesso negado a este grupo' });
        }
        
        // Se for o grupo geral (id=1), retornar mensagens do chat interno para compatibilidade
        if (groupId === 1) {
            return res.json(internalMessages);
        }
        
        // Filtrar mensagens do grupo
        const messages = groupMessages.filter(msg => msg.groupId === groupId);
        
        res.json(messages);
    } catch (error) {
        console.error('Erro ao buscar mensagens do grupo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Enviar mensagem para um grupo
app.post('/groups/:groupId/messages', authenticateToken, (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const { message } = req.body;
        const username = req.headers['x-username'] || '';
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        
        // Verificar se o grupo existe
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }
        
        // Verificar se o usuário pode enviar mensagens neste grupo
        const user = users.find(u => u.username === username);
        const canSend = 
            group.type === 'general' || 
            (group.type === 'department' && user && user.department === group.department) ||
            (group.type === 'custom' && (group.members.length === 0 || 
                                        group.members.includes(username) || 
                                        group.createdBy === username ||
                                        (user && user.role === 'admin')));
            
        if (!canSend) {
            return res.status(403).json({ error: 'Você não pode enviar mensagens neste grupo' });
        }
        
        // Se for o grupo geral (id=1), usar o sistema antigo para compatibilidade
        if (groupId === 1) {
            const newMessage = {
                id: nextInternalMessageId++,
                message: message.trim(),
                username: username,
                userRole: user ? user.role : 'user',
                department: user ? user.department : 'N/A',
                timestamp: new Date(),
                createdAt: new Date()
            };

            internalMessages.push(newMessage);
            
            console.log(`Nova mensagem no grupo geral de ${username}: ${message}`);
            
            return res.json({ 
                message: 'Mensagem enviada com sucesso',
                data: newMessage
            });
        }
        
        // Criar nova mensagem para o grupo
        const newMessage = {
            id: nextGroupMessageId++,
            groupId: groupId,
            message: message.trim(),
            username: username,
            userRole: user ? user.role : 'user',
            department: user ? user.department : 'N/A',
            timestamp: new Date(),
            createdAt: new Date()
        };

        groupMessages.push(newMessage);
        
        console.log(`Nova mensagem no grupo ${group.name} de ${username}: ${message}`);
        
        res.json({ 
            message: 'Mensagem enviada com sucesso',
            data: newMessage
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem no grupo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter membros de um grupo
app.get('/groups/:groupId/members', authenticateToken, (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const username = req.headers['x-username'] || '';
        
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }
        
        // Verificar se o usuário pode ver os membros deste grupo
        const user = users.find(u => u.username === username);
        const canAccess = 
            group.type === 'general' || 
            (group.type === 'department' && user && user.department === group.department) ||
            (group.type === 'custom' && (group.members.length === 0 || 
                                        group.members.includes(username) || 
                                        group.createdBy === username ||
                                        (user && user.role === 'admin')));
            
        if (!canAccess) {
            return res.status(403).json({ error: 'Acesso negado a este grupo' });
        }
        
        // Para grupo geral, retornar todos os usuários
        if (group.type === 'general') {
            const allUsers = users.map(u => ({
                username: u.username,
                role: u.role,
                department: u.department
            }));
            return res.json({ members: allUsers, totalMembers: allUsers.length });
        }
        
        // Para grupos por departamento, retornar usuários do departamento
        if (group.type === 'department') {
            const departmentUsers = users
                .filter(u => u.department === group.department)
                .map(u => ({
                    username: u.username,
                    role: u.role,
                    department: u.department
                }));
            return res.json({ members: departmentUsers, totalMembers: departmentUsers.length });
        }
        
        // Para grupos customizados
        if (group.members.length === 0) {
            // Se não há membros específicos, todos podem participar
            const allUsers = users.map(u => ({
                username: u.username,
                role: u.role,
                department: u.department
            }));
            return res.json({ members: allUsers, totalMembers: allUsers.length });
        } else {
            // Retornar apenas os membros específicos
            const groupMembers = users
                .filter(u => group.members.includes(u.username))
                .map(u => ({
                    username: u.username,
                    role: u.role,
                    department: u.department
                }));
            return res.json({ members: groupMembers, totalMembers: groupMembers.length });
        }
    } catch (error) {
        console.error('Erro ao buscar membros do grupo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Adicionar membro a um grupo customizado
app.post('/groups/:groupId/members', authenticateToken, (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const { username: memberUsername } = req.body;
        const username = req.headers['x-username'] || '';
        
        if (!memberUsername || !memberUsername.trim()) {
            return res.status(400).json({ error: 'Username do membro é obrigatório' });
        }
        
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }
        
        // Apenas grupos customizados permitem gerenciamento de membros
        if (group.type !== 'custom') {
            return res.status(400).json({ error: 'Apenas grupos customizados permitem gerenciamento de membros' });
        }
        
        // Verificar se o usuário pode gerenciar membros (criador ou admin)
        const user = users.find(u => u.username === username);
        if (group.createdBy !== username && (!user || user.role !== 'admin')) {
            return res.status(403).json({ error: 'Apenas o criador ou administradores podem gerenciar membros' });
        }
        
        // Verificar se o usuário a ser adicionado existe
        const memberUser = users.find(u => u.username === memberUsername.trim());
        if (!memberUser) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        
        // Verificar se o usuário já é membro
        if (group.members.includes(memberUsername.trim())) {
            return res.status(400).json({ error: 'Usuário já é membro do grupo' });
        }
        
        // Adicionar membro
        group.members.push(memberUsername.trim());
        
        console.log(`Usuário ${memberUsername} adicionado ao grupo ${group.name} por ${username}`);
        
        res.json({ 
            message: 'Membro adicionado com sucesso',
            member: {
                username: memberUser.username,
                role: memberUser.role,
                department: memberUser.department
            }
        });
    } catch (error) {
        console.error('Erro ao adicionar membro ao grupo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Remover membro de um grupo customizado
app.delete('/groups/:groupId/members/:memberUsername', authenticateToken, (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const memberUsername = req.params.memberUsername;
        const username = req.headers['x-username'] || '';
        
        const group = groups.find(g => g.id === groupId);
        if (!group) {
            return res.status(404).json({ error: 'Grupo não encontrado' });
        }
        
        // Apenas grupos customizados permitem gerenciamento de membros
        if (group.type !== 'custom') {
            return res.status(400).json({ error: 'Apenas grupos customizados permitem gerenciamento de membros' });
        }
        
        // Verificar se o usuário pode gerenciar membros (criador ou admin)
        const user = users.find(u => u.username === username);
        if (group.createdBy !== username && (!user || user.role !== 'admin')) {
            return res.status(403).json({ error: 'Apenas o criador ou administradores podem gerenciar membros' });
        }
        
        // Verificar se o usuário é membro
        const memberIndex = group.members.indexOf(memberUsername);
        if (memberIndex === -1) {
            return res.status(404).json({ error: 'Usuário não é membro do grupo' });
        }
        
        // Não permitir remover o criador do grupo
        if (memberUsername === group.createdBy) {
            return res.status(400).json({ error: 'Não é possível remover o criador do grupo' });
        }
        
        // Remover membro
        group.members.splice(memberIndex, 1);
        
        console.log(`Usuário ${memberUsername} removido do grupo ${group.name} por ${username}`);
        
        res.json({ message: 'Membro removido com sucesso' });
    } catch (error) {
        console.error('Erro ao remover membro do grupo:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter lista de usuários disponíveis para adicionar em grupos
app.get('/users/available', authenticateToken, (req, res) => {
    try {
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        // Apenas admins ou usuários autenticados podem ver a lista
        if (!user) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        
        const availableUsers = users.map(u => ({
            username: u.username,
            role: u.role,
            department: u.department
        }));
        
        res.json(availableUsers);
    } catch (error) {
        console.error('Erro ao buscar usuários disponíveis:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========== FIM DAS ROTAS DOS GRUPOS ==========

// ========== ROTAS DO CHAT INTERNO ==========

// Obter todas as mensagens do chat interno
app.get('/internal-chat/messages', authenticateToken, (req, res) => {
    try {
        res.json(internalMessages);
    } catch (error) {
        console.error('Erro ao buscar mensagens do chat interno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Enviar mensagem no chat interno
app.post('/internal-chat/messages', authenticateToken, (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        // Buscar informações do usuário pelo token (simulação)
        // Em produção, extrair do JWT decodificado
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        // Por enquanto, vamos usar o username de um header adicional ou assumir um padrão
        // Vou implementar uma forma de identificar o usuário
        const username = req.headers['x-username'] || 'Usuário Anônimo';
        const user = users.find(u => u.username === username);
        
        const newMessage = {
            id: nextInternalMessageId++,
            message: message.trim(),
            username: username,
            userRole: user ? user.role : 'user',
            department: user ? user.department : 'N/A',
            timestamp: new Date(),
            createdAt: new Date()
        };

        internalMessages.push(newMessage);
        
        console.log(`Nova mensagem no chat interno de ${username}: ${message}`);
        
        res.json({ 
            message: 'Mensagem enviada com sucesso',
            data: newMessage
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem no chat interno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Limpar chat interno (apenas admins)
app.delete('/internal-chat/messages', authenticateToken, (req, res) => {
    try {
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Apenas administradores podem limpar o chat' });
        }
        
        internalMessages = [];
        nextInternalMessageId = 1;
        
        console.log(`Chat interno limpo por ${username}`);
        
        res.json({ message: 'Chat interno limpo com sucesso' });
    } catch (error) {
        console.error('Erro ao limpar chat interno:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========== FIM DAS ROTAS DO CHAT INTERNO ==========

// ========== ROTAS DOS CHATS PRIVADOS ==========

// Obter lista de usuários disponíveis para conversa privada
app.get('/private-chat/users', authenticateToken, (req, res) => {
    try {
        const currentUsername = req.headers['x-username'] || '';
        
        // Retornar todos os usuários exceto o atual
        const availableUsers = users
            .filter(u => u.username !== currentUsername)
            .map(u => ({
                id: u.id,
                username: u.username,
                role: u.role,
                department: u.department
            }));
        
        res.json(availableUsers);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter mensagens de uma conversa privada
app.get('/private-chat/messages/:targetUsername', authenticateToken, (req, res) => {
    try {
        const currentUsername = req.headers['x-username'] || '';
        const targetUsername = req.params.targetUsername;
        
        if (!currentUsername || !targetUsername) {
            return res.status(400).json({ error: 'Usuários são obrigatórios' });
        }
        
        // Criar chave única para a conversa (sempre ordenada alfabeticamente)
        const chatKey = [currentUsername, targetUsername].sort().join('-');
        
        // Obter mensagens da conversa
        const messages = privateChats.get(chatKey) || [];
        
        res.json(messages);
    } catch (error) {
        console.error('Erro ao buscar mensagens privadas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Enviar mensagem privada
app.post('/private-chat/messages/:targetUsername', authenticateToken, (req, res) => {
    try {
        const currentUsername = req.headers['x-username'] || '';
        const targetUsername = req.params.targetUsername;
        const { message } = req.body;
        
        if (!currentUsername || !targetUsername) {
            return res.status(400).json({ error: 'Usuários são obrigatórios' });
        }
        
        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }
        
        // Verificar se o usuário de destino existe
        const targetUser = users.find(u => u.username === targetUsername);
        if (!targetUser) {
            return res.status(404).json({ error: 'Usuário de destino não encontrado' });
        }
        
        const currentUser = users.find(u => u.username === currentUsername);
        
        // Criar chave única para a conversa (sempre ordenada alfabeticamente)
        const chatKey = [currentUsername, targetUsername].sort().join('-');
        
        // Inicializar conversa se não existir
        if (!privateChats.has(chatKey)) {
            privateChats.set(chatKey, []);
        }
        
        const newMessage = {
            id: nextPrivateMessageId++,
            message: message.trim(),
            fromUsername: currentUsername,
            fromRole: currentUser ? currentUser.role : 'user',
            fromDepartment: currentUser ? currentUser.department : 'N/A',
            toUsername: targetUsername,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        // Adicionar mensagem à conversa
        const chatMessages = privateChats.get(chatKey);
        chatMessages.push(newMessage);
        
        console.log(`Nova mensagem privada de ${currentUsername} para ${targetUsername}: ${message}`);
        
        res.json({ 
            message: 'Mensagem enviada com sucesso',
            data: newMessage
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem privada:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter lista de conversas privadas do usuário atual
app.get('/private-chat/conversations', authenticateToken, (req, res) => {
    try {
        const currentUsername = req.headers['x-username'] || '';
        
        if (!currentUsername) {
            return res.status(400).json({ error: 'Usuário é obrigatório' });
        }
        
        const conversations = [];
        
        // Percorrer todos os chats privados
        for (const [chatKey, messages] of privateChats.entries()) {
            // Verificar se o usuário atual faz parte desta conversa
            const participants = chatKey.split('-');
            if (participants.includes(currentUsername)) {
                // Encontrar o outro participante
                const otherUsername = participants.find(p => p !== currentUsername);
                const otherUser = users.find(u => u.username === otherUsername);
                
                // Obter a última mensagem
                const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
                
                conversations.push({
                    id: chatKey, // Adicionar id para compatibilidade
                    chatKey,
                    otherUser: {
                        username: otherUser ? otherUser.username : otherUsername,
                        role: otherUser ? otherUser.role : 'user',
                        department: otherUser ? otherUser.department : 'N/A'
                    },
                    lastMessage: lastMessage ? {
                        message: lastMessage.message,
                        fromUsername: lastMessage.fromUsername,
                        timestamp: lastMessage.timestamp
                    } : null,
                    messageCount: messages.length,
                    updatedAt: lastMessage ? lastMessage.timestamp : new Date()
                });
            }
        }
        
        // Ordenar por última atividade
        conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        res.json(conversations);
    } catch (error) {
        console.error('Erro ao buscar conversas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ========== FIM DAS ROTAS DOS CHATS PRIVADOS ==========

// ========== SISTEMA DE CHAMADOS ==========

// Array para armazenar chamados
let chamados = [];
let nextChamadoId = 1;

// Listar chamados
app.get('/chamados', authenticateToken, (req, res) => {
    try {
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        const { createdBy, assignedTo, status, priority, type } = req.query;
        
        let filteredChamados = [...chamados];
        
        // Aplicar filtros
        if (createdBy) {
            filteredChamados = filteredChamados.filter(c => c.createdBy === createdBy);
        }
        
        if (assignedTo) {
            filteredChamados = filteredChamados.filter(c => c.assignedTo === assignedTo);
        }
        
        if (status) {
            filteredChamados = filteredChamados.filter(c => c.status === status);
        }
        
        if (priority) {
            filteredChamados = filteredChamados.filter(c => c.priority === priority);
        }
        
        if (type) {
            filteredChamados = filteredChamados.filter(c => c.type === type);
        }
        
        // Se o usuário não é admin, só pode ver chamados criados por ele ou atribuídos a ele
        if (user && user.role !== 'admin') {
            filteredChamados = filteredChamados.filter(c => 
                c.createdBy === username || 
                c.assignedTo === username ||
                (c.type === 'department' && user.department && c.departmentName === user.department)
            );
        }
        
        // Adicionar informações extras
        const chamadosWithDetails = filteredChamados.map(chamado => {
            const dept = departments.find(d => d.id == chamado.departmentId);
            return {
                ...chamado,
                departmentName: dept ? dept.name : null
            };
        });
        
        // Ordenar por data de criação (mais recentes primeiro)
        chamadosWithDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json(chamadosWithDetails);
    } catch (error) {
        console.error('Erro ao buscar chamados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Criar novo chamado
app.post('/chamados', authenticateToken, (req, res) => {
    try {
        const { title, description, priority, type, assignedTo, departmentId } = req.body;
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        if (!title || !description) {
            return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
        }
        
        if (type === 'user' && !assignedTo) {
            return res.status(400).json({ error: 'Usuário é obrigatório quando o tipo é usuário' });
        }
        
        if (type === 'department' && !departmentId) {
            return res.status(400).json({ error: 'Departamento é obrigatório quando o tipo é departamento' });
        }
        
        // Verificar se o usuário atribuído existe
        if (type === 'user') {
            const assignedUser = users.find(u => u.username === assignedTo);
            if (!assignedUser) {
                return res.status(404).json({ error: 'Usuário atribuído não encontrado' });
            }
        }
        
        // Verificar se o departamento existe
        if (type === 'department') {
            const department = departments.find(d => d.id == departmentId);
            if (!department) {
                return res.status(404).json({ error: 'Departamento não encontrado' });
            }
        }
        
        const newChamado = {
            id: nextChamadoId++,
            title: title.trim(),
            description: description.trim(),
            priority: priority || 'medium',
            type: type || 'user',
            status: 'open',
            assignedTo: type === 'user' ? assignedTo : null,
            departmentId: type === 'department' ? departmentId : null,
            createdBy: username,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        chamados.push(newChamado);
        
        console.log(`Novo chamado criado por ${username}: ${title}`);
        
        res.json({ 
            message: 'Chamado criado com sucesso',
            chamado: newChamado
        });
    } catch (error) {
        console.error('Erro ao criar chamado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar status do chamado
app.put('/chamados/:id/status', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        const chamado = chamados.find(c => c.id.toString() === id);
        if (!chamado) {
            return res.status(404).json({ error: 'Chamado não encontrado' });
        }
        
        // Verificar permissão para atualizar o chamado
        const canUpdate = 
            chamado.createdBy === username ||
            chamado.assignedTo === username ||
            (user && user.role === 'admin') ||
            (chamado.type === 'department' && user && user.department && 
             departments.find(d => d.id == chamado.departmentId && d.name === user.department));
             
        if (!canUpdate) {
            return res.status(403).json({ error: 'Você não tem permissão para atualizar este chamado' });
        }
        
        // Validar status
        const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }
        
        chamado.status = status;
        chamado.updatedAt = new Date();
        
        console.log(`Status do chamado ${id} atualizado para ${status} por ${username}`);
        
        res.json({ 
            message: 'Status atualizado com sucesso',
            chamado
        });
    } catch (error) {
        console.error('Erro ao atualizar status do chamado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter detalhes de um chamado específico
app.get('/chamados/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        const chamado = chamados.find(c => c.id == id);
        if (!chamado) {
            return res.status(404).json({ error: 'Chamado não encontrado' });
        }
        
        // Verificar permissão para ver o chamado
        const canView = 
            chamado.createdBy === username ||
            chamado.assignedTo === username ||
            (user && user.role === 'admin') ||
            (chamado.type === 'department' && user && user.department && 
             departments.find(d => d.id == chamado.departmentId && d.name === user.department));
             
        if (!canView) {
            return res.status(403).json({ error: 'Você não tem permissão para ver este chamado' });
        }
        
        // Adicionar informações extras
        const dept = departments.find(d => d.id == chamado.departmentId);
        const chamadoWithDetails = {
            ...chamado,
            departmentName: dept ? dept.name : null
        };
        
        res.json(chamadoWithDetails);
    } catch (error) {
        console.error('Erro ao buscar chamado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar chamado completo
app.put('/chamados/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, assignedTo, departmentId } = req.body;
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        const chamado = chamados.find(c => c.id == id);
        if (!chamado) {
            return res.status(404).json({ error: 'Chamado não encontrado' });
        }
        
        // Verificar permissão para atualizar o chamado
        const canUpdate = 
            chamado.createdBy === username ||
            (user && user.role === 'admin');
             
        if (!canUpdate) {
            return res.status(403).json({ error: 'Você não tem permissão para editar este chamado' });
        }
        
        // Atualizar campos
        if (title) chamado.title = title.trim();
        if (description) chamado.description = description.trim();
        if (priority) chamado.priority = priority;
        if (assignedTo !== undefined) chamado.assignedTo = assignedTo;
        if (departmentId !== undefined) chamado.departmentId = departmentId;
        
        chamado.updatedAt = new Date();
        
        console.log(`Chamado ${id} atualizado por ${username}`);
        
        res.json({ 
            message: 'Chamado atualizado com sucesso',
            chamado
        });
    } catch (error) {
        console.error('Erro ao atualizar chamado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Excluir chamado
app.delete('/chamados/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        const chamadoIndex = chamados.findIndex(c => c.id == id);
        if (chamadoIndex === -1) {
            return res.status(404).json({ error: 'Chamado não encontrado' });
        }
        
        const chamado = chamados[chamadoIndex];
        
        // Verificar permissão para excluir o chamado
        const canDelete = 
            chamado.createdBy === username ||
            (user && user.role === 'admin');
             
        if (!canDelete) {
            return res.status(403).json({ error: 'Você não tem permissão para excluir este chamado' });
        }
        
        chamados.splice(chamadoIndex, 1);
        
        console.log(`Chamado ${id} excluído por ${username}`);
        
        res.json({ message: 'Chamado excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir chamado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Obter estatísticas dos chamados
app.get('/chamados/stats/summary', authenticateToken, (req, res) => {
    try {
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        let userChamados = [...chamados];
        
        // Se não é admin, filtrar apenas chamados do usuário
        if (user && user.role !== 'admin') {
            userChamados = chamados.filter(c => 
                c.createdBy === username || 
                c.assignedTo === username ||
                (c.type === 'department' && user.department && 
                 departments.find(d => d.id == c.departmentId && d.name === user.department))
            );
        }
        
        const stats = {
            total: userChamados.length,
            open: userChamados.filter(c => c.status === 'open').length,
            inProgress: userChamados.filter(c => c.status === 'in_progress').length,
            resolved: userChamados.filter(c => c.status === 'resolved').length,
            closed: userChamados.filter(c => c.status === 'closed').length,
            highPriority: userChamados.filter(c => c.priority === 'high').length,
            mediumPriority: userChamados.filter(c => c.priority === 'medium').length,
            lowPriority: userChamados.filter(c => c.priority === 'low').length,
            createdByMe: userChamados.filter(c => c.createdBy === username).length,
            assignedToMe: userChamados.filter(c => c.assignedTo === username).length
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Array para armazenar respostas dos chamados
let chamadoResponses = [];

// Rota para obter respostas de um chamado
app.get('/chamados/:id/responses', authenticateToken, (req, res) => {
    try {
        const chamadoId = req.params.id;
        const username = req.headers['x-username'] || '';
        const user = users.find(u => u.username === username);
        
        // Verificar se o chamado existe
        const chamado = chamados.find(c => c.id.toString() === chamadoId);
        if (!chamado) {
            return res.status(404).json({ error: 'Chamado não encontrado' });
        }
        
        // Verificar se o usuário tem permissão para ver as respostas
        if (user && user.role !== 'admin' && 
            chamado.createdBy !== username && 
            chamado.assignedTo !== username) {
            return res.status(403).json({ error: 'Acesso negado' });
        }
        
        // Buscar respostas do chamado
        const responses = chamadoResponses
            .filter(r => r.chamadoId === chamadoId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        res.json(responses);
    } catch (error) {
        console.error('Erro ao buscar respostas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Configurar multer para upload de arquivos

// Configurar storage do multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        // Criar diretório se não existir
        if (!require('fs').existsSync(uploadPath)) {
            require('fs').mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        // Permitir apenas certos tipos de arquivo
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

// Rota para adicionar resposta a um chamado
app.post('/chamados/:id/responses', authenticateToken, (req, res) => {
    console.log('Recebida requisição para adicionar resposta:', req.params.id);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Usar upload middleware aqui
    upload.array('files', 5)(req, res, (err) => {
        if (err) {
            console.error('Erro no upload:', err);
            return res.status(400).json({ error: 'Erro no upload: ' + err.message });
        }
        
        try {
            const chamadoId = req.params.id;
            const { response } = req.body;
            const username = req.headers['x-username'] || '';
            const user = users.find(u => u.username === username);
            
            console.log('Dados processados:', { chamadoId, response, username, files: req.files });
            
            // Verificar se o chamado existe
            const chamado = chamados.find(c => c.id.toString() === chamadoId);
            if (!chamado) {
                console.log('Chamado não encontrado. IDs disponíveis:', chamados.map(c => c.id));
                return res.status(404).json({ error: 'Chamado não encontrado' });
            }
            
            // Verificar se o usuário tem permissão para responder
            if (user && user.role !== 'admin' && 
                chamado.createdBy !== username && 
                chamado.assignedTo !== username) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            
            // Verificar se há conteúdo (resposta ou arquivos)
            if (!response && (!req.files || req.files.length === 0)) {
                return res.status(400).json({ error: 'Resposta ou arquivos são obrigatórios' });
            }
            
            // Processar arquivos enviados
            const files = req.files ? req.files.map(file => ({
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype
            })) : [];
            
            // Criar nova resposta
            const newResponse = {
                id: Date.now().toString(),
                chamadoId: chamadoId,
                username: username,
                response: response || '',
                files: files,
                createdAt: new Date().toISOString()
            };
            
            chamadoResponses.push(newResponse);
            
            console.log('Resposta criada:', newResponse);
            res.json({ message: 'Resposta adicionada com sucesso', response: newResponse });
        } catch (error) {
            console.error('Erro ao adicionar resposta:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    });
});

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ========== FIM DO SISTEMA DE CHAMADOS ==========

app.listen(8000, () => {
    console.log('Backend rodando na porta 8000');
    console.log('Aguardando conexão com WhatsApp...');
});