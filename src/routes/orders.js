const express = require("express");
const router = express.Router();

const OrderDetail = require("../../models/OrderDetail");

// 🔥 TOOL: obtener pedidos por id_pedido
router.get("/:id_pedido", async (req, res) => {
  try {
    const data = await OrderDetail.find({
      id_pedido: req.params.id_pedido
    }).limit(100);

    res.json({
      success: true,
      count: data.length,
      data
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;