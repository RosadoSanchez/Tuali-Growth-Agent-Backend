const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({}, {
  strict: false,
  collection: "orders"
});

module.exports = mongoose.model("Order", OrderSchema);