/**
 * Request logger middleware for analytics
 * Logs requests and tracks performance metrics
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const apiLogFile = path.join(logsDir, 'api_requests.log');
const errorLogFile = path.join(logsDir, 'errors.log');

// Counters for in-memory analytics
const requestCounts = {
  total: 0,
  byEndpoint: {},
  byMethod: {},
  byStatusCode: {},
  cacheHits: 0,
  cacheMisses: 0,
  externalApiCalls: {
    off: 0,
    usda: 0,
    nutritionix: 0
  },
  userContributions: 0,
  failedSearches: 0
};

/**
 * Log request to file
 * @param {Object} logData - Log data to write
 * @param {string} [logFile=apiLogFile] - Log file path
 */
function logToFile(logData, logFile = apiLogFile) {
  const logEntry = JSON.stringify({
    ...logData,
    timestamp: new Date().toISOString()
  }) + '\n';
  
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}

/**
 * Update in-memory analytics counters
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {number} responseTime - Response time in ms
 */
function updateAnalytics(req, res, responseTime) {
  // Increment total requests
  requestCounts.total++;
  
  // Track by endpoint (simplified path)
  const endpoint = req.originalUrl.split('?')[0]; // Remove query params
  requestCounts.byEndpoint[endpoint] = (requestCounts.byEndpoint[endpoint] || 0) + 1;
  
  // Track by method
  requestCounts.byMethod[req.method] = (requestCounts.byMethod[req.method] || 0) + 1;
  
  // Track by status code
  const statusCode = res.statusCode.toString();
  requestCounts.byStatusCode[statusCode] = (requestCounts.byStatusCode[statusCode] || 0) + 1;
  
  // Track cache hits/misses
  if (res.locals.fromCache) {
    requestCounts.cacheHits++;
  } else if (req.originalUrl.includes('/products/')) {
    requestCounts.cacheMisses++;
  }
  
  // Track user contributions
  if (req.method === 'POST' && req.originalUrl.includes('/contribute/')) {
    requestCounts.userContributions++;
  }
  
  // Track external API calls (set by productService)
  const source = res.locals.source;
  if (source) {
    if (source === 'openfoodfacts') requestCounts.externalApiCalls.off++;
    else if (source === 'usda') requestCounts.externalApiCalls.usda++;
    else if (source === 'nutritionix') requestCounts.externalApiCalls.nutritionix++;
  }
  
  // Track failed searches
  if (req.originalUrl.includes('/products/') && res.statusCode === 404) {
    requestCounts.failedSearches++;
  }
}

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
  // Skip static files
  if (req.originalUrl.startsWith('/images/') || 
      req.originalUrl.startsWith('/javascripts/') || 
      req.originalUrl.startsWith('/stylesheets/')) {
    return next();
  }
  
  // Record start time
  const startTime = Date.now();
  
  // Store original send method
  const originalSend = res.send;
  
  // Override send method to capture response and timing
  res.send = function(body) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Add response time header
    res.set('X-Response-Time', `${responseTime}ms`);
    
    // Log request details
    const logData = {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime,
      contentLength: body ? body.length : 0,
      fromCache: res.locals.fromCache || false,
      cacheType: res.locals.cacheType || 'none',
      source: res.locals.source || 'unknown'
    };
    
    // Log to file
    logToFile(logData);
    
    // Update analytics
    updateAnalytics(req, res, responseTime);
    
    // Log errors separately
    if (res.statusCode >= 400) {
      logToFile({
        ...logData,
        requestBody: req.body,
        error: res.locals.error
      }, errorLogFile);
    }
    
    // Call original send
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Get current analytics data
 * @returns {Object} Analytics data
 */
function getAnalytics() {
  return {
    ...requestCounts,
    timestamp: new Date().toISOString()
  };
}

/**
 * Reset analytics counters
 */
function resetAnalytics() {
  requestCounts.total = 0;
  requestCounts.byEndpoint = {};
  requestCounts.byMethod = {};
  requestCounts.byStatusCode = {};
  requestCounts.cacheHits = 0;
  requestCounts.cacheMisses = 0;
  requestCounts.externalApiCalls = {
    off: 0,
    usda: 0,
    nutritionix: 0
  };
  requestCounts.userContributions = 0;
  requestCounts.failedSearches = 0;
}

module.exports = {
  requestLogger,
  getAnalytics,
  resetAnalytics
}; 