/**
 * Script to run database migrations
 */
const path = require('path');
const { execSync } = require('child_process');

console.log('Running database migrations...');

try {
  // Set production environment for migrations
  process.env.NODE_ENV = 'production';
  
  // Path to knexfile
  const knexfilePath = path.resolve(__dirname, '../src/db/knexfile.js');
  
  // Run the migrations
  execSync(`npx knex migrate:latest --knexfile "${knexfilePath}"`, {
    stdio: 'inherit'
  });
  
  console.log('Migrations completed successfully.');
} catch (error) {
  console.error('Error running migrations:', error.message);
  process.exit(1);
} 