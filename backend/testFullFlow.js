const productService = require('./src/api/services/productService');

async function testFullFlow() {
  try {
    // Test with a real barcode that should be found in an external API
    const testBarcode = '8850625005035'; // Example barcode, change to match a real product
    
    console.log(`Testing full flow for barcode: ${testBarcode}`);
    console.log('Step 1: Call getProductData to simulate a scan...');
    
    // This function is called when a barcode is scanned
    const result = await productService.getProductData(testBarcode);
    
    console.log('Result from getProductData:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check success status
    if (result.success) {
      console.log('✅ Product found successfully!');
      console.log(`Source: ${result.source}`);
      console.log(`From cache: ${result.fromCache ? 'Yes' : 'No'}`);
      
      // Check if the product data is properly structured
      if (result.data) {
        console.log('Product data structure:');
        console.log(`- Name: ${result.data.name}`);
        console.log(`- Brand: ${result.data.brand}`);
        console.log(`- Has ingredients: ${result.data.ingredients_raw ? 'Yes' : 'No'}`);
        console.log(`- Has nutrition data: ${result.data.nutrition_data ? 'Yes' : 'No'}`);
      }
    } else {
      console.log('❌ Product not found!');
      console.log(`Message: ${result.message}`);
      
      if (result.suggestions) {
        console.log('Suggestions:');
        result.suggestions.forEach((suggestion, i) => {
          console.log(`  ${i+1}. ${suggestion}`);
        });
      }
    }
    
    // Now check if the product was saved to the database
    console.log('\nStep 2: Verify if product was saved to database...');
    const Product = require('./src/db/models/Product');
    const localProduct = await Product.findByBarcode(testBarcode);
    
    if (localProduct) {
      console.log('✅ Product found in database:');
      console.log(`- Status: ${localProduct.status}`);
      console.log(`- Source: ${localProduct.source}`);
    } else {
      console.log('❌ Product NOT found in database!');
      console.log('This might indicate a problem with saving to the database.');
    }
    
    // Test Redis cache
    console.log('\nStep 3: Check if product is in Redis cache...');
    const cacheService = require('./src/services/cacheService');
    const cacheKey = cacheService.getProductCacheKey(testBarcode);
    const cachedProduct = await cacheService.getFromCache(cacheKey);
    
    if (cachedProduct) {
      console.log('✅ Product found in cache!');
    } else {
      console.log('❌ Product NOT found in cache!');
      console.log('This might indicate a problem with caching.');
    }
    
  } catch (error) {
    console.error('Error in test flow:', error);
  }
}

testFullFlow(); 