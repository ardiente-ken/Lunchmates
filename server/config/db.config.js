import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

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

// Reuse one pool instead of reconnecting every time
let poolPromise;

export const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(dbConfig);
  }
  return poolPromise;
};
