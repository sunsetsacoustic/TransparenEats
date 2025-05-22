const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// /off/categories
router.get('/categories', async (req, res) => {
  try {
    const response = await fetch('https://world.openfoodfacts.org/categories.json');
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch categories from Open Food Facts.' });
  }
});

// /off/popular
router.get('/popular', async (req, res) => {
  try {
    const response = await fetch('https://world.openfoodfacts.org/popular.json');
    if (!response.ok) {
      const text = await response.text();
      console.error('Open Food Facts API error:', text);
      return res.status(500).json({ error: 'Open Food Facts API error', details: text });
    }
    const data = await response.json();
    if (!data.products) {
      console.error('No popular products found in Open Food Facts response:', data);
      return res.status(500).json({ error: 'No popular products found.' });
    }
    res.json(data);
  } catch (e) {
    console.error('Failed to fetch popular products from Open Food Facts:', e);
    res.status(500).json({ error: 'Failed to fetch popular products from Open Food Facts.', details: e.message });
  }
});

// /off/category/:slug
router.get('/category/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const response = await fetch(`https://world.openfoodfacts.org/category/${encodeURIComponent(slug)}.json`);
    if (!response.ok) {
      return res.status(404).json({ error: 'Category not found on Open Food Facts.' });
    }
    const data = await response.json();
    if (!data.products) {
      return res.status(404).json({ error: 'No products found for this category.' });
    }
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch products for category from Open Food Facts.' });
  }
});

module.exports = router; 