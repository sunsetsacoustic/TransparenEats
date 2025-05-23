# TransparenEats API Caching System Implementation Guide

## Overview
Implement a product caching system that checks local database first, falls back to external APIs, and allows manual curation to build a refined product database over time.

## Database Schema

### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    brand VARCHAR(255),
    ingredients_raw TEXT,
    ingredients_list JSONB,
    flagged_additives JSONB,
    nutrition_data JSONB,
    image_url VARCHAR(500),
    category VARCHAR(100),
    source VARCHAR(50), -- 'curated', 'openfoodfacts', 'usda', 'nutritionix', etc.
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'not_found', 'pending_review'
    is_verified BOOLEAN DEFAULT FALSE,
    search_attempts INTEGER DEFAULT 1,
    last_searched TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_contributed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_verified ON products(is_verified);
```

## API Implementation

### 1. Update Existing Product Lookup Endpoint
- [ ] Modify current barcode scanning endpoint to check local database first
- [ ] Implement fallback logic to external APIs only if not found locally
- [ ] Save external API results to local database before returning
- [ ] Add response metadata indicating data source (local/external)

### 2. Core Product Lookup Function
```javascript
async function getProductData(barcode) {
    // Step 1: Check local database
    const localProduct = await checkLocalDatabase(barcode);
    if (localProduct && localProduct.status === 'active') {
        return {
            success: true,
            data: localProduct,
            fromCache: true,
            source: 'local'
        };
    }
    
    // Step 2: Check if we've searched before and found nothing
    if (localProduct && localProduct.status === 'not_found') {
        // Only retry after 24 hours
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (localProduct.last_searched > dayAgo) {
            return {
                success: false,
                message: 'Product not found',
                barcode: barcode
            };
        }
    }
    
    // Step 3: Query external APIs
    const externalResult = await queryExternalAPIs(barcode);
    
    if (externalResult.found) {
        // Save to database
        await saveToLocalDatabase(barcode, externalResult.data);
        return {
            success: true,
            data: externalResult.data,
            fromCache: false,
            source: externalResult.source
        };
    }
    
    // Step 4: Log failed search
    await logFailedSearch(barcode);
    return {
        success: false,
        message: 'Product not found',
        barcode: barcode,
        suggestions: [
            'Try scanning the barcode again',
            'Check if the barcode is clear and undamaged',
            'This might be a local/regional product not in our databases yet'
        ]
    };
}
```

### 3. External API Query Function
- [ ] Modify existing proxy service to try APIs in sequence
- [ ] Add proper error handling and logging
- [ ] Normalize data from different API sources
- [ ] Return standardized product object

### 4. Database Helper Functions
```javascript
// Check local database
async function checkLocalDatabase(barcode)

// Save external API result
async function saveToLocalDatabase(barcode, productData)

// Log failed searches for later manual curation
async function logFailedSearch(barcode)

