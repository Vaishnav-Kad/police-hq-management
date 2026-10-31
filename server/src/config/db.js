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
  ssl: env.DB.SSL ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  decimalNumbers: true, // returns DECIMAL as numbers or precise values where appropriate
});

// Ring buffer of last 500 SQL queries for live inspection
const sqlLogBuffer = [];

// Populate sqlLogBuffer from persistent disk log on startup so recent operations survive restarts
function loadInitialQueriesFromDisk() {
  try {
    if (!fs.existsSync(sqlLogPath)) return;
    const content = fs.readFileSync(sqlLogPath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    const recent = lines.slice(-300);
    const regex = /^\[(.*?)\]\s+\[(.*?)\]\s+\((\d+)ms\)\s+(.*?)(?:\s+\|\s+Params:\s+(.*?))?(?:\s+\[ERROR:\s*(.*?)\])?$/;

    for (let i = recent.length - 1; i >= 0; i--) {
      const line = recent[i].trim();
      const match = line.match(regex);
      if (match) {
        let params = [];
        if (match[5]) {
          try {
            params = JSON.parse(match[5]);
          } catch (_) {
            params = [match[5]];
          }
        }
        let type = match[2];
        const cleanSql = match[4];
        if (cleanSql.toUpperCase().includes('IS_DELETED = TRUE') || cleanSql.toUpperCase().includes('IS_DELETED=TRUE')) {
          type = 'DELETE';
        }
        // Exclude repetitive internal token auth checks
        if (!cleanSql.includes('FROM Police_Officers o JOIN Police_Stations s ON o.station_id = s.id WHERE o.id =')) {
          sqlLogBuffer.push({
            id: Date.now() + Math.random(),
            timestamp: match[1],
            type,
            sql: cleanSql,
            params,
            durationMs: parseInt(match[3], 10),
            error: match[6] || null,
          });
        }
      }
    }
  } catch (err) {
    console.error('[SQL Logger] Failed to load previous queries from disk:', err.message);
  }
}

loadInitialQueriesFromDisk();

function recordQuery(sql, params, durationMs, error = null) {
  if (!sql) return;
  const cleanSql = String(sql).replace(/\s+/g, ' ').trim();

  // Exclude repetitive internal token authentication check from polling flooding the inspector
  if (cleanSql.includes('FROM Police_Officers o JOIN Police_Stations s ON o.station_id = s.id WHERE o.id =')) {
    return;
  }

  let firstWord = cleanSql.split(' ')[0].toUpperCase();
  // Tag soft-deletes as DELETE so they appear under the DELETE filter in SQL inspector
  if (firstWord === 'UPDATE' && (cleanSql.toUpperCase().includes('IS_DELETED = TRUE') || cleanSql.toUpperCase().includes('IS_DELETED=TRUE'))) {
    firstWord = 'DELETE';
  }

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
  if (sqlLogBuffer.length > 500) {
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
