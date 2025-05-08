const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  itemName: String,
  quantity: Number,
  totalAmount: Number,
  status: {
    type: String,
    enum: ["Placed", "Preparing", "Ready", "Delivered"],
    default: "Placed"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", OrderSchema);