// Update search attempts and timestamp
async function updateSearchMetadata(barcode)
```

## Admin/Curation Endpoints

### 5. Product Management API Routes
- [ ] `GET /api/admin/products` - List products with filtering and pagination
  - Query params: `page`, `limit`, `status`, `unverified`, `source`
- [ ] `GET /api/admin/products/:barcode` - Get specific product details
- [ ] `PUT /api/admin/products/:barcode` - Update/curate product information
- [ ] `DELETE /api/admin/products/:barcode` - Delete product entry
- [ ] `GET /api/admin/stats` - Dashboard stats (total products, unverified count, etc.)

### 6. Failed Search Management
- [ ] `GET /api/admin/failed-searches` - List products that couldn't be found
  - Sort by search_attempts DESC to prioritize popular unknown products
- [ ] `POST /api/admin/failed-searches/:barcode/resolve` - Mark as researched
- [ ] `GET /api/admin/failed-searches/popular` - Most searched unknown products

## User Contribution System

### 7. Lightweight User Contributions
- [ ] `POST /api/contribute/product/:barcode` - Submit basic product info
  - Accept: photo upload, product name, category
  - Create pending_review entry in database
- [ ] `GET /api/contribute/needed` - Get list of products needing contribution
  - Only show barcodes scanned 3+ times
- [ ] Add contribution UI that appears only when:
  - Same barcode scanned 3+ times by different users
  - User has successfully scanned 5+ products (engaged user)
  - Keep contribution form minimal (photo + name only)

### 8. Image Handling
- [ ] Set up image storage (start with external URLs from APIs)
- [ ] For user contributions: implement basic image upload
- [ ] Add image compression/optimization
- [ ] Consider using Cloudflare R2 or Backblaze B2 for cost-effective storage

## Frontend Integration

### 9. Update Barcode Scanning Logic
- [ ] Modify existing barcode scan handler to use new caching endpoint
- [ ] Add UI indicators for data source (cached vs fresh)
- [ ] Show appropriate messaging based on response type
- [ ] Handle "not found" scenarios gracefully

### 10. Admin Interface (Simple)
- [ ] Create basic admin dashboard for product curation
- [ ] List view with filters (unverified, failed searches, etc.)
- [ ] Edit form for product information
- [ ] Bulk actions for common curation tasks

### 11. Optional: User Contribution UI
- [ ] Add "Help improve our database" prompt for unknown products
- [ ] Simple photo upload + product name form
- [ ] Gamification elements (points, leaderboard) if desired
- [ ] Only show to engaged users at appropriate times

## Data Processing & Analysis

### 12. Ingredient Analysis Enhancement
- [ ] Update existing ingredient analysis to work with cached data structure
- [ ] Ensure flagged_additives JSON structure supports your current analysis
- [ ] Maintain compatibility with existing ingredient concern detection

### 13. Data Quality & Maintenance
- [ ] Add data validation for product entries
- [ ] Implement duplicate detection (same product, different barcodes)
- [ ] Create data cleanup scripts for malformed entries
- [ ] Add logging for data quality issues

## Performance & Optimization

### 14. Database Optimization
- [ ] Add appropriate indexes for common queries
- [ ] Implement connection pooling if not already present
- [ ] Consider read replicas if traffic grows
- [ ] Add database backup strategy

### 15. Caching & Performance
- [ ] Add Redis caching for frequently accessed products (optional)
- [ ] Implement rate limiting on external API calls
- [ ] Add request/response compression
- [ ] Monitor API response times and database query performance

## Monitoring & Analytics

### 16. Logging & Metrics
- [ ] Log all product lookups (cache hits vs misses)
- [ ] Track external API usage and costs
- [ ] Monitor failed search patterns
- [ ] Add basic analytics dashboard for admins

### 17. Error Handling & Resilience
- [ ] Implement circuit breakers for external APIs
- [ ] Add graceful degradation when external APIs are down
- [ ] Create alerts for high failure rates
- [ ] Add health check endpoints

## Deployment & Configuration

### 18. Environment Setup
- [ ] Add database configuration for production
- [ ] Set up environment variables for API keys
- [ ] Configure image storage credentials
- [ ] Add proper error logging in production

### 19. Migration Strategy
- [ ] Create database migration scripts
- [ ] Plan rollout strategy (gradual cache building)
- [ ] Backup existing data before implementation
- [ ] Test thoroughly with existing barcode scanning functionality

## Success Metrics

### 20. Key Performance Indicators
- [ ] Cache hit rate (target: >80% after initial period)
- [ ] Average response time improvement
- [ ] External API cost reduction
- [ ] Number of curated products
- [ ] User contribution rate (if implementing)

## Implementation Priority

### Phase 1 (Core Functionality)
- [ ] Database schema setup
- [ ] Basic caching logic in existing endpoints
- [ ] Failed search logging
- [ ] Simple admin interface

### Phase 2 (Enhancement)
- [ ] User contribution system
- [ ] Advanced admin features
- [ ] Performance optimizations
- [ ] Analytics and monitoring

### Phase 3 (Scale)
- [ ] Advanced caching strategies
- [ ] Image optimization
- [ ] Automated data quality tools
- [ ] Advanced user engagement features

## Notes for Implementation
- Start with existing Express.js backend structure
- Use PostgreSQL for production, SQLite for development/testing
- Maintain backward compatibility with existing frontend
- Implement gradually - core caching first, then enhancements
- Focus on user experience - caching should be invisible to users
- Keep admin interface simple initially, enhance based on usage patterns