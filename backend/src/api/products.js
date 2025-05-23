const express = require('express');
const productService = require('./services/productService');
const Product = require('../db/models/Product');

const router = express.Router();

/**
 * @route GET /api/v1/products/:barcode
 * @desc Get product information by barcode with caching
 * @access Public
 */
router.get('/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const result = await productService.getProductData(barcode);
    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product information',
      error: error.message
    });
  }
});

/**
 * Admin Routes - These should have auth middleware in production
 */

/**
 * @route GET /api/v1/products/admin/list
 * @desc Get list of products with filtering and pagination
 * @access Admin
 */
router.get('/admin/list', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, unverified, source } = req.query;
    
    // Parse query parameters
    const filters = {};
    if (status) filters.status = status;
    if (unverified === 'true') filters.unverified = true;
    if (source) filters.source = source;
    
    const result = await Product.getProducts(
      filters,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching products list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products list',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/products/admin/:barcode
 * @desc Get specific product details for admin
 * @access Admin
 */
router.get('/admin/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findByBarcode(barcode);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product details',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/v1/products/admin/:barcode
 * @desc Update/curate product information
 * @access Admin
 */
router.put('/admin/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const updates = req.body;
    
    // Add source as 'curated' and mark as verified
    updates.source = 'curated';
    updates.is_verified = true;
    
    const product = await Product.update(barcode, updates);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Invalidate cache for updated product
    await productService.invalidateProductCache(barcode);
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/products/admin/:barcode
 * @desc Delete product entry
 * @access Admin
 */
router.delete('/admin/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    
    // Using the update method to "soft delete" by changing status
    const product = await Product.update(barcode, {
      status: 'deleted'
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Invalidate cache for deleted product
    await productService.invalidateProductCache(barcode);
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/products/admin/failed-searches
 * @desc List products that couldn't be found
 * @access Admin
 */
router.get('/admin/failed-searches', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const failedSearches = await Product.getPopularNotFound(parseInt(limit));
    
    res.json({
      success: true,
      data: failedSearches
    });
  } catch (error) {
    console.error('Error fetching failed searches:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching failed searches',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/products/contribute/:barcode
 * @desc Submit basic product info from users
 * @access Public
 */
router.post('/contribute/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const { name, brand, category } = req.body;
    const ingredients_text = req.body.ingredients_text || '';
    
    // Get image URL from file upload if available
    let image_url = '';
    if (req.file) {
      // In a real implementation, you would upload the image to a storage service
      // and store the URL. For simplicity, we'll assume it's handled and just
      // use a placeholder.
      image_url = `/images/products/${barcode}.jpg`;
    }
    
    const productData = {
      barcode,
      name,
      brand,
      category,
      ingredients_raw: ingredients_text,
      image_url,
      source: 'user',
      status: 'pending_review',
      user_contributed: true
    };
    
    const product = await Product.findByBarcode(barcode);
    
    let result;
    if (product) {
      result = await Product.update(barcode, productData);
    } else {
      result = await Product.create(productData);
    }
    
    res.json({
      success: true,
      message: 'Thank you for your contribution!',
      data: result
    });
  } catch (error) {
    console.error('Error submitting user contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting your contribution',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/products/contribute/needed
 * @desc Get list of products needing contribution
 * @access Public
 */
router.get('/contribute/needed', async (req, res) => {
  try {
    const products = await Product.getPopularNotFound(10);
    
    // Filter for products scanned 3+ times
    const neededProducts = products.filter(p => p.search_attempts >= 3);
    
    res.json({
      success: true,
      data: neededProducts.map(p => ({
        barcode: p.barcode,
        search_attempts: p.search_attempts
      }))
    });
  } catch (error) {
    console.error('Error fetching products needing contribution:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products needing contribution',
      error: error.message
    });
  }
});

module.exports = router; 