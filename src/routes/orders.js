const express = require("express");
const router = express.Router();

const Order = require("../models/Order");

// todos los pedidos
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().limit(100);

    res.json({
      success: true,
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

// pedido por id
router.get("/:id_pedido", async (req, res) => {
  try {

    const order = await Order.findOne({
      "﻿id_pedido": req.params.id_pedido
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pedido no encontrado"
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;