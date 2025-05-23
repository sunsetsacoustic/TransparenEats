const app = require('./app');
const db = require('./db/db');
const cacheService = require('./services/cacheService');

const port = process.env.PORT || 5000;

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    await db.raw('SELECT 1');
    console.log('✅ Database connection established');
    
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
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
