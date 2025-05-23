const knex = require('knex');
const config = require('./knexfile');

// Determine environment
const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

// Create the database connection
const db = knex(connectionConfig);

module.exports = db; 