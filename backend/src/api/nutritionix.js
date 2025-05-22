const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// /nutritionix/search
router.get('/search', async (req, res) => {
  const { query } = req.query;
  const appId = process.env.NUTRITIONIX_APP_ID;
  const apiKey = process.env.NUTRITIONIX_API_KEY;
  if (!query) return res.status(400).json({ error: 'Missing query parameter.' });
  if (!appId || !apiKey) return res.status(500).json({ error: 'Nutritionix API credentials not set.' });
  try {
    const response = await fetch(
      `https://api.nutritionix.com/v1_1/search/${encodeURIComponent(query)}?results=0:1&fields=item_name,brand_name,nf_calories,nf_ingredient_statement&appId=${appId}&appKey=${apiKey}`
    );
    if (!response.ok) {
      const text = await response.text();
      console.error('Nutritionix API error:', text);
      return res.status(500).json({ error: 'Nutritionix API error', details: text });
    }
    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('Failed to fetch from Nutritionix:', e);
    res.status(500).json({ error: 'Failed to fetch from Nutritionix.', details: e.message });
  }
});

module.exports = router; 