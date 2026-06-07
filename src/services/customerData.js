const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");

// Arma una "foto" (snapshot) del cliente con datos reales de Mongo.
// La usan tanto el agente (chat) como el marcador, para que Capi
// siempre hable de los mismos números.
async function getCustomerSnapshot(customerId) {
  const orders = await Order.find({ customer_id: customerId });
  if (!orders.length) return null;

  // Ordena por fecha (ISO -> orden lexicográfico funciona).
  orders.sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

  const num = (v) => Number(String(v ?? "0").replace(/[^0-9.\-]/g, "")) || 0;

  const totals = orders.map((o) => num(o.Total));
  const totalSpent = totals.reduce((s, t) => s + t, 0);
  const totalOrders = orders.length;
  const avgTicket = totalOrders ? totalSpent / totalOrders : 0;

  // Ticket reciente vs anterior (ventana = mitad, máx 10) para tener
  // un "antes vs ahora" robusto sin depender de la fecha del calendario.
  const win = Math.max(1, Math.min(10, Math.floor(totalOrders / 2)));
  const avg = (arr) => (arr.length ? arr.reduce((s, t) => s + t, 0) / arr.length : 0);
  const recentTickets = totals.slice(-win);
  const prevTickets = totals.slice(-2 * win, -win);
  const currentTicket = avg(recentTickets);
  const previousTicket = prevTickets.length ? avg(prevTickets) : avgTicket;

  // Entregados
  const delivered = orders.filter((o) => o.status_final === "Entregado").length;
  const deliveryRate = totalOrders ? (delivered / totalOrders) * 100 : 0;

  // Productos top (por unidades) desde OrderDetail
  const orderIds = orders.map((o) => o.id_pedido || o["﻿id_pedido"]);
  const topAgg = await OrderDetail.aggregate([
    { $match: { id_pedido: { $in: orderIds } } },
    {
      $group: {
        _id: "$nombre_sku_solicitado",
        total: { $sum: { $toInt: "$Quantity" } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);
  const topProducts = topAgg
    .filter((p) => p._id)
    .map((p) => ({ name: p._id, qty: p.total }));

  const lastOrder = orders[orders.length - 1];

  return {
    customerId,
    totalOrders,
    totalSpent,
    avgTicket,
    currentTicket,
    previousTicket,
    deliveryRate,
    topProducts,
    lastOrderStatus: lastOrder?.status_final || "Desconocido",
  };
}

module.exports = { getCustomerSnapshot };
