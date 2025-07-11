import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Whatsapp from './modules/whatsapp';
import Chat from './modules/chat/Chat';
import MensagensWhatsapp from './modules/mensagens_whatsapp';
import Chamados from './modules/chamados';
import Ponto from './modules/ponto';
import Configuracoes from './modules/configuracoes';
import Usuarios from './modules/usuarios';

const AppRouter = ({ currentUser, onLogout }) => (
  <Router>
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar currentUser={currentUser} />
      <div style={{ flex: 1, background: '#ecf0f1', height: '100vh', overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/whatsapp" />} />
          <Route path="/whatsapp" element={<Whatsapp />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mensagens_whatsapp" element={<MensagensWhatsapp />} />
          <Route path="/chamados" element={<Chamados />} />
          <Route path="/ponto" element={<Ponto currentUser={currentUser} />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/usuarios" element={<Usuarios />} />
        </Routes>
      </div>
    </div>
  </Router>
);

export default AppRouter;
