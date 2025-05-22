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
    // No need for additional sanitization as it's handled in frontend
    
    // Make the request to OpenFoodFacts
    console.log(`Fetching additive data for: ${code}`);
    const response = await fetch(`https://world.openfoodfacts.org/additive/${code}.json`);
    
    if (!response.ok) {
      console.error(`Error response from OpenFoodFacts: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        message: `OpenFoodFacts API returned ${response.status}`,
        error: response.statusText
      });
    }
    
    const data = await response.json();
    
    // Send back the data
    res.json(data);
  } catch (error) {
    console.error(`Error fetching additive data: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch additive data', error: error.message });
  }
});

module.exports = router; 