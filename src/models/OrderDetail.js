const mongoose = require("mongoose");

const OrderDetailSchema = new mongoose.Schema({}, {
  strict: false,
  collection: "orderdetails"
});

module.exports = mongoose.model("OrderDetail", OrderDetailSchema);