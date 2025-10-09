const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function connectDB() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ MSSQL Connected');
    return pool;
  } catch (err) {
    console.error('❌ Database Connection Failed:', err);
  }
}

module.exports = connectDB;
