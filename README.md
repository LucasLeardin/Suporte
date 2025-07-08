# 🎧 WhatsApp Support System

Sistema completo de suporte ao cliente integrado com WhatsApp Web, desenvolvido em React e Node.js.

## 📋 Funcionalidades

### 🚀 Principais Features
- **💬 Integração WhatsApp Web** - Conexão real com WhatsApp
- **📱 Interface de Chat** - Interface similar ao WhatsApp Web
- **📊 Dashboard** - Métricas e estatísticas em tempo real
- **📝 Gerenciamento de Mensagens** - Visualização e resposta de conversas
- **⚙️ Configurações** - Personalização de respostas automáticas
- **📈 Analytics** - Relatórios detalhados de atendimento

### 🎯 Sistema de Suporte Completo
- Menu lateral com navegação intuitiva
- Status de conexão em tempo real
- Respostas automáticas personalizáveis
- Histórico completo de conversas
- Interface responsiva e profissional

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **whatsapp-web.js** - Integração com WhatsApp
- **CORS** - Controle de acesso

### Frontend
- **React** - Biblioteca para UI
- **qrcode.react** - Geração de QR Code
- **CSS-in-JS** - Estilização inline

## 📦 Estrutura do Projeto

```
my-chat/
├── src/                     # Frontend React
│   ├── SupportSystem.js     # Layout principal
│   ├── Sidebar.js          # Menu lateral
│   ├── QrCodeDisplay.js    # Conexão WhatsApp
│   ├── Dashboard.js        # Dashboard principal
│   ├── Messages.js         # Sistema de mensagens
│   ├── Config.js           # Configurações
│   ├── Analytics.js        # Relatórios
│   └── index.js           # Ponto de entrada
├── server/                 # Backend Node.js
│   ├── chatbot.js         # Servidor principal
│   └── package.json       # Dependências do servidor
├── public/                # Arquivos públicos
└── package.json          # Dependências do frontend
```

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js 16+ instalado
- NPM ou Yarn
- WhatsApp instalado no celular

### 2. Instalação

#### Backend (Servidor)
```bash
cd my-chat/server
npm install
npm start
```

#### Frontend (React)
```bash
cd my-chat
npm install
npm start
```

### 3. Configuração
1. Inicie o backend na porta 8000
2. Inicie o frontend na porta 3000
3. Acesse http://localhost:3000
4. Escaneie o QR Code com seu WhatsApp
5. Aguarde a conexão ser estabelecida

## 📱 Como Usar

### Conectar WhatsApp
1. Vá para a seção "WhatsApp" (primeiro ícone do menu)
2. Escaneie o QR Code com seu celular
3. Aguarde o status mudar para "Conectado"

### Gerenciar Mensagens
1. Acesse a seção "Mensagens"
2. Visualize todas as conversas ativas
3. Clique em uma conversa para ver as mensagens
4. Digite e envie respostas diretamente

### Configurar Respostas Automáticas
1. Vá para "Configurações"
2. Personalize mensagens automáticas
3. Configure horários de funcionamento
4. Adicione comandos personalizados

## 🤖 Comandos Automáticos Padrão

- **"oi"** → Saudação automática
- **"horário"** → Informa horário atual
- **"ajuda"** → Lista de comandos disponíveis
- **"tchau"** → Despedida automática

## 📊 API Endpoints

### WhatsApp
- `GET /qr` - Obtém QR Code para conexão
- `GET /status` - Verifica status da conexão

### Conversas
- `GET /conversations` - Lista todas as conversas
- `GET /conversations/:id/messages` - Mensagens de uma conversa
- `POST /conversations/:id/send` - Envia mensagem

## 🔧 Configuração Avançada

### Personalizar Respostas Automáticas
Edite o arquivo `server/chatbot.js` na seção de eventos de mensagem para adicionar novas respostas automáticas.

### Modificar Interface
Os componentes React estão na pasta `src/` e podem ser personalizados conforme necessário.

## 📝 Notas Importantes

- ⚠️ **Política do WhatsApp**: Use apenas para fins legítimos de suporte
- 🔒 **Segurança**: Não compartilhe QR Codes ou tokens
- 📱 **Limitações**: Baseado no WhatsApp Web (mesmas limitações)
- 🔄 **Sincronização**: Funciona enquanto o WhatsApp Web estiver ativo

## 🐛 Solução de Problemas

### Erro de Conexão
- Verifique se o servidor está rodando na porta 8000
- Certifique-se de que o WhatsApp está conectado à internet
- Reescaneie o QR Code se necessário

### Mensagens não aparecem
- Verifique se o WhatsApp Web está ativo
- Recarregue a página ou reinicie o servidor
- Verifique os logs do console

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🚀 Próximas Funcionalidades

- [ ] Integração com banco de dados
- [ ] Sistema de usuários múltiplos
- [ ] Backup automático de conversas
- [ ] Integração com CRM
- [ ] Chatbot com IA
- [ ] Métricas avançadas
- [ ] Notificações em tempo real

---

Desenvolvido com ❤️ para facilitar o atendimento ao cliente via WhatsApp.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
