/**
 * Check if important files exist in the deployment
 */
const fs = require('fs');
const path = require('path');

console.log('Checking deployment files...');

// Check public directory
const publicDir = path.join(__dirname, '../public');
console.log(`Public directory exists: ${fs.existsSync(publicDir)}`);

// Check admin directory
const adminDir = path.join(publicDir, 'admin');
console.log(`Admin directory exists: ${fs.existsSync(adminDir)}`);

// Check admin index file
const adminIndexFile = path.join(adminDir, 'index.html');
console.log(`Admin index.html exists: ${fs.existsSync(adminIndexFile)}`);

// Check admin analytics file
const adminAnalyticsFile = path.join(adminDir, 'analytics.html');
console.log(`Admin analytics.html exists: ${fs.existsSync(adminAnalyticsFile)}`);

// Print working directory and file paths
console.log(`Working directory: ${process.cwd()}`);
console.log(`Admin index path: ${adminIndexFile}`);

// Try to read the admin index file
try {
  const adminIndexContent = fs.readFileSync(adminIndexFile, 'utf8');
  console.log(`Admin index.html size: ${adminIndexContent.length} bytes`);
} catch (err) {
  console.error(`Error reading admin index.html: ${err.message}`);
}

// List all files in public directory recursively
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

console.log('\nListing files in public directory:');
listFiles(publicDir); 