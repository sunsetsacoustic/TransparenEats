/**
 * TransparenEats API Startup Script
 * 
 * This script checks dependencies and starts the application
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

function checkEnvironment() {
  console.log('🔍 Checking environment setup...');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    
    if (fs.existsSync(envExamplePath)) {
      console.log('📝 Creating .env file from .env.example');
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ .env file created! Please edit it with your actual database credentials and API keys.');
    } else {
      console.error('❌ .env.example file not found. Please create a .env file manually.');
      process.exit(1);
    }
  } else {
    console.log('✅ .env file found');
  }
}

function setupDatabase() {
  try {
    console.log('🔍 Checking database setup...');
    
    // Try to run the database setup script
    console.log('🛠️ Running database setup script...');
    execSync('node setup-db.js', { stdio: 'inherit' });
    
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('  - Make sure PostgreSQL is installed and running');
    console.log('  - Check your database credentials in the .env file');
    console.log('  - If using Docker, ensure the container is running');
    console.log('    docker run --name transpareneats-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=transpareneats_dev -p 5432:5432 -d postgres:14-alpine');
    process.exit(1);
  }
}

function startApplication() {
  try {
    console.log('🚀 Starting TransparenEats API...');
    
    // Start the application in development mode
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Application startup failed:', error.message);
    process.exit(1);
  }
}

// Main execution
console.log('🌟 TransparenEats API Setup');
console.log('==========================');

checkEnvironment();
setupDatabase();
startApplication(); 