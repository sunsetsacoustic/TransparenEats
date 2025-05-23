const redis = require('redis');
const { promisify } = require('util');

// Environment variables
const REDIS_URL = process.env.REDIS_URL || 'localhost:6379';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600; // Default 1 hour in seconds

// Default to disabled in production unless explicitly enabled
const isProd = process.env.NODE_ENV === 'production';
const ENABLE_REDIS = isProd 
  ? process.env.ENABLE_REDIS === 'true' // Explicitly enable in production
  : process.env.ENABLE_REDIS !== 'false'; // Enable by default in dev unless explicitly disabled

// Create Redis client
let client = null;

// Default to non-caching behavior
const createNoOpClient = () => {
  console.log('Running with in-memory cache (Redis disabled)');
  
  // Simple in-memory cache
  const memoryCache = new Map();
  
  return {
    get: async (key) => {
      const item = memoryCache.get(key);
      if (!item) return null;
      
      // Check if item is expired
      if (item.expiry && item.expiry < Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      
      return item.value;
    },
    setEx: async (key, ttl, value) => {
      memoryCache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
      });
    },
    del: async (key) => {
      memoryCache.delete(key);
    },
    flushAll: async () => {
      memoryCache.clear();
    }
  };
};

/**
 * Initialize Redis client
 * @returns {Promise<void>}
 */
async function initRedisClient() {
  // If Redis is disabled, use no-op client
  if (!ENABLE_REDIS) {
    client = createNoOpClient();
    return;
  }
  
  // Don't try to connect to Redis if URL is not set
  if (!process.env.REDIS_URL && isProd) {
    console.log('No REDIS_URL provided in production. Using in-memory cache.');
    client = createNoOpClient();
    return;
  }
  
  try {
    console.log('Attempting to connect to Redis...');
    
    // Parse host and port from URL
    const [host, portStr] = REDIS_URL.split(':');
    const port = parseInt(portStr || '6379', 10);
    
    console.log(`Using Redis at ${host}:${port}`);
    
    // Create Redis client with direct connection
    client = redis.createClient({
      socket: {
        host,
        port
      },
      legacyMode: true // Use legacy mode for better compatibility
    });

    // Handle events
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      // Don't crash the application on Redis errors after initial connection
    });

    client.on('connect', () => {
      console.log('Connected to Redis successfully');
    });

    // Connect to Redis with timeout
    const connectPromise = client.connect();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Redis connection timeout after 5 seconds')), 5000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('Redis cache service initialized');
    
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    console.log('Falling back to in-memory cache');
    
    // Fallback to a non-Redis caching behavior
    client = createNoOpClient();
  }
}

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} Cached value or null if not found
 */
async function getFromCache(key) {
  try {
    if (!client) return null;
    
    // Handle legacy mode
    if (client.legacyMode) {
      return new Promise((resolve, reject) => {
        client.get(key, (err, data) => {
          if (err) return reject(err);
          if (!data) return resolve(null);
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      });
    }
    
    const cachedData = await client.get(key);
    if (!cachedData) return null;
    
    return JSON.parse(cachedData);
  } catch (error) {
    console.error(`Error getting key ${key} from cache:`, error);
    return null;
  }
}

/**
 * Set item in cache with expiration
 * @param {string} key - Cache key
 * @param {object} value - Value to cache
 * @param {number} [ttl=CACHE_TTL] - Time to live in seconds
 * @returns {Promise<void>}
 */
async function setInCache(key, value, ttl = CACHE_TTL) {
  try {
    if (!client) return;
    
    const jsonValue = JSON.stringify(value);
    
    // Handle legacy mode
    if (client.legacyMode) {
      return new Promise((resolve, reject) => {
        client.setex(key, ttl, jsonValue, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
    
    await client.setEx(key, ttl, jsonValue);
  } catch (error) {
    console.error(`Error setting key ${key} in cache:`, error);
  }
}

/**
 * Remove item from cache
 * @param {string} key - Cache key to remove
 * @returns {Promise<void>}
 */
async function removeFromCache(key) {
  try {
    if (!client) return;
    
    // Handle legacy mode
    if (client.legacyMode) {
      return new Promise((resolve, reject) => {
        client.del(key, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
    
    await client.del(key);
  } catch (error) {
    console.error(`Error removing key ${key} from cache:`, error);
  }
}

/**
 * Clear entire cache
 * @returns {Promise<void>}
 */
async function clearCache() {
  try {
    if (!client) return;
    
    // Handle legacy mode
    if (client.legacyMode) {
      return new Promise((resolve, reject) => {
        client.flushall((err) => {
          if (err) return reject(err);
          console.log('Cache cleared');
          resolve();
        });
      });
    }
    
    await client.flushAll();
    console.log('Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Generate a standard cache key for a product
 * @param {string} barcode - Product barcode
 * @returns {string} Formatted cache key
 */
function getProductCacheKey(barcode) {
  return `product:${barcode}`;
}

module.exports = {
  initRedisClient,
  getFromCache,
  setInCache,
  removeFromCache,
  clearCache,
  getProductCacheKey
}; 