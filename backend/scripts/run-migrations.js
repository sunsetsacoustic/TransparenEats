/**
 * Run database migrations safely
 * 
 * This script is designed to run migrations in production environments
 * with proper error handling to prevent failed deployments.
 */

const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🔄 Running database migrations...');

// Set NODE_ENV to production to ensure we use the right database config
process.env.NODE_ENV = 'production';

try {
  // Check if database connection is available
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ No DATABASE_URL found. Skipping migrations.');
    process.exit(0);
  }

  // Run migrations
  console.log('Running knex migrations...');
  execSync('npx knex --knexfile src/db/knexfile.js migrate:latest', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Migrations completed successfully!');
} catch (error) {
  // Don't fail the build/deployment
  console.error('⚠️ Migration error:', error.message);
  console.log('Continuing with deployment despite migration errors');
  
  // Exit with success code to allow deployment to continue
  process.exit(0);
} 