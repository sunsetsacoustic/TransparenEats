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

  // If not authenticated, show a login form (for GET requests)
  if (req.method === 'GET') {
    return res.send(`
      <html><body style="font-family:sans-serif;max-width:400px;margin:40px auto;">
        <h2>Admin Login</h2>
        <form method="POST">
          <input type="password" name="password" placeholder="Password" style="width:100%;padding:8px;" autofocus required />
          <button type="submit" style="margin-top:10px;padding:8px 16px;">Login</button>
        </form>
      </body></html>
    `);
  }

  // Otherwise, unauthorized
  res.status(401).send('Unauthorized');
}; 