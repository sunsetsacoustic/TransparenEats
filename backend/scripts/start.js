/**
 * Startup script for production environment
 * 
 * This script is used to ensure proper environment setup
 * before starting the application
 */

const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Starting TransparenEats API...');

// Log the current environment
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Working directory: ${process.cwd()}`);

// Check for critical environment variables
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Warning: DATABASE_URL is not set. Database connections may fail.');
}

// Start the application
console.log('Starting application...');
const app = spawn('node', ['src/index.js'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

// Handle process events
app.on('close', (code) => {
  console.log(`Application process exited with code ${code}`);
});

process.on('SIGINT', () => {
  console.log('Caught interrupt signal, shutting down gracefully');
  app.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Caught terminate signal, shutting down gracefully');
  app.kill('SIGTERM');
}); 