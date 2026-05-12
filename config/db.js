const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'academico_db',
  waitForConnections: true,
  connectionLimit:    10,
});

pool.getConnection()
  .then(conn => {
    console.log('Conectado a MySQL');
    conn.release();
  })
  .catch(err => {
    console.error('Error al conectarse a MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;