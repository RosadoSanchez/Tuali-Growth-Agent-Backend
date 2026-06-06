const mongoose = require("mongoose");

const OrderDetailSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model("OrderDetail", OrderDetailSchema);