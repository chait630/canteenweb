const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item name is required"],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [1, "Price must be at least 1"],
  },
  imageUrl: {
    type: String,
    default: "https://via.placeholder.com/150", // fallback image
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Snacks", "Drinks", "Meals"],
  },
  flavour: {
    type: String,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);
