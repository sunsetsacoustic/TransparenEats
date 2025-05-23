const app = require('./app');
const db = require('./db/db');
const cacheService = require('./services/cacheService');

const port = process.env.PORT || 5000;

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    try {
      await db.raw('SELECT 1');
      console.log('✅ Database connection established');
    } catch (dbError) {
      console.warn('⚠️ Database connection failed:', dbError.message);
      console.warn('Continuing without database connection...');
    }
    
    // Initialize cache service
    try {
      await cacheService.initRedisClient();
      console.log('✅ Cache service initialized');
    } catch (cacheError) {
      console.warn('⚠️ Cache service initialization failed, continuing without caching:', cacheError.message);
    }
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
