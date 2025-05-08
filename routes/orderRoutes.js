const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Create an order
router.post('/', async (req, res) => {
  try {
    const { itemName, quantity, totalAmount } = req.body;
    const newOrder = new Order({ itemName, quantity, totalAmount });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get all orders (for track order)
router.get('/', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = router;
