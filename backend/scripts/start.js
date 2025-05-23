/**
 * Startup script for production environment
 * 
 * This script is used to ensure proper environment setup
 * before starting the application
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('🚀 Starting TransparenEats API...');

// Log the current environment
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Working directory: ${process.cwd()}`);

// Check for critical environment variables
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Warning: DATABASE_URL is not set. Database connections may fail.');
}

// Run the copy-public script first to ensure admin files exist
console.log('Ensuring admin files are created...');
try {
  require('./copy-public');
  console.log('Admin files setup completed');
} catch (err) {
  console.error('Error setting up admin files:', err);
  // Continue anyway
}

// Check if public files exist
const publicDir = path.join(__dirname, '../public');
const adminDir = path.join(publicDir, 'admin');
const adminIndexFile = path.join(adminDir, 'index.html');

console.log(`Checking for admin files:`);
console.log(`- Public directory exists: ${fs.existsSync(publicDir)}`);
console.log(`- Admin directory exists: ${fs.existsSync(adminDir)}`);
console.log(`- Admin index.html exists: ${fs.existsSync(adminIndexFile)}`);

// If admin files don't exist in production, create the directories
if (process.env.NODE_ENV === 'production' && (!fs.existsSync(adminDir) || !fs.existsSync(adminIndexFile))) {
  console.log('Creating missing admin directories and files...');
  
  // Create admin directory if it doesn't exist
  if (!fs.existsSync(adminDir)) {
    fs.mkdirSync(adminDir, { recursive: true, mode: 0o755 });
    console.log('Created admin directory');
  }
  
  // Create a basic admin index.html if it doesn't exist
  if (!fs.existsSync(adminIndexFile)) {
    const basicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TransparenEats Admin</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #4caf50; }
  </style>
</head>
<body>
  <h1>TransparenEats Admin Dashboard</h1>
  <p>This is a placeholder admin dashboard.</p>
  <p><a href="/admin/analytics">View Analytics</a></p>
</body>
</html>`;
    
    fs.writeFileSync(adminIndexFile, basicHtml, { mode: 0o644 });
    console.log('Created basic admin index.html');
    
    // Create a basic analytics.html too
    const analyticsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TransparenEats Analytics</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    h1 { color: #2196f3; }
  </style>
</head>
<body>
  <h1>TransparenEats Analytics Dashboard</h1>
  <p>This is a placeholder analytics dashboard.</p>
  <p><a href="/admin">Back to Admin</a></p>
</body>
</html>`;
    
    fs.writeFileSync(path.join(adminDir, 'analytics.html'), analyticsHtml, { mode: 0o644 });
    console.log('Created basic analytics.html');
  }
}

// Start the application
console.log('Starting application...');
const app = spawn('node', ['src/index.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || 3000
  }
});

app.on('close', (code) => {
  console.log(`Application process exited with code ${code}`);
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  app.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  app.kill('SIGTERM');
}); 