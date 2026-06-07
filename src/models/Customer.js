const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customer_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // WhatsApp
    whatsapp_phone: {
      type: String,
      default: null, // ej: "5218112345678"
    },
    whatsapp_connected: {
      type: Boolean,
      default: false,
    },
    whatsapp_connected_at: {
      type: Date,
      default: null,
    },

    // Preferencias de notificaciones
    notifications: {
      app_enabled: { type: Boolean, default: true },
      dia_de_surtir: { type: Boolean, default: true },
      avance_meta: { type: Boolean, default: true },
      promo_por_terminar: { type: Boolean, default: false },
    },

    name: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);