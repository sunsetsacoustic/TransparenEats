const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const fs = require('fs');
const session = require('express-session');

require('dotenv').config();

// Import middlewares
const requestLogger = require('./middlewares/requestLogger');
const adminMiddleware = require('./middlewares/adminMiddleware');
const adminAuth = require('./middlewares/auth');
const api = require('./api');

const app = express();

// Enable CORS for all routes with credentials and multiple frontend domains
app.use(cors({
  origin: [
    'https://transparen-eats.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

// Basic request logging
app.use(logger('dev'));

// Simple session with memory store for now
app.use(session({
  name: 'transpareneats.sid',
  secret: process.env.SESSION_SECRET || 'Juicewrld32SecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production, 'lax' for development
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Admin password protection - but allow access if session has auth token
app.use('/admin', (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  adminAuth(req, res, next);
});
app.use('/admin/analytics', (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  adminAuth(req, res, next);
});

// Special route for products admin that sets the authenticated session
app.get('/products-admin', (req, res) => {
  // Mark user as authenticated in their session
  req.session.isAuthenticated = true;
  res.sendFile(path.join(__dirname, '../public/admin/products.html'));
});

// Redirect from root to the frontend app
app.get('/', (req, res) => {
  const frontendURL = process.env.FRONTEND_URL || 'https://transparen-eats.vercel.app';
  res.redirect(frontendURL);
});

// Admin routes middleware (must be before static files)
app.use(adminMiddleware);

// Serve static files with appropriate caching headers
app.use(express.static(path.join(__dirname, '../public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set no-cache for HTML files
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Add analytics and detailed request logging
app.use(requestLogger.requestLogger);

// Admin dashboard route
app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, '../public/admin/index.html');
  console.log(`Admin request received. Path: ${adminPath}`);
  console.log(`File exists: ${fs.existsSync(adminPath)}`);
  
  try {
    if (!fs.existsSync(adminPath)) {
      console.log('Admin file not found, creating it...');
      // Ensure directory exists
      const adminDir = path.join(__dirname, '../public/admin');
      if (!fs.existsSync(adminDir)) {
        fs.mkdirSync(adminDir, { recursive: true, mode: 0o755 });
        console.log('Created admin directory');
      }
      
      // Create basic admin file
      const basicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TransparenEats Admin</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #4caf50; }
  </style>
</head>
<body>
  <h1>TransparenEats Admin Dashboard</h1>
  <p>This is a placeholder admin dashboard.</p>
  <p><a href="/admin/analytics">View Analytics</a></p>
</body>
</html>`;
      
      fs.writeFileSync(adminPath, basicHtml, { mode: 0o644 });
      console.log('Created admin file');
      console.log(`File exists after creation: ${fs.existsSync(adminPath)}`);
      console.log(`File size: ${fs.statSync(adminPath).size} bytes`);
    }
    
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(adminPath);
  } catch (err) {
    console.error('Error serving admin file:', err);
    res.status(500).send('Error serving admin dashboard: ' + err.message);
  }
});

// Analytics dashboard route
app.get('/admin/analytics', (req, res) => {
  const analyticsPath = path.join(__dirname, '../public/admin/analytics.html');
  console.log(`Analytics request received. Path: ${analyticsPath}`);
  console.log(`File exists: ${fs.existsSync(analyticsPath)}`);
  
  try {
    if (!fs.existsSync(analyticsPath)) {
      console.log('Analytics file not found, creating it...');
      // Ensure directory exists
      const adminDir = path.join(__dirname, '../public/admin');
      if (!fs.existsSync(adminDir)) {
        fs.mkdirSync(adminDir, { recursive: true, mode: 0o755 });
        console.log('Created admin directory');
      }
      
      // Create basic analytics file
      const analyticsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TransparenEats Analytics</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #2196f3; }
  </style>
</head>
<body>
  <h1>TransparenEats Analytics Dashboard</h1>
  <p>This is a placeholder analytics dashboard.</p>
  <p><a href="/admin">Back to Admin</a></p>
</body>
</html>`;
      
      fs.writeFileSync(analyticsPath, analyticsHtml, { mode: 0o644 });
      console.log('Created analytics file');
      console.log(`File exists after creation: ${fs.existsSync(analyticsPath)}`);
      console.log(`File size: ${fs.statSync(analyticsPath).size} bytes`);
    }
    
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(analyticsPath);
  } catch (err) {
    console.error('Error serving analytics file:', err);
    res.status(500).send('Error serving analytics dashboard: ' + err.message);
  }
});

// Contribution page route
app.get('/contribute', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contribute.html'));
});

// API routes
app.use('/api/v1', api);

// Add a backward compatibility route for apps still using the old URL pattern
app.use('/api', (req, res, next) => {
  // Special case for products endpoint to maintain compatibility
  if (req.path.startsWith('/products/')) {
    const newPath = '/api/v1' + req.path;
    console.log(`Redirecting legacy API request from ${req.path} to ${newPath}`);
    req.url = req.path;
    return api(req, res, next);
  }
  
  // For other API endpoints, forward to the v1 router
  if (!req.path.startsWith('/v1/')) {
    console.log(`Forwarding API request to v1: ${req.path}`);
    req.url = '/v1' + req.path;
    return api(req, res, next);
  }
  
  next();
});

// Special catch-all route for admin SPA
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Not Found middleware
const notFound = (req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  res.json({
    message: 'Not Found - The requested resource does not exist',
    url: req.originalUrl
  });
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;

