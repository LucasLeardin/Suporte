let whatsAppState = {
  ready: false,
  qrCode: null,
  lastQrGenerated: null
};
export default function handler(req, res) {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    whatsAppState: whatsAppState
  });
}
