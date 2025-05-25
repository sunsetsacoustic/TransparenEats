const Product = require('./src/db/models/Product');
const cacheService = require('./src/services/cacheService');

async function testDatabaseQueries() {
  try {
    console.log('Testing database queries for products...');
    
    // Test barcode
    const testBarcode = 'sample-barcode';
    
    // Check if product exists in database
    console.log(`Checking if product with barcode ${testBarcode} exists in database...`);
    const localProduct = await Product.findByBarcode(testBarcode);
    
    if (localProduct) {
      console.log('Product found in database:');
      console.log(JSON.stringify(localProduct, null, 2));
      
      // Check product status
      console.log(`Product status: ${localProduct.status}`);
      if (localProduct.status === 'not_found') {
        console.log('WARNING: Product is marked as not_found in the database!');
      }
    } else {
      console.log(`Product with barcode ${testBarcode} not found in database.`);
    }
    
    // Check cache
    const cacheKey = cacheService.getProductCacheKey(testBarcode);
    console.log(`Checking if product exists in cache with key: ${cacheKey}`);
    const cachedProduct = await cacheService.getFromCache(cacheKey);
    
    if (cachedProduct) {
      console.log('Product found in cache:');
      console.log(JSON.stringify(cachedProduct, null, 2));
    } else {
      console.log('Product not found in cache.');
    }
    
  } catch (error) {
    console.error('Error testing database queries:', error);
  }
}

testDatabaseQueries(); 