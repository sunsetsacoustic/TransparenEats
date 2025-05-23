/**
 * Copy public directory for deployment
 * 
 * This script ensures that the public directory is properly copied
 * during deployment, especially for the admin files.
 */

const fs = require('fs');
const path = require('path');

console.log('Ensuring public directory is properly set up...');

// Define directories
const publicDir = path.join(__dirname, '../public');
const adminDir = path.join(publicDir, 'admin');

// Create directories if they don't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created public directory');
}

if (!fs.existsSync(adminDir)) {
  fs.mkdirSync(adminDir, { recursive: true });
  console.log('Created admin directory');
}

// Create admin index.html if it doesn't exist
const adminIndexFile = path.join(adminDir, 'index.html');
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
  
  fs.writeFileSync(adminIndexFile, basicHtml);
  console.log('Created basic admin index.html');
}

// Create analytics.html if it doesn't exist
const analyticsFile = path.join(adminDir, 'analytics.html');
if (!fs.existsSync(analyticsFile)) {
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
  
  fs.writeFileSync(analyticsFile, analyticsHtml);
  console.log('Created basic analytics.html');
}

console.log('Public directory setup complete');

// List all files in public directory
function listFiles(dir, prefix = '') {
  try {
    const files = fs.readdirSync(dir);
    console.log(`${prefix}${path.basename(dir)}/`);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        listFiles(filePath, `${prefix}  `);
      } else {
        console.log(`${prefix}  ${file} (${stats.size} bytes)`);
      }
    });
  } catch (err) {
    console.error(`Error listing directory ${dir}: ${err.message}`);
  }
}

console.log('\nFiles in public directory:');
listFiles(publicDir); 