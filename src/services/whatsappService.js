// src/services/whatsappService.js
// Usa Twilio Sandbox para WhatsApp (sin verificación, gratis para pruebas)
// Setup: twilio.com/console/messaging/whatsapp/sandbox

const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = "whatsapp:+14155238886"; // Número fijo del sandbox de Twilio

// ── Helper interno ────────────────────────────────────────────────
function toWA(phone) {
  const digits = phone.replace(/\D/g, "");
  return `whatsapp:+${digits}`;
}

async function sendText(to, text) {
  return client.messages.create({
    from: FROM,
    to: toWA(to),
    body: text,
  });
}

// ── Mensajes de Capi ──────────────────────────────────────────────

async function sendWelcomeTemplate(to, nombre) {
  return sendText(
    to,
    `¡Hola, ${nombre || "amigo"}! Soy Capi 🤖\nYa estás conectado y te avisaré para que no se te pase ningún gol ⚽`
  );
}

async function sendDiaDeSurtir(to, nombre) {
  return sendText(
    to,
    `¡Hola, ${nombre || "amigo"}! Hoy toca surtir para no quedarte sin tus más vendidos. Vamos por ese gol ⚽`
  );
}

async function sendAvanceMeta(to, porcentaje, faltante) {
  return sendText(
    to,
    `¡Vas al ${porcentaje}% de tu meta! 🎯\nTe faltan $${faltante} para el gol. ¡Tú puedes!`
  );
}

async function sendPromoTerminar(to, nombrePromo, tiempoRestante) {
  return sendText(
    to,
    `⚡ *${nombrePromo}*\n¡La promo termina en ${tiempoRestante}! No te quedes sin aprovecharla.`
  );
}

module.exports = {
  sendText,
  sendWelcomeTemplate,
  sendDiaDeSurtir,
  sendAvanceMeta,
  sendPromoTerminar,
};