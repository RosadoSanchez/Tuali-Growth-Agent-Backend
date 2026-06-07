const express = require("express");
const router = express.Router();

const OrderDetail = require("../models/OrderDetail");

// todos los detalles
router.get("/", async (req, res) => {
  try {

    const details = await OrderDetail.find().limit(100);

    res.json({
      success: true,
      count: details.length,
      data: details
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// detalle por pedido
router.get("/:id_pedido", async (req, res) => {
  try {

    const details = await OrderDetail.find({
      id_pedido: req.params.id_pedido
    });

    res.json({
      success: true,
      count: details.length,
      data: details
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;