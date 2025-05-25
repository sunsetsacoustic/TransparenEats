const productService = require('./src/api/services/productService');

const testBarcode = 'sample-barcode'; // Replace with a real barcode for testing

productService.queryExternalAPIs(testBarcode)
  .then(result => {
    console.log('External API Query Result:', result);
  })
  .catch(error => {
    console.error('Error querying external APIs:', error);
  }); 