const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

require('dotenv').config();

const middlewares = require('./middlewares');
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
app.use(middlewares.requestLogger);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'TransparenEats API - Welcome to the API',
  });
});

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Analytics dashboard route
app.get('/admin/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/analytics.html'));
});

// Contribution page route
app.get('/contribute', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/contribute.html'));
});

// API routes
app.use('/api/v1', api);

// Error handling middleware
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;

