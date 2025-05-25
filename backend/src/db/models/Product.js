const db = require('../db');

const Product = {
  /**
   * Find a product by barcode
   * @param {string} barcode
   * @returns {Promise<Object|null>}
   */
  async findByBarcode(barcode) {
    return db('products').where({ barcode }).first();
  },

  /**
   * Create a new product
   * @param {Object} product
   * @returns {Promise<Object>}
   */
  async create(product) {
    try {
      console.log('[Product.create] Creating product:', product);
      const [newProduct] = await db('products').insert(product).returning('*');
      console.log('[Product.create] Product created:', newProduct);
      return newProduct;
    } catch (error) {
      console.error('[Product.create] Error:', error.stack || error);
      throw error;
    }
  },

  /**
   * Update a product
   * @param {string} barcode
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async update(barcode, updates) {
    try {
      console.log('[Product.update] Updating product:', { barcode, updates });
      updates.updated_at = db.fn.now();
      const [updatedProduct] = await db('products')
        .where({ barcode })
        .update(updates)
        .returning('*');
      console.log('[Product.update] Product updated:', updatedProduct);
      return updatedProduct;
    } catch (error) {
      console.error('[Product.update] Error:', error.stack || error);
      throw error;
    }
  },

  /**
   * Log a failed search
   * @param {string} barcode
   * @returns {Promise<Object>}
   */
  async logFailedSearch(barcode) {
    const product = await this.findByBarcode(barcode);
    
    if (product) {
      return this.update(barcode, {
        status: 'not_found',
        search_attempts: product.search_attempts + 1,
        last_searched: db.fn.now()
      });
    } else {
      return this.create({
        barcode,
        status: 'not_found',
        search_attempts: 1,
        last_searched: db.fn.now()
      });
    }
  },

  /**
   * Get products with filters and pagination
   * @param {Object} filters
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<Object>}
   */
  async getProducts(filters = {}, page = 1, limit = 20) {
    const query = db('products');
    
    // Apply filters
    if (filters.status) {
      query.where('status', filters.status);
    }
    
    if (filters.unverified === true) {
      query.where('is_verified', false);
    }
    
    if (filters.source) {
      query.where('source', filters.source);
    }
    
    // Count total results for pagination
    const countQuery = query.clone();
    const [{ count }] = await countQuery.count();
    
    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await query
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    return {
      data,
      pagination: {
        total: Number(count),
        page,
        limit,
        pages: Math.ceil(Number(count) / limit)
      }
    };
  },

  /**
   * Get most frequently searched products that weren't found
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getPopularNotFound(limit = 20) {
    return db('products')
      .where('status', 'not_found')
      .orderBy('search_attempts', 'desc')
      .limit(limit);
  }
};

module.exports = Product; 