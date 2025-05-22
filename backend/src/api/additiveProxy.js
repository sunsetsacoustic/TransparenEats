const fetch = require('node-fetch');
const express = require('express');
const router = express.Router();

/**
 * @route GET /api/additiveProxy/:code
 * @desc Proxy for OpenFoodFacts additive data to avoid CORS issues
 * @access Public
 */
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    // Sanitize the code parameter
    const sanitizedCode = code.replace(/[^a-zA-Z0-9]/g, '');
    
    // Make the request to OpenFoodFacts
    const response = await fetch(`https://world.openfoodfacts.org/additive/${sanitizedCode}.json`);
    const data = await response.json();
    
    // Send back the data
    res.json(data);
  } catch (error) {
    console.error(`Error fetching additive data: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch additive data', error: error.message });
  }
});

module.exports = router; 