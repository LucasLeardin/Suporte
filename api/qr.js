let whatsAppState = {
  ready: false,
  qrCode: null,
  lastQrGenerated: null
};
function generateMockQR() {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const sessionId = Math.random().toString(36).substr(2, 9);
  return `1@${randomId},${sessionId},${timestamp}`;
}
export default function handler(req, res) {
  if (!whatsAppState.qrCode) {
    whatsAppState.qrCode = generateMockQR();
    whatsAppState.lastQrGenerated = Date.now();
  }
  res.json({ qr: whatsAppState.qrCode });
}
