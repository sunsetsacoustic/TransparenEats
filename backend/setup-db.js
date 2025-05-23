/**
 * Database setup script for TransparenEats
 * 
 * Run this script to create the database before running migrations
 */

const { Client } = require('pg');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env' });

const dbName = process.env.DB_NAME || 'transpareneats_dev';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;

async function setupDatabase() {
  // Connect to PostgreSQL server to create database
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres' // Connect to default database
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    
    // Check if database already exists
    const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);
    
    if (result.rowCount === 0) {
      console.log(`Creating database: ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
    } else {
      console.log(`Database ${dbName} already exists`);
    }
    
    // Run migrations
    console.log('Running migrations...');
    execSync('npm run migrate', { stdio: 'inherit' });
    console.log('Migrations completed successfully');
    
    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase(); 