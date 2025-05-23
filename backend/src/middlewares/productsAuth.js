// Bypass authentication middleware for products admin routes
module.exports = (req, res, next) => {
  // Always allow access to products admin routes
  console.log('Bypassing auth for products admin route:', req.originalUrl);
  
  // Set admin flag in session to ensure full access
  if (req.session) req.session.isAdmin = true;
  
  return next();
}; 