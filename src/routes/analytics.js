const express = require("express");
const router = express.Router();

const OrderDetail = require("../../models/OrderDetail");

// 🔥 top productos
router.get("/top-products", async (req, res) => {
  const result = await OrderDetail.aggregate([
    {
      $group: {
        _id: "$nombre_sku_solicitado",
        total: { $sum: { $toInt: "$Quantity" } }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 10 }
  ]);

  res.json(result);
});

// 🔥 pedidos por status
router.get("/status", async (req, res) => {
  const result = await OrderDetail.aggregate([
    {
      $group: {
        _id: "$Status",
        count: { $sum: 1 }
      }
    }
  ]);

  res.json(result);
});

module.exports = router;