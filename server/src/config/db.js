import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (_) {}
}
const sqlLogPath = path.join(logsDir, 'sql_queries.log');

export const pool = mysql.createPool({
  host: env.DB.HOST,
  port: env.DB.PORT,
  user: env.DB.USER,
  password: env.DB.PASSWORD,
  database: env.DB.NAME,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  decimalNumbers: true, // returns DECIMAL as numbers or precise values where appropriate
});

// Ring buffer of last 200 SQL queries for live inspection
const sqlLogBuffer = [];

function recordQuery(sql, params, durationMs, error = null) {
  if (!sql) return;
  const cleanSql = String(sql).replace(/\s+/g, ' ').trim();
  const firstWord = cleanSql.split(' ')[0].toUpperCase();
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type: firstWord,
    sql: cleanSql,
    params: params || [],
    durationMs,
    error: error ? error.message : null,
  };

  sqlLogBuffer.unshift(logEntry);
  if (sqlLogBuffer.length > 200) {
    sqlLogBuffer.pop();
  }

  // Real-time console log
  const paramStr = params && Array.isArray(params) && params.length > 0 ? ` | Params: ${JSON.stringify(params)}` : '';
  const errStr = error ? ` [ERROR: ${error.message}]` : '';
  console.log(`[SQL ${firstWord}] (${durationMs}ms) ${cleanSql}${paramStr}${errStr}`);

  // Append to persistent log file
  try {
    const fileLine = `[${logEntry.timestamp}] [${firstWord}] (${durationMs}ms) ${cleanSql}${paramStr}${errStr}\n`;
    fs.appendFileSync(sqlLogPath, fileLine, 'utf8');
  } catch (_) {}
}

export function getRecentSqlQueries() {
  return sqlLogBuffer;
}

/**
 * Execute query with automatic parameterization and real-time SQL execution logging
 */
export async function query(sql, params = []) {
  const start = Date.now();
  try {
    const [rows] = await pool.query(sql, params);
    recordQuery(sql, params, Date.now() - start);
    return rows;
  } catch (err) {
    recordQuery(sql, params, Date.now() - start, err);
    throw err;
  }
}

/**
 * Run a database operation inside a transaction with connection session actor propagation
 * Sets @current_officer_id for MySQL triggers and guarantees clearance in finally block.
 */
export async function withTransaction(officerId, callback) {
  const connection = await pool.getConnection();
  
  // Instrument transaction connection query for SQL logging
  const origQuery = connection.query.bind(connection);
  connection.query = async (sql, params) => {
    const start = Date.now();
    try {
      const res = await origQuery(sql, params);
      recordQuery(sql, params, Date.now() - start);
      return res;
    } catch (err) {
      recordQuery(sql, params, Date.now() - start, err);
      throw err;
    }
  };

  try {
    await connection.beginTransaction();

    if (officerId) {
      await connection.query('SET @current_officer_id = ?', [officerId]);
    }

    const result = await callback(connection);

    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    try {
      // Clear session variable to prevent actor context leak into connection pool
      await connection.query('SET @current_officer_id = NULL');
    } catch (_) {
      // Ignore cleanup error if connection dropped
    }
    connection.release();
  }
}

/**
 * Test MySQL connection
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export default pool;
