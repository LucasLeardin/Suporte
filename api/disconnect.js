let whatsAppState = {
  ready: false,
  qrCode: null,
  lastQrGenerated: null
};
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  whatsAppState.ready = false;
  whatsAppState.qrCode = null;
  res.json({ message: 'WhatsApp desconectado' });
}
