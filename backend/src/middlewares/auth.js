// Simple password-based authentication middleware for admin routes
module.exports = (req, res, next) => {
  // Allow access if already authenticated in session
  if (req.session && req.session.isAdmin) return next();

  // Check for password in POST body, query, or header
  const password = req.body.password || req.query.password || req.headers['x-admin-password'];
  if (password === process.env.ADMIN_PASSWORD) {
    if (req.session) req.session.isAdmin = true;
    return next();
  }

  // If not authenticated, show a 401 for GET requests
  if (req.method === 'GET') {
    return res.status(401).send('Unauthorized');
  }

  // Otherwise, unauthorized
  res.status(401).send('Unauthorized');
}; 