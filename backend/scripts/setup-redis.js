/**
 * Redis Setup Helper Script
 * Tests Redis connection and provides installation instructions if needed
 */

const redis = require('redis');
require('dotenv').config();

// Get Redis URL from environment
const REDIS_URL = process.env.REDIS_URL || 'localhost:6379';

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...');
  console.log(`   Attempting to connect to: ${REDIS_URL}`);
  
  try {
    // Parse host and port from URL
    const [host, portStr] = REDIS_URL.split(':');
    const port = parseInt(portStr || '6379', 10);
    
    console.log(`   Using host: ${host}, port: ${port}`);
    
    // Create Redis client with direct connection
    const client = redis.createClient({
      socket: {
        host,
        port
      },
      legacyMode: true
    });
    
    // Set up event handlers
    client.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
      showSetupInstructions();
      process.exit(1);
    });
    
    // Connect to Redis
    await client.connect();
    
    // Test connection in legacy mode
    client.set('test_connection', 'success', (err) => {
      if (err) throw err;
      
      client.get('test_connection', (err, reply) => {
        if (err) throw err;
        
        if (reply === 'success') {
          console.log('✅ Redis connection test successful!');
          
          // Delete test key
          client.del('test_connection', async (err) => {
            if (err) console.error('Warning: Could not delete test key', err);
            
            // Close connection
            await client.quit();
            process.exit(0);
          });
        } else {
          throw new Error('Test key value mismatch');
        }
      });
    });
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    showSetupInstructions();
    process.exit(1);
  }
}

function showSetupInstructions() {
  console.log('\n📋 Redis Setup Instructions:');
  console.log('----------------------------');
  console.log('1. Install Redis on your system:');
  console.log('   • Windows: https://github.com/microsoftarchive/redis/releases');
  console.log('   • macOS: brew install redis');
  console.log('   • Linux: sudo apt-get install redis-server');
  console.log('   • Docker: docker run --name transpareneats-redis -p 6379:6379 -d redis:alpine');
  console.log('\n2. Ensure Redis is running:');
  console.log('   • Windows: Start the Redis server executable');
  console.log('   • macOS/Linux: sudo service redis-server start or sudo systemctl start redis');
  console.log('   • Docker: docker start transpareneats-redis');
  console.log('\n3. Verify Redis configuration in .env file:');
  console.log('   REDIS_URL=localhost:6379');
}

// Run test
testRedisConnection(); 