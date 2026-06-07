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

module.exports = router;