import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QrCodeDisplay = () => {
  const [qrCode, setQrCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Iniciando...');

  useEffect(() => {
    // Busca o QR Code do backend
    const fetchQrCode = async () => {
      try {
        const response = await fetch('/api/qr');
        const data = await response.json();
        setQrCode(data.qr);
      } catch (error) {
        console.error('Erro ao buscar QR Code:', error);
        setStatus('Erro ao conectar com o servidor');
      }
    };

    // Verifica o status da conexão
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setIsConnected(data.ready);
        setStatus(data.message);
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setStatus('Erro ao conectar com o servidor');
        setIsConnected(false);
      }
    };

    // Busca inicial
    fetchQrCode();
    checkStatus();

    // Atualizar o QR Code e status periodicamente
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchQrCode();
      }
      checkStatus();
    }, 3000); // Verifica a cada 3 segundos

    return () => clearInterval(interval);
  }, [isConnected]);

  const getStatusStyle = () => {
    if (isConnected) {
      return {
        padding: '15px',
        borderRadius: '10px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        color: '#155724',
        margin: '20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      };
    } else {
      return {
        padding: '15px',
        borderRadius: '10px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeeba',
        color: '#856404',
        margin: '20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      };
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', background: 'white', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '40px 30px' }}>
      <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '30px' }}>WhatsApp Chatbot</h2>

      <div style={getStatusStyle()}>
        {isConnected ? '✅' : '⌛'}
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{status}</span>
      </div>

      {isConnected ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎉 WhatsApp Conectado com Sucesso!</div>
          <div style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
            Seu WhatsApp está conectado e funcionando corretamente.
          </div>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
            Você pode fechar esta tela ou navegar pelo sistema normalmente.
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '15px' }}>
            Escaneie o QR Code para conectar o WhatsApp
          </div>
          {qrCode ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <QRCodeCanvas value={qrCode} size={220} />
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                Abra o WhatsApp → Menu → WhatsApp Web → Escanear código
              </div>
            </div>
          ) : (
            <div style={{ color: '#e67e22', fontWeight: 'bold', fontSize: '16px' }}>
              Carregando QR Code...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QrCodeDisplay;
