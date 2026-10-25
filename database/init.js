import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env if available
const envPath = path.resolve(__dirname, '../server/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function runDatabaseInit() {
  console.log('================================================================');
  console.log('   POLICE HEADQUARTERS DATA MANAGEMENT SYSTEM (PHDMS)');
  console.log('   Database Schema & Seed Initialization Runner');
  console.log('================================================================');
  console.log(`Connecting to MySQL Server at ${dbConfig.host}:${dbConfig.port} as user '${dbConfig.user}'...`);

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('[OK] Connected successfully to MySQL server.');

    // 1. Create database
    console.log('[DDL] Ensuring database `police_hq_db` exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS police_hq_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.query('USE police_hq_db;');
    console.log('[OK] Selected database `police_hq_db`.');

    // 2. Read schema.sql
    console.log('[DDL] Applying relational schema, views, triggers, and events...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    // Remove DELIMITER directives and execute block by block or multipleStatements
    // For standard MySQL2 multipleStatements, strip DELIMITER lines and replace $$ / // with ;
    const cleanedSchema = schemaSql
      .replace(/DELIMITER\s+\$\$/g, '')
      .replace(/DELIMITER\s+;/g, '')
      .replace(/\$\$/g, ';')
      .replace(/DELIMITER\s+\/\//g, '')
      .replace(/\/\//g, ';');

    await connection.query(cleanedSchema);
    console.log('[OK] Schema, full-text index, view, triggers, and events applied.');

    // 3. Read seed.sql
    console.log('[SEED] Populating database with deterministic seed dataset...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await connection.query(seedSql);
    console.log('[OK] Seed records inserted across all 15 tables.');

    // 4. Verification Check
    console.log('\n--- VERIFICATION: TABLE ROW COUNTS ---');
    const [tables] = await connection.query('SHOW TABLES;');
    const tableKey = Object.keys(tables[0])[0];

    for (const row of tables) {
      const tableName = row[tableKey];
      const [[countResult]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${tableName}\`;`);
      console.log(` - Table: ${tableName.padEnd(30)} Rows: ${countResult.total}`);
    }

    console.log('--------------------------------------');
    console.log('[SUCCESS] Phase 2 Database Setup & Seed Completed Successfully!\n');
  } catch (error) {
    console.error('\n[ERROR] Database initialization failed:');
    console.error(error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n-> HINT: Check DB_PASSWORD in server/.env or supply valid MySQL root credentials.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runDatabaseInit();
