let whatsAppState = {
  ready: false,
  qrCode: null,
  lastQrGenerated: null
};
export default function handler(req, res) {
  res.json({
    ready: whatsAppState.ready,
    message: whatsAppState.ready ? 'WhatsApp conectado' : 'Aguardando conexão com WhatsApp'
  });
}
