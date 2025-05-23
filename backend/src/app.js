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

// Enable CORS for all routes
app.use(cors());

// Basic request logging
app.use(logger('dev'));

// Session support for admin login
app.use(session({
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

// Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Admin password protection
app.use('/admin', adminAuth);
app.use('/admin/analytics', adminAuth);

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

