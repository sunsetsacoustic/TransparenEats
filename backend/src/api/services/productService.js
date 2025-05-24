const Product = require('../../db/models/Product');
const cacheService = require('../../services/cacheService');

// Import external API handlers
const offApi = require('../off');
const nutritionixApi = require('../nutritionix');
const usdaApi = require('../usda');

/**
 * Product service with caching logic
 */
const productService = {
  /**
   * Get product data with caching
   * @param {string} barcode 
   * @returns {Promise<Object>}
   */
  async getProductData(barcode) {
    // Step 0: Check Redis cache first (memory cache)
    const cacheKey = cacheService.getProductCacheKey(barcode);
    const cachedProduct = await cacheService.getFromCache(cacheKey);
    
    if (cachedProduct) {
      return {
        success: true,
        data: cachedProduct,
        fromCache: true,
        cacheType: 'memory',
        source: cachedProduct.source
      };
    }
    
    // Step 1: Check local database (disk cache)
    const localProduct = await Product.findByBarcode(barcode);
    
    if (localProduct && localProduct.status === 'active') {
      // Store in Redis cache for faster future access
      await cacheService.setInCache(cacheKey, localProduct);
      
      return {
        success: true,
        data: localProduct,
        fromCache: true,
        cacheType: 'database',
        source: localProduct.source
      };
    }
    
    // Step 2: Check if we've searched before and found nothing
    if (localProduct && localProduct.status === 'not_found') {
      // Only retry after 24 hours
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastSearched = new Date(localProduct.last_searched);
      
      if (lastSearched > dayAgo) {
        return {
          success: false,
          message: 'Product not found',
          barcode
        };
      }
    }
    
    // Step 3: Query external APIs
    const externalResult = await this.queryExternalAPIs(barcode);
    
    if (externalResult.found) {
      // Save to database
      const savedProduct = await this.saveToLocalDatabase(barcode, externalResult.data, externalResult.source);
      
      // Store in Redis cache
      await cacheService.setInCache(cacheKey, savedProduct);
      
      return {
        success: true,
        data: savedProduct,
        fromCache: false,
        source: externalResult.source
      };
    }
    
    // Step 4: Log failed search
    await Product.logFailedSearch(barcode);
    
    return {
      success: false,
      message: 'Product not found',
      barcode,
      suggestions: [
        'Try scanning the barcode again',
        'Check if the barcode is clear and undamaged',
        'This might be a local/regional product not in our databases yet'
      ]
    };
  },

  /**
   * Invalidate cache for a specific product
   * @param {string} barcode 
   * @returns {Promise<void>}
   */
  async invalidateProductCache(barcode) {
    const cacheKey = cacheService.getProductCacheKey(barcode);
    await cacheService.removeFromCache(cacheKey);
  },

  /**
   * Query external APIs in sequence
   * @param {string} barcode 
   * @returns {Promise<Object>}
   */
  async queryExternalAPIs(barcode) {
    try {
      console.log(`Querying external APIs for barcode: ${barcode}`);
      
      // Try Open Food Facts first
      console.log('Trying OpenFoodFacts API...');
      const offResult = await this.queryOpenFoodFacts(barcode);
      if (offResult) {
        console.log('Product found in OpenFoodFacts');
        return {
          found: true,
          data: offResult,
          source: 'openfoodfacts'
        };
      }

      // Try USDA next
      console.log('Trying USDA API...');
      const usdaResult = await this.queryUSDA(barcode);
      if (usdaResult) {
        console.log('Product found in USDA');
        return {
          found: true,
          data: usdaResult,
          source: 'usda'
        };
      }

      // Try Nutritionix last
      console.log('Trying Nutritionix API...');
      const nutritionixResult = await this.queryNutritionix(barcode);
      if (nutritionixResult) {
        console.log('Product found in Nutritionix');
        return {
          found: true,
          data: nutritionixResult,
          source: 'nutritionix'
        };
      }

      console.log(`Product with barcode ${barcode} not found in any external API`);
      // Not found in any API
      return { found: false };
    } catch (error) {
      console.error('Error querying external APIs:', error);
      return { found: false, error: error.message };
    }
  },

  /**
   * Query Open Food Facts API
   * @param {string} barcode 
   * @returns {Promise<Object|null>}
   */
  async queryOpenFoodFacts(barcode) {
    try {
      // Create a fetch function that matches the expected API from the router
      const fetchData = async (url) => {
        console.log(`Fetching from URL: ${url}`);
        const response = await fetch(url);
        console.log(`Response status: ${response.status}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      };

      const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
      const data = await fetchData(url);
      
      console.log(`OpenFoodFacts API status: ${data.status}`);
      
      if (data.status === 1 && data.product) {
        // Normalize data for our database schema
        const productData = {
          barcode,
          name: data.product.product_name || '',
          brand: data.product.brands || '',
          ingredients_raw: data.product.ingredients_text || '',
          ingredients_list: data.product.ingredients || [],
          nutrition_data: {
            nutrients: data.product.nutriments || {},
            serving_size: data.product.serving_size || '',
            nutrition_grade: data.product.nutrition_grades || ''
          },
          image_url: data.product.image_url || '',
          category: data.product.categories_tags?.[0] || '',
        };
        
        console.log('OpenFoodFacts product found:', productData.name);
        return productData;
      }
      
      console.log('Product not found in OpenFoodFacts');
      return null;
    } catch (error) {
      console.error('Error querying Open Food Facts:', error);
      return null;
    }
  },

  /**
   * Query USDA API
   * @param {string} barcode 
   * @returns {Promise<Object|null>}
   */
  async queryUSDA(barcode) {
    try {
      const apiKey = process.env.USDA_API_KEY;
      if (!apiKey) {
        console.warn('USDA API key not configured');
        return null;
      }

      // First, search for the product by UPC/barcode
      const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${barcode}&dataType=Branded`;
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`USDA API search error: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      if (!searchData.foods || searchData.foods.length === 0) {
        return null; // No results found
      }

      // Get the first matching product
      const foodItem = searchData.foods[0];
      
      // Get detailed information about the product
      const detailUrl = `https://api.nal.usda.gov/fdc/v1/food/${foodItem.fdcId}?api_key=${apiKey}`;
      const detailResponse = await fetch(detailUrl);
      if (!detailResponse.ok) {
        throw new Error(`USDA API detail error: ${detailResponse.statusText}`);
      }

      const detailData = await detailResponse.json();
      
      // Transform the USDA data into our standardized format
      return {
        barcode,
        name: detailData.description || foodItem.description,
        brand: detailData.brandOwner || detailData.brandName || '',
        ingredients_raw: detailData.ingredients || '',
        ingredients_list: [], // USDA doesn't provide structured ingredients
        nutrition_data: {
          nutrients: this.transformUsdaNutrients(detailData.foodNutrients),
          serving_size: detailData.servingSize ? `${detailData.servingSize}${detailData.servingSizeUnit}` : '',
        },
        image_url: '', // USDA doesn't provide images
        category: detailData.foodCategory || '',
      };
    } catch (error) {
      console.error('Error querying USDA:', error);
      return null;
    }
  },

  /**
   * Transform USDA nutrients to a standardized format
   * @param {Array} foodNutrients 
   * @returns {Object}
   */
  transformUsdaNutrients(foodNutrients) {
    if (!foodNutrients || !Array.isArray(foodNutrients)) {
      return {};
    }

    const nutrients = {};
    const nutrientMapping = {
      'Energy': 'energy',
      'Protein': 'proteins',
      'Total lipid (fat)': 'fat',
      'Carbohydrate, by difference': 'carbohydrates',
      'Fiber, total dietary': 'fiber',
      'Sugars, total including NLEA': 'sugars',
      'Sodium, Na': 'sodium',
      'Calcium, Ca': 'calcium',
      'Iron, Fe': 'iron',
      'Potassium, K': 'potassium',
      'Vitamin A, RAE': 'vitamin_a',
      'Vitamin C, total ascorbic acid': 'vitamin_c',
      'Vitamin D (D2 + D3)': 'vitamin_d',
      'Saturated Fatty Acids': 'saturated_fat',
      'Trans Fatty Acids': 'trans_fat',
    };

    // Process each nutrient
    foodNutrients.forEach(item => {
      const name = item.nutrient?.name || '';
      const value = item.amount || 0;
      const key = nutrientMapping[name] || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      nutrients[key] = value;
    });

    return nutrients;
  },

  /**
   * Query Nutritionix API
   * @param {string} barcode 
   * @returns {Promise<Object|null>}
   */
  async queryNutritionix(barcode) {
    try {
      const appId = process.env.NUTRITIONIX_APP_ID;
      const appKey = process.env.NUTRITIONIX_APP_KEY;
      
      if (!appId || !appKey) {
        console.warn('Nutritionix API credentials not configured');
        return null;
      }

      // Search by UPC barcode
      const url = `https://trackapi.nutritionix.com/v2/search/item?upc=${barcode}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-app-id': appId,
          'x-app-key': appKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Nutritionix API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if product was found
      if (!data.foods || data.foods.length === 0) {
        return null;
      }

      const foodItem = data.foods[0];
      
      // Extract ingredients list if available
      const ingredientsList = [];
      if (foodItem.nf_ingredient_statement) {
        // Simple parse of ingredient list by comma
        const ingredients = foodItem.nf_ingredient_statement.split(',');
        ingredients.forEach(ingredient => {
          ingredientsList.push({
            text: ingredient.trim(),
            rank: ingredientsList.length + 1
          });
        });
      }
      
      // Transform the Nutritionix data into our standardized format
      return {
        barcode,
        name: foodItem.food_name || '',
        brand: foodItem.brand_name || '',
        ingredients_raw: foodItem.nf_ingredient_statement || '',
        ingredients_list: ingredientsList,
        nutrition_data: {
          nutrients: {
            energy: foodItem.nf_calories || 0,
            proteins: foodItem.nf_protein || 0,
            fat: foodItem.nf_total_fat || 0,
            carbohydrates: foodItem.nf_total_carbohydrate || 0,
            fiber: foodItem.nf_dietary_fiber || 0,
            sugars: foodItem.nf_sugars || 0,
            sodium: foodItem.nf_sodium || 0,
            saturated_fat: foodItem.nf_saturated_fat || 0,
            cholesterol: foodItem.nf_cholesterol || 0,
            potassium: foodItem.nf_potassium || 0,
          },
          serving_size: foodItem.serving_weight_grams ? `${foodItem.serving_weight_grams}g` : '',
        },
        image_url: foodItem.photo?.thumb || '',
        category: foodItem.tags?.food_group || '',
      };
    } catch (error) {
      console.error('Error querying Nutritionix:', error);
      return null;
    }
  },

  /**
   * Save product data to local database
   * @param {string} barcode 
   * @param {Object} productData 
   * @param {string} source 
   * @returns {Promise<Object>}
   */
  async saveToLocalDatabase(barcode, productData, source) {
    try {
      const product = await Product.findByBarcode(barcode);
      
      // Analyze ingredients for additives
      const flaggedAdditives = this.analyzeIngredients(productData.ingredients_raw);
      
      const productToSave = {
        ...productData,
        barcode,
        source,
        status: 'active',
        is_verified: false,
        flagged_additives: flaggedAdditives
      };
      
      if (product) {
        return await Product.update(barcode, productToSave);
      } else {
        return await Product.create(productToSave);
      }
    } catch (error) {
      console.error('Error saving to local database:', error);
      throw error;
    }
  },

  /**
   * Analyze ingredients and flag additives
   * @param {string} ingredientsText 
   * @returns {Object} Flagged additives
   */
  analyzeIngredients(ingredientsText) {
    if (!ingredientsText) {
      return { additives: [] };
    }
    
    // Convert to lowercase for easier matching
    const ingredients = ingredientsText.toLowerCase();
    
    // Common additives to look for (e-numbers and names)
    const additivePatterns = [
      { pattern: /e(\d{3}[a-z]?)/g, type: 'e-number' },
      { pattern: /monosodium glutamate|msg/g, type: 'flavor enhancer', code: 'E621' },
      { pattern: /aspartame/g, type: 'sweetener', code: 'E951' },
      { pattern: /sodium nitrite/g, type: 'preservative', code: 'E250' },
      { pattern: /sodium benzoate/g, type: 'preservative', code: 'E211' },
      { pattern: /bht|butylated hydroxytoluene/g, type: 'antioxidant', code: 'E321' },
      { pattern: /bha|butylated hydroxyanisole/g, type: 'antioxidant', code: 'E320' },
      { pattern: /carrageenan/g, type: 'thickener', code: 'E407' },
      { pattern: /high fructose corn syrup|hfcs/g, type: 'sweetener' },
      { pattern: /partially hydrogenated/g, type: 'trans fat' },
      { pattern: /artificial colou?r/g, type: 'color' },
      { pattern: /artificial flavo?r/g, type: 'flavor' },
      { pattern: /saccharin/g, type: 'sweetener', code: 'E954' },
      { pattern: /sucralose/g, type: 'sweetener', code: 'E955' },
      { pattern: /xanthan gum/g, type: 'thickener', code: 'E415' },
      { pattern: /potassium sorbate/g, type: 'preservative', code: 'E202' },
      { pattern: /calcium propionate/g, type: 'preservative', code: 'E282' },
      { pattern: /sodium nitrate/g, type: 'preservative', code: 'E251' },
      { pattern: /sulfite|sulphite/g, type: 'preservative' },
      { pattern: /phosphoric acid/g, type: 'acidity regulator', code: 'E338' },
    ];
    
    // Find matches for each additive
    const additives = [];
    additivePatterns.forEach(({ pattern, type, code }) => {
      const matches = [...new Set(ingredients.match(pattern) || [])];
      matches.forEach(match => {
        additives.push({
          name: match.trim(),
          type,
          code: code || match.trim(),
          concerns: this.getAdditiveConcerns(code || match.trim())
        });
      });
    });
    
    return { additives };
  },
  
  /**
   * Get concerns for a specific additive
   * @param {string} code 
   * @returns {Array} List of concerns
   */
  getAdditiveConcerns(code) {
    // Map of additives to potential concerns
    // This is a simplified version - would need a more comprehensive database
    const additiveConcerns = {
      'E621': ['headaches', 'allergic reactions', 'possible excitotoxin'],
      'E951': ['headaches', 'suspected carcinogen', 'neurological effects'],
      'E250': ['may form carcinogenic nitrosamines', 'linked to cancer risk'],
      'E211': ['potential allergen', 'hyperactivity in children'],
      'E321': ['potential endocrine disruptor', 'allergic reactions'],
      'E320': ['potential endocrine disruptor', 'allergic reactions'],
      'E407': ['gut inflammation', 'digestive issues'],
      'E954': ['suspected carcinogen', 'digestive issues'],
      'E955': ['may affect gut microbiome', 'digestive issues'],
    };
    
    return additiveConcerns[code] || [];
  },
};

module.exports = productService; 