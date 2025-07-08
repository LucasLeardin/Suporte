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
        const response = await fetch('http://localhost:8000/qr');
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
        const response = await fetch('http://localhost:8000/status');
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
        justifyContent: 'center',
        gap: '10px'
      };
    } else {
      return {
        padding: '15px',
        borderRadius: '10px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        color: '#721c24',
        margin: '20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
      };
    }
  };

  return (
    <div 
      style={{ 
        textAlign: 'center', 
        padding: '20px',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
        margin: 0
      }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>
        WhatsApp Chatbot
      </h1>
      
      {/* Status da Conexão */}
      <div style={getStatusStyle()}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: isConnected ? '#28a745' : '#dc3545'
        }}></div>
        <span style={{ fontWeight: 'bold' }}>
          {isConnected ? '✅ Conectado' : '⏳ Aguardando conexão'}
        </span>
        <span>- {status}</span>
      </div>

      {/* QR Code ou status de conexão */}
      {isConnected ? (
        <div style={{
          padding: '30px',
          backgroundColor: '#d4edda',
          borderRadius: '15px',
          border: '2px solid #28a745',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#28a745', margin: '0 0 20px 0' }}>
            🎉 WhatsApp Conectado com Sucesso!
          </h2>
          <p style={{ color: '#155724', fontSize: '18px', marginBottom: '15px' }}>
            Seu WhatsApp está conectado e funcionando corretamente.
          </p>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>
            Para configurar mensagens automáticas e comandos personalizados, acesse a seção <strong>Configurações</strong> no menu lateral.
          </p>
        </div>
      ) : (
        <>
          <h2 style={{ color: '#666', marginBottom: '20px' }}>
            Escaneie o QR Code para conectar o WhatsApp
          </h2>
          {qrCode ? (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '15px',
              border: '2px solid #007bff',
              display: 'inline-block'
            }}>
              <QRCodeCanvas value={qrCode} size={256} />
              <p style={{ 
                marginTop: '15px', 
                color: '#666',
                fontSize: '14px' 
              }}>
                Abra o WhatsApp → Menu → WhatsApp Web → Escanear código
              </p>
            </div>
          ) : (
            <p>Carregando QR Code...</p>
          )}
        </>
      )}
    </div>
  );
};

export default QrCodeDisplay;