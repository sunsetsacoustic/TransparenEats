const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');

const offRouter = require('./off');
const nutritionixRouter = require('./nutritionix');
const usdaRouter = require('./usda');

const router = express.Router();
const upload = multer();

console.log('API router loaded');

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

// Upload product and images to Open Food Facts
router.post('/uploadProduct', upload.fields([
  { name: 'image_front', maxCount: 1 },
  { name: 'image_ingredients', maxCount: 1 },
  { name: 'image_nutrition', maxCount: 1 },
]), async (req, res) => {
  try {
    const { barcode, product_name, ingredients_text } = req.body;
    const user_id = process.env.OFF_USER;
    const password = process.env.OFF_PASS;
    // 1. Upload product data
    const productRes = await fetch('https://world.openfoodfacts.org/api/v0/product/' + barcode + '.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: barcode,
        product_name,
        ingredients_text,
        user_id,
        password,
      }).toString(),
    });
    const productData = await productRes.json();
    if (!productData.status || productData.status !== 1) {
      return res.status(400).json({ error: productData.error || 'Failed to upload product data.' });
    }
    // 2. Upload images if provided
    const uploadImage = async (file, field) => {
      const imgForm = new FormData();
      imgForm.append('code', barcode);
      imgForm.append('imagefield', field);
      imgForm.append(`imgupload_${field}`, file.buffer, { filename: file.originalname });
      imgForm.append('user_id', user_id);
      imgForm.append('password', password);
      const imgRes = await fetch('https://world.openfoodfacts.org/cgi/product_image_upload.pl', {
        method: 'POST',
        body: imgForm,
      });
      const imgData = await imgRes.json();
      if (!imgData.status || imgData.status !== 1) {
        throw new Error(imgData.error || `Failed to upload ${field} image.`);
      }
    };
    if (req.files.image_front) await uploadImage(req.files.image_front[0], 'front');
    if (req.files.image_ingredients) await uploadImage(req.files.image_ingredients[0], 'ingredients');
    if (req.files.image_nutrition) await uploadImage(req.files.image_nutrition[0], 'nutrition');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Failed to upload product.' });
  }
});

// Mount logical routers
router.use('/off', offRouter);
router.use('/nutritionix', nutritionixRouter);
router.use('/usda', usdaRouter);

module.exports = router;
