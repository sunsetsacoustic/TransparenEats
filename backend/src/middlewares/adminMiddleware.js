/**
 * Admin routes middleware
 * 
 * This middleware ensures that admin routes work properly in production environments
 * by handling direct URL access and reloads.
 */

const path = require('path');
const fs = require('fs');

/**
 * Middleware to handle admin routes in production
 */
const adminMiddleware = (req, res, next) => {
  // Only process GET requests to admin routes
  if (req.method !== 'GET') {
    return next();
  }

  // Check if this is a direct request to /admin or /admin/analytics or any admin subpath
  if (req.path.startsWith('/admin')) {
    console.log(`Admin middleware handling route: ${req.path}`);
    
    // Determine which file to serve
    let filePath;
    if (req.path === '/admin/analytics') {
      filePath = path.join(__dirname, '../../public/admin/analytics.html');
    } else if (req.path === '/admin' || req.path.startsWith('/admin/')) {
      filePath = path.join(__dirname, '../../public/admin/index.html');
    }
    
    // Check if file exists
    if (filePath && fs.existsSync(filePath)) {
      console.log(`Serving admin file: ${filePath}`);
      // Set cache control to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.sendFile(filePath);
    } else {
      console.error(`Admin file not found: ${filePath}`);
      // If file doesn't exist, try to create it (this is handled in app.js)
    }
  }
  
  // Not an admin route or couldn't handle it, continue to next middleware
  next();
};

module.exports = adminMiddleware; 