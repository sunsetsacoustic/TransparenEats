const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getAnalytics, resetAnalytics } = require('../middlewares/requestLogger');
const Product = require('../db/models/Product');

/**
 * @route GET /api/v1/analytics/stats
 * @desc Get API usage statistics
 * @access Admin
 */
router.get('/stats', async (req, res) => {
  try {
    // Get in-memory analytics
    const stats = getAnalytics();
    
    // Add database statistics
    const dbStats = await getDatabaseStats();
    
    res.json({
      success: true,
      data: {
        ...stats,
        database: dbStats
      }
    });
  } catch (error) {
    console.error('Error getting analytics stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting analytics stats',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/analytics/logs
 * @desc Get recent API logs
 * @access Admin
 */
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0, type = 'api' } = req.query;
    
    // Determine log file
    const logFile = type === 'error' 
      ? path.join(__dirname, '../../logs/errors.log')
      : path.join(__dirname, '../../logs/api_requests.log');
    
    // Check if file exists
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Read log file
    const fileContent = fs.readFileSync(logFile, 'utf-8');
    const logs = fileContent
      .split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { error: 'Invalid log format', raw: line };
        }
      })
      .reverse() // Show newest first
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error getting analytics logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting analytics logs',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/analytics/reset
 * @desc Reset analytics counters
 * @access Admin
 */
router.post('/reset', (req, res) => {
  try {
    resetAnalytics();
    
    res.json({
      success: true,
      message: 'Analytics counters reset successfully'
    });
  } catch (error) {
    console.error('Error resetting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting analytics',
      error: error.message
    });
  }
});

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
async function getDatabaseStats() {
  // Get product counts
  const totalProducts = await Product.getProducts();
  const verifiedProducts = await Product.getProducts({ is_verified: true });
  const pendingReview = await Product.getProducts({ status: 'pending_review' });
  const userContributed = await Product.getProducts({ user_contributed: true });
  
  // Get source distribution
  const offProducts = await Product.getProducts({ source: 'openfoodfacts' });
  const usdaProducts = await Product.getProducts({ source: 'usda' });
  const nutritionixProducts = await Product.getProducts({ source: 'nutritionix' });
  const curatedProducts = await Product.getProducts({ source: 'curated' });
  
  // Failed searches
  const failedSearches = await Product.getProducts({ status: 'not_found' });
  
  return {
    products: {
      total: totalProducts.pagination.total,
      verified: verifiedProducts.pagination.total,
      pendingReview: pendingReview.pagination.total,
      userContributed: userContributed.pagination.total
    },
    sources: {
      openfoodfacts: offProducts.pagination.total,
      usda: usdaProducts.pagination.total,
      nutritionix: nutritionixProducts.pagination.total,
      curated: curatedProducts.pagination.total
    },
    failedSearches: failedSearches.pagination.total
  };
}

module.exports = router; 