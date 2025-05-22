const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// /usda/search
router.get('/search', async (req, res) => {
  const { query } = req.query;
  const apiKey = process.env.USDA_API_KEY;
  if (!query) return res.status(400).json({ error: 'Missing query parameter.' });
  if (!apiKey) return res.status(500).json({ error: 'USDA API key not set.' });
  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}`
    );
    if (!response.ok) {
      const text = await response.text();
      console.error('USDA API error:', text);
      return res.status(500).json({ error: 'USDA API error', details: text });
    }
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('Failed to fetch from USDA:', e);
    res.status(500).json({ error: 'Failed to fetch from USDA.', details: e.message });
  }
});

module.exports = router; 