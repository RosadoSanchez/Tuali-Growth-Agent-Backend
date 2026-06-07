const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");

// ======================================
// LOGIN "muy equis" (sin contraseñas)
// POST /api/auth/login
// body: { customer_id }
//
// No hay tabla de usuarios: el "cliente" se identifica por su customer_id.
// Aquí solo validamos que ese customer_id exista (tenga pedidos) y
// regresamos su perfil para guardarlo en la sesión del front.
// ======================================
router.post("/login", async (req, res) => {
  try {
    const customerId = req.body.customer_id || req.body.customerId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Falta customer_id"
      });
    }

    const orders = await Order.find({ customer_id: customerId });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "Cliente no encontrado"
      });
    }

    // Métricas básicas del cliente
    const totalOrders = orders.length;

    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.Total || 0),
      0
    );

    const statusBreakdown = {};
    orders.forEach(order => {
      const status = order.status_final || "Desconocido";
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    const orderIds = orders.map(
      order => order.id_pedido || order["﻿id_pedido"]
    );

    const favoriteProducts = await OrderDetail.aggregate([
      { $match: { id_pedido: { $in: orderIds } } },
      {
        $group: {
          _id: "$nombre_sku_solicitado",
          total: { $sum: { $toInt: "$Quantity" } }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      // "token" simbólico: el front lo usa como identificador de sesión.
      // No es un JWT real porque el back todavía no maneja autenticación.
      token: `tuali-${customerId}`,
      customer: {
        customer_id: customerId,
        total_orders: totalOrders,
        total_spent: totalSpent,
        favorite_products: favoriteProducts,
        status_breakdown: statusBreakdown
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ======================================
// LISTA DE CLIENTES PARA EL LOGIN
// GET /api/auth/clients
// (alias cómodo de /api/customers/ids para la pantalla de login)
// ======================================
router.get("/clients", async (req, res) => {
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

module.exports = router;
