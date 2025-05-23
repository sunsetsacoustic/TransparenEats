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

  // Check if this is a direct request to /admin or /admin/analytics
  const adminRegex = /^\/admin(\/analytics)?$/;
  if (adminRegex.test(req.path)) {
    console.log(`Admin middleware handling route: ${req.path}`);
    
    // Determine which file to serve
    let filePath;
    if (req.path === '/admin/analytics') {
      filePath = path.join(__dirname, '../../public/admin/analytics.html');
    } else if (req.path === '/admin') {
      filePath = path.join(__dirname, '../../public/admin/index.html');
    }
    
    // Check if file exists
    if (filePath && fs.existsSync(filePath)) {
      console.log(`Serving admin file: ${filePath}`);
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