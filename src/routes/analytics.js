const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");

// 🔥 top productos
router.get("/top-products", async (req, res) => {

  const result = await OrderDetail.aggregate([
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

  res.json(result);
});

// 🔥 pedidos por status
router.get("/status", async (req, res) => {

  const result = await Order.aggregate([
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
});

router.get("/top-customers", async (req, res) => {

  const result = await Order.aggregate([
    {
      $group: {
        _id: "$customer_id",
        revenue: {
          $sum: {
            $toDouble: "$Total"
          }
        }
      }
    },
    {
      $sort: {
        revenue: -1
      }
    },
    {
      $limit: 10
    }
  ]);

  res.json(result);
});

router.get("/low-sales-products", async (req, res) => {

  const result = await OrderDetail.aggregate([
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
        total: 1
      }
    },
    {
      $limit: 10
    }
  ]);

  res.json(result);
});

router.get("/revenue", async (req, res) => {
  try {

    const result = await Order.aggregate([
      {
        $group: {
          _id: null,

          revenue: {
            $sum: {
              $toDouble: "$Total"
            }
          },

          pedidos: {
            $sum: 1
          }
        }
      }
    ]);

    res.json(result[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/summary", async (req, res) => {
  try {

    const revenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $toDouble: "$Total"
            }
          }
        }
      }
    ]);

    const delivered = await Order.countDocuments({
      status_final: "Entregado"
    });

    const totalOrders = await Order.countDocuments();

    res.json({
      revenue: revenue[0]?.total || 0,
      totalOrders,
      delivered
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/orders-by-day", async (req, res) => {

  const result = await Order.aggregate([
    {
      $group: {
        _id: "$fecha",
        total: { $sum: 1 }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);

  res.json(result);
});

module.exports = router;