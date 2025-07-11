import React, { useState, useEffect, useRef, useCallback } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import { createPortal } from 'react-dom';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasScrolledManually, setHasScrolledManually] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Função para forçar as cores verdes em elementos específicos
  const forceGreenColors = useCallback(() => {
    // Forçar cor do botão de scroll
    const scrollButton = document.querySelector('.scroll-button');
    if (scrollButton) {
      scrollButton.style.background = 'linear-gradient(135deg, #00b894, #00a085)';
      scrollButton.style.color = 'white';
    }

    // Forçar cores dos avatares
    const avatars = document.querySelectorAll('[style*="backgroundColor"]');
    avatars.forEach(avatar => {
      if (avatar.style.backgroundColor.includes('rgb(116, 185, 255)') || 
          avatar.style.backgroundColor === '' || 
          avatar.style.backgroundColor === 'white') {
        avatar.style.backgroundColor = '#00b894';
        avatar.style.color = 'white';
      }
    });

    // Forçar cores dos gradientes
    const gradientElements = document.querySelectorAll('[style*="linear-gradient"]');
    gradientElements.forEach(element => {
      if (element.style.background.includes('74b9ff') || 
          element.style.background.includes('0984e3')) {
        element.style.background = 'linear-gradient(135deg, #00b894, #00a085)';
      }
    });
  }, []);

  // Função para rolar para o final das mensagens
  const scrollToBottom = useCallback((force = false) => {
    console.log('scrollToBottom chamada - Messages', { force, hasScrolledManually });
    
    // Só rola automaticamente se for forçado ou se for a primeira vez
    if (!force && hasScrolledManually) {
      console.log('Usuário já rolou manualmente, não fazendo scroll automático');
      return;
    }
    
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      console.log('Container encontrado, scrollHeight:', container.scrollHeight);
      
      // Aguardar um momento para garantir que o DOM foi atualizado
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
        console.log('Scroll aplicado para:', container.scrollHeight);
        
        // Marcar que não é mais a primeira vez
        if (isFirstLoad) {
          setIsFirstLoad(false);
        }
      }, 50);
    }
  }, [hasScrolledManually, isFirstLoad]);

  // Função para verificar se está no final da conversa
  const checkIfAtBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px de tolerância
      setShowScrollButton(!isAtBottom && messages.length > 0);
    }
  }, [messages.length]);

  // Função para lidar com o scroll
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;
      
      // Se o usuário rolou para cima manualmente, marcar como scrolled manually
      if (!isAtBottom && !isFirstLoad) {
        setHasScrolledManually(true);
      }
      
      // Se voltou para o final, resetar o controle manual
      if (isAtBottom) {
        setHasScrolledManually(false);
      }
      
      setShowScrollButton(!isAtBottom && messages.length > 0);
    }
    
    checkIfAtBottom();
  };

  // Buscar conversas
  const fetchConversations = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/conversations');
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
    }
  };

  // Buscar mensagens de uma conversa
  const fetchMessages = useCallback(async (contactId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await authenticatedFetch(`http://localhost:8000/conversations/${contactId}/messages`);
      const data = await response.json();
      
      if (response.ok) {
        // Verificar se há novas mensagens antes de atualizar
        const currentMessageCount = messages.length;
        const newMessageCount = data.messages.length;
        
        setMessages(data.messages);
        setSelectedConversation(data.conversation);
        
        // Resetar controles quando uma nova conversa é selecionada
        if (!silent) {
          setHasScrolledManually(false);
          setIsFirstLoad(true);
        }
        
        // Log para debug
        if (silent && newMessageCount > currentMessageCount) {
          console.log(`Nova mensagem detectada: ${newMessageCount - currentMessageCount} mensagens`);
        }
        
        // Atualizar também a conversa na lista se necessário
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === contactId ? { ...conv, unread: 0 } : conv
          )
        );
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [messages.length]); // Adicionar dependência

  // Enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const response = await authenticatedFetch(`http://localhost:8000/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        body: JSON.stringify({ message: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        // Recarregar mensagens
        await fetchMessages(selectedConversation.id);
        // Recarregar lista de conversas
        fetchConversations();
        // Scroll para o final após enviar (sempre forçar)
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        const error = await response.json();
        alert('Erro ao enviar mensagem: ' + error.error);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Função para enviar imagem
  const sendImage = async (file) => {
    if (!selectedConversation || sending) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'image');

      const response = await authenticatedFetch(`http://localhost:8000/conversations/${selectedConversation.id}/send-image`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Recarregar mensagens
        await fetchMessages(selectedConversation.id);
        // Recarregar lista de conversas
        fetchConversations();
        // Scroll para o final após enviar
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        const error = await response.json();
        alert('Erro ao enviar imagem: ' + error.error);
      }
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      alert('Erro ao enviar imagem');
    } finally {
      setSending(false);
    }
  };

  // Função para enviar áudio
  const sendAudio = async (audioBlob) => {
    if (!selectedConversation || sending) return;

    try {
      setSending(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('type', 'audio');

      const response = await authenticatedFetch(`http://localhost:8000/conversations/${selectedConversation.id}/send-audio`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setAudioBlob(null); // Limpar o áudio após enviar
        // Recarregar mensagens
        await fetchMessages(selectedConversation.id);
        // Recarregar lista de conversas
        fetchConversations();
        // Scroll para o final após enviar
        setTimeout(() => scrollToBottom(true), 100);
      } else {
        const error = await response.json();
        alert('Erro ao enviar áudio: ' + error.error);
      }
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
      alert('Erro ao enviar áudio');
    } finally {
      setSending(false);
    }
  };

  // Função para iniciar gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  };

  // Função para parar gravação
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Função para reproduzir áudio
  const playAudio = (audioUrl, messageId) => {
    const audio = new Audio(audioUrl);
    setPlayingAudio(messageId);
    
    audio.onended = () => {
      setPlayingAudio(null);
    };
    
    audio.play();
  };

  // Função para abrir seletor de arquivo
  const openFileSelector = () => {
    fileInputRef.current?.click();
    setShowAttachmentMenu(false);
  };

  // Função para lidar com seleção de arquivo
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        sendImage(file);
      } else {
        alert('Apenas imagens são suportadas no momento.');
      }
    }
  };

  useEffect(() => {
    // Fechar menu de anexos quando clicar fora
    const handleClickOutside = (event) => {
      if (showAttachmentMenu && !event.target.closest('.attachment-menu') && !event.target.closest('.attachment-button')) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showAttachmentMenu]);

  // Effect para fechar modal com ESC e forçar z-index máximo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Força z-index máximo para o modal e reseta todos os outros
      setTimeout(() => {
        // Reduzir z-index de todos os elementos
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.zIndex !== 'auto' && computedStyle.zIndex !== '2147483647') {
            el.style.zIndex = '1';
          }
        });
        
        // Garantir que o modal tenha o maior z-index
        const modals = document.querySelectorAll('[data-modal="image-modal"]');
        modals.forEach(modal => {
          modal.style.zIndex = '2147483647';
          modal.style.position = 'fixed';
        });
      }, 10);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      
      // Restaurar z-index quando modal fechar
      if (!selectedImage) {
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.style.zIndex === '1') {
            el.style.zIndex = '';
          }
        });
      }
    };
  }, [selectedImage]);

  useEffect(() => {
    fetchConversations();
    // Atualizar conversas a cada 3 segundos
    const conversationsInterval = setInterval(fetchConversations, 3000);
    
    // Forçar cores verdes a cada 2 segundos para evitar que fiquem brancas
    const colorInterval = setInterval(forceGreenColors, 2000);
    
    return () => {
      clearInterval(conversationsInterval);
      clearInterval(colorInterval);
    };
  }, [forceGreenColors]);

  // Atualizar mensagens da conversa selecionada automaticamente
  useEffect(() => {
    let messagesInterval;
    
    if (selectedConversation) {
      console.log('Iniciando atualização automática para conversa:', selectedConversation.id);
      
      // Atualizar mensagens da conversa selecionada a cada 2 segundos (silencioso)
      messagesInterval = setInterval(() => {
        console.log('Atualizando mensagens automaticamente...');
        fetchMessages(selectedConversation.id, true); // true = silent mode
      }, 2000);
    }
    
    return () => {
      if (messagesInterval) {
        console.log('Parando atualização automática');
        clearInterval(messagesInterval);
      }
    };
  }, [selectedConversation, fetchMessages]); // Incluir selectedConversation completo

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    // Só rola automaticamente se for a primeira vez ou não tiver rolado manualmente
    if (isFirstLoad || !hasScrolledManually) {
      scrollToBottom();
    }
    
    // Verificar se precisa mostrar o botão de scroll após um pequeno delay
    setTimeout(checkIfAtBottom, 100);
    
    // Forçar cores verdes após cada atualização de mensagens
    setTimeout(forceGreenColors, 200);
  }, [messages, isFirstLoad, hasScrolledManually, forceGreenColors, checkIfAtBottom, scrollToBottom]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="whatsapp-container" style={{ 
      padding: '0',
      margin: '0', // REMOVER QUALQUER MARGEM
      height: '100vh',
      width: '100vw', // GARANTIR LARGURA TOTAL
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#ffffff',
      position: 'relative' // GARANTIR CONTEXTO
    }}>
      {/* CSS Moderno e Atrativo */}
      <style>
        {`
          /* REMOVER MARGENS ESPECÍFICAS DO COMPONENTE */
          .whatsapp-container {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          
          .whatsapp-container * {
            box-sizing: border-box !important;
          }
          
          /* CSS para barra de scroll SEMPRE VISÍVEL */
          .whatsapp-messages-area {
            scrollbar-width: auto !important; /* Firefox */
            -ms-overflow-style: scrollbar !important; /* Internet Explorer */
          }
          
          .whatsapp-messages-area::-webkit-scrollbar {
            width: 12px !important;
            display: block !important;
          }
          
          .whatsapp-messages-area::-webkit-scrollbar-track {
            background: #f1f3f4 !important;
            border-radius: 8px !important;
            display: block !important;
          }
          
          .whatsapp-messages-area::-webkit-scrollbar-thumb {
            background: linear-gradient(145deg, #00b894, #00a085) !important;
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
            display: block !important;
            min-height: 20px !important;
          }
          
          .whatsapp-messages-area::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(145deg, #00a085, #008f72) !important;
          }

          /* Animações suaves */
          @keyframes messageSlideIn {
            0% { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes buttonPulse {
            0% { 
              transform: scale(1);
              box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 6px 20px rgba(0, 184, 148, 0.5);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 4px 12px rgba(0, 184, 148, 0.3);
            }
          }
          
          .message-item {
            animation: messageSlideIn 0.4s ease-out;
          }
          
          .scroll-button {
            animation: buttonPulse 2s ease-in-out infinite;
            background: linear-gradient(135deg, #00b894, #00a085) !important;
            color: white !important;
          }

          /* Hover effects bonitos */
          .conversation-item {
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .conversation-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 15px rgba(0, 184, 148, 0.2);
            background-color: rgba(0, 184, 148, 0.08) !important;
          }
          
          .conversation-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(45deg, #00b894, #00a085);
            transform: scaleY(0);
            transition: transform 0.3s ease;
          }
          
          .conversation-item:hover::before {
            transform: scaleY(1);
          }

          .conversation-item-real {
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .conversation-item-real:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 15px rgba(0, 184, 148, 0.2);
          }
          
          .conversation-item-real::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(45deg, #00b894, #00a085);
            transform: scaleY(0);
            transition: transform 0.3s ease;
          }
          
          .conversation-item-real:hover::before {
            transform: scaleY(1);
          }

          /* Background gradiente suave */
          .whatsapp-bg {
            background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
          }
          
          .chat-container {
            background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
          }

          /* Animação de pulse para indicadores online */
          @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
          }

          /* Efeitos de hover para avatares */
          .avatar-hover {
            transition: all 0.3s ease;
          }
          
          .avatar-hover:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(0, 184, 148, 0.4);
          }

          /* Efeitos suaves para botões */
          .button-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .button-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 184, 148, 0.4);
          }

          /* Efeitos para campos de input */
          .input-hover {
            transition: all 0.3s ease;
          }
          
          .input-hover:focus {
            transform: translateY(-1px);
            box-shadow: 0 4px 20px rgba(0, 184, 148, 0.2) !important;
          }

          /* Estilos para mensagens de mídia */
          .media-message {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            background: #f8f9fa;
            border: 1px solid rgba(0,0,0,0.1);
          }

          .media-message img {
            width: 100%;
            height: auto;
            max-width: 300px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.3s ease;
          }

          .media-message img:hover {
            transform: scale(1.02);
          }

          .audio-player {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(0, 184, 148, 0.1);
            border-radius: 20px;
            min-width: 200px;
          }

          .audio-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00b894, #00a085);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: all 0.3s ease;
          }

          .audio-button:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 184, 148, 0.4);
          }

          .audio-progress {
            flex: 1;
            height: 4px;
            background: rgba(0, 184, 148, 0.2);
            border-radius: 2px;
            overflow: hidden;
          }

          .audio-progress-bar {
            height: 100%;
            background: linear-gradient(135deg, #00b894, #00a085);
            border-radius: 2px;
            transition: width 0.3s ease;
          }

          /* Botões de anexo */
          .attachment-button {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00b894, #00a085);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: all 0.3s ease;
            margin-right: 10px;
          }

          .attachment-button:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(0, 184, 148, 0.4);
          }

          .attachment-menu {
            position: fixed;
            bottom: 60px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            z-index: 2147483646;
            isolation: isolate;
            transform: translateZ(0);
          }

          /* Garantir que o menu de anexo fique sempre visível */
          .attachment-menu {
            position: fixed !important;
            z-index: 2147483646 !important;
            isolation: isolate !important;
            transform: translateZ(0) !important;
          }

          .attachment-option {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
            color: #2c3e50;
          }

          .attachment-option:hover {
            background: rgba(0, 184, 148, 0.1);
            transform: translateX(5px);
          }

          .attachment-option span:first-child {
            font-size: 18px;
            width: 24px;
            text-align: center;
          }

          /* Modal de visualização de imagem */
          .image-modal {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0,0,0,0.9) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            cursor: pointer !important;
            backdrop-filter: blur(5px) !important;
          }

          .image-modal img {
            max-width: 90% !important;
            max-height: 90% !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.5) !important;
            z-index: 1000000 !important;
            transition: transform 0.3s ease !important;
            cursor: default !important;
          }

          .image-modal img:hover {
            transform: scale(1.02) !important;
          }

          .image-modal-close {
            position: absolute !important;
            top: 20px !important;
            right: 20px !important;
            background: rgba(255,255,255,0.2) !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            width: 40px !important;
            height: 40px !important;
            cursor: pointer !important;
            font-size: 20px !important;
            backdrop-filter: blur(10px) !important;
            z-index: 1000001 !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .image-modal-close:hover {
            background: rgba(255,255,255,0.3) !important;
            transform: scale(1.1) !important;
          }

          /* Indicadores de gravação */
          .recording-indicator {
            position: absolute !important;
            z-index: 2147483645 !important;
            top: -50px !important;
            left: 0 !important;
            right: 0 !important;
            pointer-events: auto !important;
            isolation: isolate !important;
            transform: translateZ(0) !important;
          }

          .audio-preview {
            position: absolute !important;
            z-index: 2147483645 !important;
            top: -60px !important;
            left: 0 !important;
            right: 0 !important;
            pointer-events: auto !important;
            isolation: isolate !important;
            transform: translateZ(0) !important;
          }

          /* Garantir que o modal sempre fique acima */
          .modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 10000 !important;
            pointer-events: auto !important;
          }

          /* Animações para o modal */
          @keyframes modalFadeIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .modal-content {
            animation: modalFadeIn 0.3s ease-out;
          }

          /* Animação para o modal de imagem */
          @keyframes imageModalFadeIn {
            from {
              opacity: 0;
              backdrop-filter: blur(0px);
            }
            to {
              opacity: 1;
              backdrop-filter: blur(5px);
            }
          }

          .image-modal {
            animation: imageModalFadeIn 0.3s ease-out;
          }

          /* Garantir que o modal fique acima de tudo */
          .image-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 999999 !important;
            pointer-events: auto !important;
          }

          /* CSS específico para forçar modal acima de tudo */
          [data-modal="image-modal"] {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 2147483647 !important;
            background: rgba(0,0,0,0.9) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
            box-sizing: border-box !important;
          }

          /* Garantir que NADA fique acima do modal */
          body:has([data-modal="image-modal"]) * {
            z-index: auto !important;
          }

          body:has([data-modal="image-modal"]) [data-modal="image-modal"] {
            z-index: 2147483647 !important;
          }

          /* Exceção para o menu de anexo */
          body:has([data-modal="image-modal"]) .attachment-menu {
            z-index: 2147483646 !important;
          }
        `}
      </style>
      
      {/* Header Moderno */}
      <div style={{
        padding: '25px 30px',
        background: '#ffffff',
        color: '#2c3e50',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px' 
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'rgba(0, 184, 148, 0.1)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#00b894'
          }}>
            💬
          </div>
          <div>
            <h1 style={{ 
              color: '#2c3e50', 
              margin: 0, 
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}>
              Central de Mensagens WhatsApp
            </h1>
            <p style={{
              margin: 0,
              opacity: 0.7,
              fontSize: '14px',
              fontWeight: '400',
              color: '#7f8c8d'
            }}>
              Gerencie todas as suas conversas em um só lugar
            </p>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flex: 1,
        margin: '0', 
        padding: '0', 
        height: 'calc(100vh - 100px)', // Ajustado para compensar o header
        width: '100%', 
        overflow: 'hidden',
        background: '#ffffff'
      }}>
        {/* Lista de Conversas Moderna */}
        <div className="whatsapp-conversations-list" style={{
          width: '380px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '2px 0 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
          }}>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                color: '#2c3e50',
                fontWeight: '600'
              }}>
                Conversas
              </h3>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#7f8c8d'
              }}>
                {conversations.length} conversas ativas
              </p>
            </div>
          </div>

          {conversations.length === 0 ? (
            <>
              <div style={{
                padding: '30px',
                textAlign: 'center',
                color: '#95a5a6'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                <p>Nenhuma conversa ainda</p>
                <p style={{ fontSize: '14px' }}>
                  As conversas aparecerão aqui quando alguém enviar uma mensagem
                </p>
              </div>

            </>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => fetchMessages(conversation.id)}
                className="conversation-item-real"
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #ecf0f1',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?.id === conversation.id ? 'rgba(0, 184, 148, 0.1)' : 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation?.id !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 184, 148, 0.08)';
                    e.currentTarget.style.transform = 'translateX(5px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 184, 148, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?.id !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  {/* Avatar */}
                  <div className="avatar-hover" style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: '#00b894 !important',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white !important',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    {conversation.name.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '5px'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '15px',
                        color: '#2c3e50',
                        fontWeight: conversation.unread > 0 ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conversation.name}
                      </h4>
                      <span style={{
                        fontSize: '12px',
                        color: '#95a5a6'
                      }}>
                        {formatTime(conversation.timestamp)}
                      </span>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#7f8c8d',
                        fontWeight: conversation.unread > 0 ? 'bold' : 'normal',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px'
                      }}>
                        {conversation.lastMessage}
                      </p>
                      
                      {conversation.unread > 0 && (
                        <span style={{
                          backgroundColor: '#00b894',
                          color: 'white',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Área de Chat Moderna */}
        <div className="chat-area-wrapper" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {selectedConversation ? (
            <div className="chat-container" style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              overflow: 'hidden'
            }}>
              {/* Header do Chat Moderno */}
              <div style={{
                padding: '20px 25px',
                background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexShrink: 0,
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}>
                  {selectedConversation.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '18px', 
                    color: 'white',
                    fontWeight: '600',
                    letterSpacing: '-0.3px'
                  }}>
                    {selectedConversation.name}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    color: 'rgba(255,255,255,0.8)',
                    fontWeight: '300'
                  }}>
                    {selectedConversation.contact} • Online agora
                  </p>
                </div>
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)'
                }}>
                  WhatsApp
                </div>
              </div>

              {/* Área de Mensagens - SCROLL GARANTIDO E RESPONSIVO */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="whatsapp-messages-area" 
                style={{
                  flex: 1, // Ocupa todo o espaço disponível
                  padding: '20px 25px 10px 25px',
                  overflowY: 'scroll',
                  overflowX: 'hidden',
                  background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)',
                  position: 'relative',
                  scrollbarWidth: 'auto', 
                  msOverflowStyle: 'scrollbar' 
                }}
              >
                {loading ? (
                  <div style={{ textAlign: 'center', color: '#95a5a6' }}>
                    Carregando mensagens...
                  </div>
                ) : messages.length === 0 ? (
                  <>
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#95a5a6', 
                      padding: '40px 20px',
                      background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.05), rgba(0, 184, 148, 0.05))',
                      borderRadius: '15px',
                      margin: '20px 0'
                    }}>
                      <div style={{
                        fontSize: '48px',
                        marginBottom: '15px'
                      }}>
                        �
                      </div>
                      <h3 style={{
                        margin: '0 0 10px 0',
                        color: '#2c3e50',
                        fontSize: '18px'
                      }}>
                        Conversa Iniciada
                      </h3>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#7f8c8d'
                      }}>
                        As mensagens aparecerão aqui conforme a conversa se desenvolve
                      </p>
                    </div>
                  </>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      data-message-id={message.id}
                      style={{
                        width: '100%',
                        textAlign: message.from === 'me' || message.from === 'bot' ? 'right' : 'left',
                        marginBottom: '10px'
                      }}
                    >
                      <div style={{
                        display: 'inline-block',
                        maxWidth: '75%',
                        padding: message.type === 'image' ? '8px' : '14px 18px',
                        borderRadius: message.from === 'me' || message.from === 'bot' 
                          ? '20px 20px 5px 20px' 
                          : '20px 20px 20px 5px',
                        background: message.from === 'me' || message.from === 'bot' 
                          ? 'linear-gradient(135deg, #00b894 0%, #00a085 100%)' 
                          : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        color: message.from === 'me' || message.from === 'bot' ? 'white' : '#2c3e50',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.1)',
                        wordWrap: 'break-word',
                        border: message.from === 'me' || message.from === 'bot' 
                          ? 'none' 
                          : '1px solid rgba(0,0,0,0.05)',
                        textAlign: 'left'
                      }}>
                        {/* Renderizar conteúdo baseado no tipo */}
                        {message.type === 'image' ? (
                          <div className="media-message">
                            <img 
                              src={message.mediaUrl || message.body} 
                              alt="Imagem"
                              onClick={() => setSelectedImage(message.mediaUrl || message.body)}
                              style={{
                                width: '100%',
                                maxWidth: '300px',
                                height: 'auto',
                                borderRadius: '8px',
                                cursor: 'pointer'
                              }}
                            />
                            {message.caption && (
                              <p style={{ 
                                margin: '8px 0 0 0', 
                                fontSize: '14px',
                                padding: '0 8px 8px 8px'
                              }}>
                                {message.caption}
                              </p>
                            )}
                          </div>
                        ) : message.type === 'audio' ? (
                          <div className="audio-player">
                            <button 
                              className="audio-button"
                              onClick={() => playAudio(message.mediaUrl || message.body, message.id)}
                              style={{
                                background: playingAudio === message.id ? '#e74c3c' : 'linear-gradient(135deg, #00b894, #00a085)'
                              }}
                            >
                              {playingAudio === message.id ? '⏸️' : '▶️'}
                            </button>
                            <div className="audio-progress">
                              <div 
                                className="audio-progress-bar" 
                                style={{ width: playingAudio === message.id ? '100%' : '0%' }}
                              />
                            </div>
                            <span style={{ 
                              fontSize: '12px', 
                              color: message.from === 'me' || message.from === 'bot' ? 'rgba(255,255,255,0.8)' : '#7f8c8d',
                              minWidth: '35px'
                            }}>
                              {message.duration || '0:00'}
                            </span>
                          </div>
                        ) : (
                          <p style={{ 
                            margin: 0, 
                            fontSize: '15px', 
                            lineHeight: '1.5',
                            fontWeight: '400'
                          }}>
                            {message.body}
                          </p>
                        )}
                        
                        <div style={{
                          fontSize: '11px',
                          opacity: 0.8,
                          marginTop: '6px',
                          textAlign: 'right',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}>
                          {formatTime(message.timestamp)}
                          {(message.from === 'me' || message.from === 'bot') && (
                            <span style={{ fontSize: '12px' }}>
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Referência mínima para scroll */}
                <div 
                  ref={messagesEndRef} 
                  style={{ 
                    height: '10px', 
                    width: '100%'
                  }}
                />

                {/* Botão Moderno para rolar para baixo */}
                {showScrollButton && (
                  <button
                    onClick={() => {
                      console.log('=== BOTÃO CLICADO - WhatsApp ===');
                      
                      // Forçar scroll para o final
                      scrollToBottom(true);
                      
                      // Resetar o controle manual
                      setHasScrolledManually(false);
                      
                      // Forçar atualização do estado do botão
                      setTimeout(() => {
                        checkIfAtBottom();
                      }, 500);
                    }}
                    className="scroll-button"
                    style={{
                      position: 'fixed',
                      bottom: '120px',
                      left: '50%',
                      marginLeft: '190px', // Metade da largura da lista (380px / 2) para centralizar na área do chat
                      background: 'linear-gradient(135deg, #00b894, #00a085) !important',
                      color: 'white !important',
                      border: 'none',
                      borderRadius: '50%',
                      width: '56px',
                      height: '56px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(0, 184, 148, 0.4), 0 3px 10px rgba(0,0,0,0.2)',
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      opacity: 0.95,
                      backdropFilter: 'blur(10px)',
                      maxWidth: '56px',
                      maxHeight: '56px',
                      minWidth: '56px',
                      minHeight: '56px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00a085, #008f72) !important';
                      e.currentTarget.style.color = 'white !important';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(0, 184, 148, 0.6), 0 5px 15px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.95';
                      e.currentTarget.style.transform = 'scale(1) translateY(0)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00b894, #00a085) !important';
                      e.currentTarget.style.color = 'white !important';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 184, 148, 0.4), 0 3px 10px rgba(0,0,0,0.2)';
                    }}
                    title="Ir para as mensagens mais recentes"
                  >
                    ⬇️
                  </button>
                )}
              </div>

              {/* Input de Nova Mensagem Modernizado */}
              <div style={{
                padding: '20px 25px',
                background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                borderTop: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                flexShrink: 0,
                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
                position: 'relative'
              }}>
                {/* Botão de Anexo */}
                <button
                  className="attachment-button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00b894, #00a085)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'all 0.3s ease',
                    marginRight: '10px'
                  }}
                >
                  📎
                </button>

                {/* Menu de Anexos */}
                {showAttachmentMenu && (
                  <div className="attachment-menu">
                    <div className="attachment-option" onClick={openFileSelector}>
                      <span>🖼️</span>
                      <span>Enviar Imagem</span>
                    </div>
                    <div className="attachment-option" onClick={isRecording ? stopRecording : startRecording}>
                      <span>{isRecording ? '⏹️' : '🎤'}</span>
                      <span>{isRecording ? 'Parar Gravação' : 'Gravar Áudio'}</span>
                    </div>
                  </div>
                )}

                {/* Inputs ocultos para arquivo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />

                <div style={{
                  flex: 1,
                  position: 'relative'
                }}>
                  {/* Indicador de gravação */}
                  {isRecording && (
                    <div className="recording-indicator" style={{
                      background: 'rgba(231, 76, 60, 0.95)',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '25px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      boxShadow: '0 6px 25px rgba(231, 76, 60, 0.4)',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        background: 'white',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite'
                      }} />
                      <span style={{ fontWeight: '500' }}>
                        Gravando áudio... Clique no botão novamente para parar
                      </span>
                    </div>
                  )}

                  {/* Preview do áudio gravado */}
                  {audioBlob && !isRecording && (
                    <div className="audio-preview" style={{
                      background: 'rgba(0, 184, 148, 0.95)',
                      color: 'white',
                      padding: '12px 20px',
                      borderRadius: '25px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      boxShadow: '0 6px 25px rgba(0, 184, 148, 0.4)',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <span style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🎤 Áudio gravado com sucesso
                      </span>
                      <button
                        onClick={() => sendAudio(audioBlob)}
                        style={{
                          background: 'white',
                          color: '#00b894',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '15px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '600',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                        }}
                      >
                        ✅ Enviar
                      </button>
                      <button
                        onClick={() => setAudioBlob(null)}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '15px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    disabled={sending}
                    className="input-hover"
                    style={{
                      width: '100%',
                      padding: '15px 20px',
                      border: '2px solid transparent',
                      borderRadius: '25px',
                      outline: 'none',
                      fontSize: '15px',
                      background: sending ? '#f8f9fa' : 'white',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00b894';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 184, 148, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="button-hover"
                  style={{
                    padding: '15px 25px',
                    background: (!newMessage.trim() || sending) 
                      ? 'linear-gradient(135deg, #bdc3c7, #95a5a6) !important' 
                      : 'linear-gradient(135deg, #00b894, #00a085) !important',
                    color: 'white !important',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: (!newMessage.trim() || sending) ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    minWidth: '100px',
                    boxShadow: (!newMessage.trim() || sending) 
                      ? '0 2px 8px rgba(0,0,0,0.1)' 
                      : '0 4px 15px rgba(0, 184, 148, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!(!newMessage.trim() || sending)) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00a085, #008f72) !important';
                      e.currentTarget.style.color = 'white !important';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 184, 148, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!newMessage.trim() || sending)) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #00b894, #00a085) !important';
                      e.currentTarget.style.color = 'white !important';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 184, 148, 0.3)';
                    }
                  }}
                >
                  {sending ? (
                    <>
                      <span>⏳</span>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      <span>Enviar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Tela de Boas-vindas Moderna
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#7f8c8d',
              background: '#ffffff',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: '80px', 
                marginBottom: '25px',
                background: 'linear-gradient(135deg, #00b894, #00a085)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}>
                💬
              </div>
              <h3 style={{
                fontSize: '24px',
                margin: '0 0 15px 0',
                fontWeight: '600',
                color: '#2c3e50',
                letterSpacing: '-0.5px'
              }}>
                Bem-vindo ao WhatsApp
              </h3>
              <p style={{
                fontSize: '16px',
                margin: '0 0 20px 0',
                color: '#7f8c8d',
                lineHeight: '1.6',
                maxWidth: '400px'
              }}>
                Selecione uma conversa da lista à esquerda para começar a visualizar e enviar mensagens
              </p>
              <div style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #00b894, #00a085)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 15px rgba(0, 184, 148, 0.3)'
              }}>
                🚀 Sistema de Suporte Ativo
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Visualização de Imagem */}
      {selectedImage && createPortal(
        <div 
          data-modal="image-modal"
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed !important',
            top: '0 !important',
            left: '0 !important',
            width: '100vw !important',
            height: '100vh !important',
            background: 'rgba(0,0,0,0.9) !important',
            display: 'flex !important',
            alignItems: 'center !important',
            justifyContent: 'center !important',
            zIndex: '2147483647 !important',
            cursor: 'pointer !important',
            backdropFilter: 'blur(5px) !important',
            margin: '0 !important',
            padding: '0 !important',
            border: 'none !important',
            outline: 'none !important',
            boxSizing: 'border-box !important'
          }}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            style={{
              position: 'absolute !important',
              top: '20px !important',
              right: '20px !important',
              background: 'rgba(255,255,255,0.2) !important',
              color: 'white !important',
              border: 'none !important',
              borderRadius: '50% !important',
              width: '50px !important',
              height: '50px !important',
              cursor: 'pointer !important',
              fontSize: '24px !important',
              backdropFilter: 'blur(10px) !important',
              zIndex: '2147483647 !important',
              transition: 'all 0.3s ease !important',
              display: 'flex !important',
              alignItems: 'center !important',
              justifyContent: 'center !important',
              fontWeight: 'bold !important',
              textShadow: '0 2px 4px rgba(0,0,0,0.5) !important'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3) !important';
              e.currentTarget.style.transform = 'scale(1.1) !important';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2) !important';
              e.currentTarget.style.transform = 'scale(1) !important';
            }}
          >
            ✕
          </button>
          <img 
            src={selectedImage} 
            alt="Imagem ampliada"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90% !important',
              maxHeight: '90% !important',
              borderRadius: '12px !important',
              boxShadow: '0 8px 30px rgba(0,0,0,0.8) !important',
              zIndex: '2147483647 !important',
              transition: 'transform 0.3s ease !important',
              cursor: 'default !important',
              border: '3px solid rgba(255,255,255,0.2) !important',
              objectFit: 'contain !important'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02) !important';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) !important';
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default Messages;
