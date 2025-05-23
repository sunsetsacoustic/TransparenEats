// Database configuration for different environments
require('dotenv').config({ path: '../.env' });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'transpareneats_dev'
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  
  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'transpareneats_test'
    },
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
  
  production: {
    client: 'pg',
    connection: process.env.postgresql://transpareneatsdb_user:S4gQ2wjfWsKnEu0dSyOqAzzURqy5Tqpk@dpg-d0ntn8umcj7s73dtd2r0-a.oregon-postgres.render.com/transpareneatsdb,
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
    ssl: { rejectUnauthorized: false }
  }
}; 