const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const { getCustomerSnapshot } = require("../services/customerData");

// ======================================
// MARCADOR (datos reales para la pantalla de Capi)
// GET /api/customers/:customerId/scoreboard
// ======================================
router.get("/:customerId/scoreboard", async (req, res) => {
  try {
    const snap = await getCustomerSnapshot(req.params.customerId);
    if (!snap) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente sin datos" });
    }

    const current = Math.round(snap.currentTicket);
    const before = Math.round(snap.previousTicket);
    const goal = Math.max(current + 1, Math.round(before * 1.15));

    const deltaPct = before ? Math.round(((current - before) / before) * 100) : 0;
    const span = goal - before;
    const progress = span > 0
      ? Math.max(0, Math.min(100, Math.round(((current - before) / span) * 100)))
      : 100;
    const isGoal = current >= goal;

    const top = snap.topProducts;
    const whatWorked = [];
    if (top[0]) whatWorked.push(`${top[0].name} jaló: ${top[0].qty} unidades vendidas.`);
    if (top[1]) whatWorked.push(`${top[1].name} sumó bien al ticket. ¡Bien ahí!`);
    if (deltaPct > 0) whatWorked.push(`Tu ticket subió ${deltaPct}% vs el periodo anterior.`);
    if (!whatWorked.length) whatWorked.push("Mantuviste tus ventas estables esta semana.");

    const whatToAdjust = [];
    if (top[0]) whatToAdjust.push(`Súrtete de ${top[0].name} antes del finde, se te acaba.`);
    if (top[1]) whatToAdjust.push(`Pon ${top[1].name} junto a la caja para subir el ticket.`);
    if (snap.deliveryRate < 95)
      whatToAdjust.push(`Revisa tus entregas: van al ${snap.deliveryRate.toFixed(0)}%.`);

    res.json({
      success: true,
      ticket: { current, before, goal, deltaPct },
      match: { progress, isGoal },
      whatWorked,
      whatToAdjust,
      meta: {
        totalOrders: snap.totalOrders,
        deliveryRate: Math.round(snap.deliveryRate),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtener todos los customer_id únicos
router.get("/ids", async (req, res) => {
  try {
    const customerIds = await Order.distinct("customer_id");

    res.json({
      success: true,
      count: customerIds.length,
      customerIds
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ======================================
// PERFIL COMPLETO
// GET /api/customers/:customerId/profile
// ======================================

router.get("/:customerId/profile", async (req, res) => {
  try {

    const customerId = req.params.customerId;

    const orders = await Order.find({
      customer_id: customerId
    });

    const totalOrders = orders.length;

    const totalSpent = orders.reduce((sum, order) => {
      return sum + Number(order.Total || 0);
    }, 0);

    const statusBreakdown = {};

    orders.forEach(order => {
      const status = order.status_final || "Desconocido";

      statusBreakdown[status] =
        (statusBreakdown[status] || 0) + 1;
    });

    const orderIds = orders.map(order =>
      order.id_pedido || order["﻿id_pedido"]
    );

    const products = await OrderDetail.aggregate([
      {
        $match: {
          id_pedido: { $in: orderIds }
        }
      },
      {
        $group: {
          _id: "$nombre_sku_solicitado",
          total: {
            $sum: {
              $toInt: "$Quantity"
            }
          }
        }
      },
      {
        $sort: {
          total: -1
        }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      customer_id: customerId,
      total_orders: totalOrders,
      total_spent: totalSpent,
      favorite_products: products,
      status_breakdown: statusBreakdown
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});


// ======================================
// PRODUCTOS FAVORITOS
// GET /api/customers/:customerId/top-products
// ======================================

router.get("/:customerId/top-products", async (req, res) => {

  try {

    const customerId = req.params.customerId;

    const orders = await Order.find({
      customer_id: customerId
    });

    const orderIds = orders.map(order =>
      order.id_pedido || order["﻿id_pedido"]
    );

    const products = await OrderDetail.aggregate([
      {
        $match: {
          id_pedido: {
            $in: orderIds
          }
        }
      },
      {
        $group: {
          _id: "$nombre_sku_solicitado",
          total: {
            $sum: {
              $toInt: "$Quantity"
            }
          }
        }
      },
      {
        $sort: {
          total: -1
        }
      },
      {
        $limit: 10
      }
    ]);

    res.json(products);

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});


// ======================================
// TODOS LOS PEDIDOS DEL CLIENTE
// GET /api/customers/:customerId/orders
// ======================================

router.get("/:customerId/orders", async (req, res) => {

  try {

    const orders = await Order.find({
      customer_id: req.params.customerId
    });

    res.json({
      count: orders.length,
      data: orders
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});


// ======================================
// GASTO TOTAL
// GET /api/customers/:customerId/total-spent
// ======================================

router.get("/:customerId/total-spent", async (req, res) => {

  try {

    const orders = await Order.find({
      customer_id: req.params.customerId
    });

    const totalSpent = orders.reduce((sum, order) => {
      return sum + Number(order.Total || 0);
    }, 0);

    res.json({
      customer_id: req.params.customerId,
      total_spent: totalSpent
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});


// ======================================
// PEDIDOS POR STATUS
// GET /api/customers/:customerId/status-breakdown
// ======================================

router.get("/:customerId/status-breakdown", async (req, res) => {

  try {

    const result = await Order.aggregate([
      {
        $match: {
          customer_id: req.params.customerId
        }
      },
      {
        $group: {
          _id: "$status_final",
          count: {
            $sum: 1
          }
        }
      }
    ]);

    res.json(result);

  } catch (err) {

    res.status(500).json({
      success: false,
      error: err.message
    });

  }
});

// ======================================
// SUMMARY DE CLIENTE
// GET /api/customers/:customerId/insights
// ======================================

router.get("/:customerId/insights", async (req, res) => {
  try {
    const { customerId } = req.params;

    const orders = await Order.find({
      customer_id: customerId
    });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado"
      });
    }

    const orderIds = orders.map(
      o => o["﻿id_pedido"] || o.id_pedido
    );

    const details = await OrderDetail.find({
      id_pedido: { $in: orderIds }
    });

    // Total gastado
    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.Total || 0),
      0
    );

    // Productos favoritos
    const productMap = {};

    details.forEach(item => {
      const product = item.nombre_sku_solicitado;

      productMap[product] =
        (productMap[product] || 0) +
        Number(item.Quantity || 0);
    });

    const topProducts = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // Último pedido
    const lastOrder = orders[orders.length - 1];

    // Estados
    const delivered = orders.filter(
      o => o.status_final === "Entregado"
    ).length;

    const deliveryRate =
      (delivered / orders.length) * 100;

    // Texto para ElevenLabs
    const summary =
      `Este cliente ha realizado ${orders.length} pedidos por un total de $${totalSpent.toFixed(2)}. ` +
      `Compra principalmente ${topProducts.join(", ")}. ` +
      `Su último pedido tuvo estatus "${lastOrder.status_final}". ` +
      `El ${deliveryRate.toFixed(0)}% de sus pedidos han sido entregados correctamente.`;

    res.json({
      success: true,
      customerId,
      metrics: {
        totalOrders: orders.length,
        totalSpent,
        topProducts,
        deliveryRate
      },
      summary
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;