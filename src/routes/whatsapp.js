// src/routes/whatsapp.js
const express = require("express");
const router = express.Router();

const Customer = require("../models/Customer");
const wa = require("../services/whatsappService");

// ══════════════════════════════════════════════════════════════════
// POST /api/whatsapp/connect
// La app llama esto cuando el usuario toca "Conectar WhatsApp"
// Body: { customer_id, phone, name? }
// ══════════════════════════════════════════════════════════════════
router.post("/connect", async (req, res) => {
  try {
    const { customer_id, phone, name } = req.body;

    if (!customer_id || !phone) {
      return res.status(400).json({
        success: false,
        message: "customer_id y phone son requeridos",
      });
    }

    // Normaliza el teléfono: solo dígitos, sin + ni espacios
    const cleanPhone = phone.replace(/\D/g, "");

    // Upsert: crea o actualiza el customer
    const customer = await Customer.findOneAndUpdate(
      { customer_id },
      {
        whatsapp_phone: cleanPhone,
        whatsapp_connected: true,
        whatsapp_connected_at: new Date(),
        ...(name && { name }),
      },
      { upsert: true, new: true }
    );

    // Manda el mensaje de bienvenida por WhatsApp
    await wa.sendWelcomeTemplate(cleanPhone, customer.name || name);

    res.json({
      success: true,
      message: "WhatsApp conectado y mensaje de bienvenida enviado",
      customer_id,
      phone: cleanPhone,
    });
  } catch (err) {
    console.error("❌ /connect error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// GET /api/whatsapp/preferences/:customerId
// La app carga el estado de los toggles al abrir la pantalla
// ══════════════════════════════════════════════════════════════════
router.get("/preferences/:customerId", async (req, res) => {
  try {
    const customer = await Customer.findOne({
      customer_id: req.params.customerId,
    });

    if (!customer) {
      // Si no existe aún, devuelve los defaults
      return res.json({
        success: true,
        whatsapp_connected: false,
        notifications: {
          app_enabled: true,
          dia_de_surtir: true,
          avance_meta: true,
          promo_por_terminar: false,
        },
      });
    }

    res.json({
      success: true,
      whatsapp_connected: customer.whatsapp_connected,
      phone: customer.whatsapp_phone,
      notifications: customer.notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// PATCH /api/whatsapp/preferences/:customerId
// La app llama esto cada vez que el usuario mueve un toggle
// Body: { app_enabled?, dia_de_surtir?, avance_meta?, promo_por_terminar? }
// ══════════════════════════════════════════════════════════════════
router.patch("/preferences/:customerId", async (req, res) => {
  try {
    const allowed = [
      "app_enabled",
      "dia_de_surtir",
      "avance_meta",
      "promo_por_terminar",
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        updates[`notifications.${key}`] = req.body[key];
      }
    });

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No hay campos válidos para actualizar",
      });
    }

    const customer = await Customer.findOneAndUpdate(
      { customer_id: req.params.customerId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      notifications: customer.notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// POST /api/whatsapp/disconnect/:customerId
// El usuario desconecta WhatsApp
// ══════════════════════════════════════════════════════════════════
router.post("/disconnect/:customerId", async (req, res) => {
  try {
    await Customer.findOneAndUpdate(
      { customer_id: req.params.customerId },
      {
        whatsapp_connected: false,
        whatsapp_phone: null,
        whatsapp_connected_at: null,
      }
    );

    res.json({ success: true, message: "WhatsApp desconectado" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// POST /api/whatsapp/notify/dia-surtir
// Llama esto desde un cron job el día que toca surtir
// Body: { customer_id }  — o sin body para enviar a TODOS los activos
// ══════════════════════════════════════════════════════════════════
router.post("/notify/dia-surtir", async (req, res) => {
  try {
    const filter = {
      whatsapp_connected: true,
      "notifications.dia_de_surtir": true,
    };

    if (req.body?.customer_id) {
      filter.customer_id = req.body.customer_id;
    }

    const customers = await Customer.find(filter);

    const results = await Promise.allSettled(
      customers.map((c) => wa.sendDiaDeSurtir(c.whatsapp_phone, c.name))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    res.json({ success: true, sent, failed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// POST /api/whatsapp/notify/avance-meta
// Body: { customer_id, porcentaje, faltante }
// ══════════════════════════════════════════════════════════════════
router.post("/notify/avance-meta", async (req, res) => {
  try {
    const { customer_id, porcentaje, faltante } = req.body;

    const customer = await Customer.findOne({
      customer_id,
      whatsapp_connected: true,
      "notifications.avance_meta": true,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado o sin WA activo",
      });
    }

    await wa.sendAvanceMeta(customer.whatsapp_phone, porcentaje, faltante);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// POST /api/whatsapp/notify/promo
// Body: { customer_id, nombre_promo, tiempo_restante }
// ══════════════════════════════════════════════════════════════════
router.post("/notify/promo", async (req, res) => {
  try {
    const { customer_id, nombre_promo, tiempo_restante } = req.body;

    const customer = await Customer.findOne({
      customer_id,
      whatsapp_connected: true,
      "notifications.promo_por_terminar": true,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado o notificación desactivada",
      });
    }

    await wa.sendPromoTerminar(
      customer.whatsapp_phone,
      nombre_promo,
      tiempo_restante
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════
// GET /api/whatsapp/webhook   ← Meta lo llama para verificar tu URL
// Ponla en Meta > App > WhatsApp > Configuración de webhook
// ══════════════════════════════════════════════════════════════════
router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.WA_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado por Meta");
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// ══════════════════════════════════════════════════════════════════
// POST /api/whatsapp/webhook  ← Meta manda aquí los mensajes entrantes
// ══════════════════════════════════════════════════════════════════
router.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (messages?.length) {
      const msg = messages[0];
      const from = msg.from; // teléfono del usuario
      const text = msg.text?.body?.toLowerCase() || "";

      console.log(`📩 Mensaje de ${from}: ${text}`);

      // Puedes responder aquí con texto libre (dentro de ventana 24h)
      // await wa.sendText(from, "¡Hola! Recibí tu mensaje 👍");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.sendStatus(500);
  }
});

module.exports = router;