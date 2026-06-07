const express = require("express");
const router = express.Router();

const { getCustomerSnapshot } = require("../services/customerData");
const { askGemini } = require("../services/gemini");

const money = (n) => "$" + Math.round(n).toLocaleString("es-MX");

// Personalidad de Capi (se usa en el prompt de Gemini)
const CAPI_PERSONA = `
Eres "Capi", un coach de ventas para tenderos (dueños de tiendas de abarrotes en México).
Hablas en español mexicano, cálido, breve y motivador, con metáforas de futbol (gol, jugada, marcador).
Tuteas al tendero. Nunca inventes cifras: usa solo los datos que te doy.
`.trim();

// ======================================
// CHAT CON CAPI (cerebro real)
// POST /api/agent/chat
// body: { customer_id, goal?, message?, history? }
// devuelve: { success, reply, jugada }
// ======================================
async function handleChat(req, res) {
  try {
    const { customer_id, goal, message, history } = req.body;

    if (!customer_id) {
      return res
        .status(400)
        .json({ success: false, message: "Falta customer_id" });
    }

    const snap = await getCustomerSnapshot(customer_id);
    if (!snap) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente sin datos" });
    }

    // --- Intento con Gemini ---
    const prompt = buildChatPrompt(snap, { goal, message, history });
    const ai = await askGemini(prompt, { expectJson: true });

    const result =
      ai && ai.reply && ai.jugada
        ? ai
        : fallbackChat(snap, { goal, message }); // respaldo con datos reales

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

router.post("/chat", handleChat);

// Alias para compatibilidad con el endpoint viejo (/query con { question })
router.post("/query", (req, res) => {
  req.body.message = req.body.message || req.body.question;
  return handleChat(req, res);
});

function buildChatPrompt(snap, { goal, message, history }) {
  const top = snap.topProducts
    .map((p) => `${p.name} (${p.qty} u)`)
    .join(", ");

  return `${CAPI_PERSONA}

DATOS REALES DEL TENDERO:
- Pedidos totales: ${snap.totalOrders}
- Gasto total: ${money(snap.totalSpent)}
- Ticket promedio: ${money(snap.avgTicket)}
- Ticket reciente: ${money(snap.currentTicket)} (antes ${money(snap.previousTicket)})
- Productos top: ${top || "sin datos"}
- Tasa de entrega: ${snap.deliveryRate.toFixed(0)}%

META QUE ELIGIÓ: ${goal || "aún no elige, sugiérele una"}
${message ? `MENSAJE DEL TENDERO: "${message}"` : "Es el inicio de la conversación."}
${history?.length ? `HISTORIAL: ${JSON.stringify(history).slice(0, 1500)}` : ""}

Responde SOLO con un JSON válido con esta forma exacta:
{
  "reply": "1-2 frases de Capi, cálidas y con tono de futbol",
  "jugada": {
    "title": "título corto de la jugada",
    "sub": "X movimientos · toca Activar los que quieras",
    "moves": [
      {
        "type": "reto | reorder | combo | loyalty",
        "tag": "etiqueta corta MAYÚSCULAS",
        "title": "acción concreta usando productos reales",
        "desc": "por qué conviene, breve",
        "cta": "Activar",
        "impact": "+$XXX estimado o +X% ticket"
      }
    ]
  }
}
Máximo 3 movimientos. Usa los productos top reales en las acciones.`;
}

// Respaldo sin Gemini: arma una jugada útil con los datos reales.
function fallbackChat(snap, { goal, message }) {
  const top = snap.topProducts[0]?.name || "tu producto estrella";
  const second = snap.topProducts[1]?.name || "una botana";
  const metaTicket = Math.round(snap.currentTicket * 1.15);

  const reply = message
    ? `¡Va! Lo sumo a tu jugada y te aviso cómo vamos en el marcador. 🏆`
    : `¡Listo, jefe! ${
        goal ? `Tu meta es ${goal.toLowerCase()}.` : "Vamos por más ventas."
      } Te armé una jugada para llegar al gol. ⚽`;

  const moves = [
    {
      type: "reto",
      tag: "RETO DE GANA",
      title: `Vende 3 combos de ${top} + ${second} esta semana`,
      desc: `Vendes mucho ${top} solo; el combo sube el ticket sin bajar tu margen. Y te dan 200 Puntos.`,
      cta: "Activar",
      impact: "+200 Puntos",
    },
    {
      type: "reorder",
      tag: "PEDIDO SUGERIDO",
      title: `Surte ${top} antes del fin de semana`,
      desc: `Es tu más vendido y se te agota. No te quedes sin gol.`,
      cta: "Agregar al pedido",
      impact: "+$640 estimado",
    },
    {
      type: "combo",
      tag: "SUBE TU TICKET",
      title: `Pon ${second} junto a la caja`,
      desc: `Lleva tu ticket de ${money(snap.currentTicket)} hacia ${money(
        metaTicket
      )}.`,
      cta: "Activar",
      impact: "+8% ticket",
    },
  ];

  return {
    reply,
    jugada: {
      title: goal ? `Tu jugada para ${goal.toLowerCase()}` : "Tu jugada goleadora",
      sub: `${moves.length} movimientos · toca Activar los que quieras`,
      moves,
    },
    source: "fallback",
  };
}

module.exports = router;
