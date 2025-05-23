# TransparenEats API Caching System

This is an implementation of the TransparenEats API caching system that checks a local database first, falls back to external APIs, and allows manual curation to build a refined product database over time.

## Features

- Local database caching of product information
- Fallback to external APIs (Open Food Facts, USDA, Nutritionix)
- Admin interfaces for product curation
- User contribution system
- Failed search tracking for manual curation

## Setup

### Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (or create a new `.env` file)
   - Update database credentials and API keys in `.env`

3. Set up the database:
   ```
   node setup-db.js
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Product Lookup

- `GET /api/v1/products/:barcode` - Get product information by barcode with caching

### Admin Endpoints

- `GET /api/v1/products/admin/list` - List products with filtering and pagination
- `GET /api/v1/products/admin/:barcode` - Get specific product details
- `PUT /api/v1/products/admin/:barcode` - Update/curate product information
- `DELETE /api/v1/products/admin/:barcode` - Delete product entry
- `GET /api/v1/products/admin/failed-searches` - List products that couldn't be found

### User Contribution Endpoints

- `POST /api/v1/products/contribute/:barcode` - Submit basic product info
- `GET /api/v1/products/contribute/needed` - Get list of products needing contribution

## Database Migration

- Run migrations: `npm run migrate`
- Rollback migrations: `npm run migrate:rollback`

## UI Interfaces

### Admin Dashboard

A simple admin dashboard is available for product curation:

- Access at `/admin`
- Features:
  - View and manage products in the database
  - Filter by source, verification status
  - Edit product details
  - View failed searches
  - Add missing products
  - Access to analytics dashboard

### Analytics Dashboard

A comprehensive analytics dashboard for monitoring API usage:

- Access at `/admin/analytics`
- Features:
  - Real-time API usage statistics
  - Cache hit rate monitoring
  - External API call tracking
  - Database statistics
  - Request logs viewer
  - Error logs viewer

### User Contribution

A user-friendly contribution form is available for community participation:

- Access at `/contribute`
- Features:
  - Scan barcodes with camera
  - Submit basic product information
  - Upload product images
  - See which products need contribution

## Performance Optimizations

- Redis caching for frequently accessed products
- Two-layer caching strategy:
  - Memory cache (Redis) for fastest access
  - Database cache as fallback
- Intelligent cache invalidation on product updates
- Response time tracking and monitoring

## Implementation Phases

### Phase 1 (Core Functionality)
- [x] Database schema setup
- [x] Basic caching logic in existing endpoints
- [x] Failed search logging
- [x] Simple admin interface

### Phase 2 (Enhancement)
- [x] User contribution system
- [x] Advanced admin features
- [x] Performance optimizations
- [x] Analytics and monitoring

### Phase 3 (Scale)
- [ ] Advanced caching strategies
- [ ] Image optimization
- [ ] Automated data quality tools
- [ ] Advanced user engagement features
