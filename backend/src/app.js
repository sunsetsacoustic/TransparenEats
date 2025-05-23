const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const fs = require('fs');

require('dotenv').config();

// Import requestLogger middleware
const requestLogger = require('./middlewares/requestLogger');
const api = require('./api');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Basic request logging
app.use(logger('dev'));

// Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Add analytics and detailed request logging
app.use(requestLogger.requestLogger);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'TransparenEats API - Welcome to the API',
  });
});

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
        fs.mkdirSync(adminDir, { recursive: true });
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
      
      fs.writeFileSync(adminPath, basicHtml);
      console.log('Created admin file');
    }
    
    res.sendFile(adminPath);
  } catch (err) {
    console.error('Error serving admin file:', err);
    res.status(500).send('Error serving admin dashboard');
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
        fs.mkdirSync(adminDir, { recursive: true });
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
      
      fs.writeFileSync(analyticsPath, analyticsHtml);
      console.log('Created analytics file');
    }
    
    res.sendFile(analyticsPath);
  } catch (err) {
    console.error('Error serving analytics file:', err);
    res.status(500).send('Error serving analytics dashboard');
  }
});

// Contribution page route
app.get('/contribute', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contribute.html'));
});

// API routes
app.use('/api/v1', api);

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

