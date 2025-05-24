// Simple password-based authentication middleware for admin routes
module.exports = (req, res, next) => {
  // Allow access if already authenticated in session
  if (req.session && (req.session.isAdmin || req.session.isAuthenticated)) return next();

  // Check for password in POST body, query, or header
  const password = req.body.password || req.query.password || req.headers['x-admin-password'];
  const correctPassword = process.env.ADMIN_PASSWORD || 'Juicewrld32'; // Use the hardcoded password as fallback
  
  if (password === correctPassword) {
    if (req.session) {
      req.session.isAdmin = true;
      req.session.isAuthenticated = true;
    }
    return next();
  }

  // If not authenticated, redirect to the main page for GET requests
  if (req.method === 'GET') {
    return res.redirect('/?auth=failed');
  }

  // Otherwise, unauthorized
  res.status(401).send('Unauthorized');
}; 