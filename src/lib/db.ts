import mysql from 'mysql2/promise';

// Connection pool configuration for raw queries
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Ashish@123',
  database: process.env.DB_NAME || 'scope_receipt',
  ssl:
    process.env.DB_SSL === 'true' || Number(process.env.DB_PORT) === 4000
      ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
      : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Executes a raw parameterized SQL query with connection pooling.
 * Example: query('SELECT * FROM receipts WHERE public_id = ?', [publicId])
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

export default pool;
