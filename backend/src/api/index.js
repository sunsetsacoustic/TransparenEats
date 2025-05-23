const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const offRouter = require('./off');
const nutritionixRouter = require('./nutritionix');
const usdaRouter = require('./usda');
const additiveProxyRouter = require('./additiveProxy');
const productsRouter = require('./products');
const analyticsRouter = require('./analytics');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/images/products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use barcode as filename if available
    const barcode = req.params.barcode || Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${barcode}${ext}`);
  }
});

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure the upload middleware
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  }
});

// Upload middleware for product contributions
router.use('/products/contribute/:barcode', upload.single('image'));

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

// Admin login route
router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true, message: 'Logged in' });
  }
  res.status(401).json({ success: false, message: 'Invalid password' });
});

// Mount logical routers
router.use('/off', offRouter);
router.use('/nutritionix', nutritionixRouter);
router.use('/usda', usdaRouter);
router.use('/additiveProxy', additiveProxyRouter);
router.use('/products', productsRouter);
router.use('/analytics', analyticsRouter);

module.exports = router;
