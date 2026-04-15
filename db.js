const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'nigel',
  password: 'nigel',
  port: 5432,
});

module.exports = pool;