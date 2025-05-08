const express = require('express');
const router = express.Router();
const Menu = require('../models/MenuItem');

// @route   GET /api/menu
// @desc    Get all menu items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const menuItems = await Menu.find().sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ message: '❌ Server Error: ' + err.message });
  }
});

// @route   POST /api/menu
// @desc    Add a new menu item
// @access  Admin
router.post('/menu', upload.single('image'), async (req, res) => {
    try {
      const { name, price, category, flavour } = req.body;
      if (!req.file) {
        return res.status(400).json({ message: 'Image is required' });
      }
  
      const imageUrl = `/uploads/${req.file.filename}`;
  
      const newItem = new MenuItem({
        name,
        price,
        category,
        flavour: category === 'Snacks' ? flavour : undefined,
        imageUrl
      });
  
      await newItem.save();
      res.status(201).json(newItem);
    } catch (err) {
      console.error('Post item error:', err);
      res.status(500).json({ message: 'Failed to post item', error: err.message });
    }
  });

module.exports = router;
