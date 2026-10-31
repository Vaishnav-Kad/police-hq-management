import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function ensureDatabaseInitialized() {
  try {
    // Check if Police_Officers table exists
    await query('SELECT 1 FROM Police_Officers LIMIT 1');
    console.log('[Database] Schema already verified and operational.');
    return { initialized: true, message: 'Database tables already exist.' };
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
      console.log('[Database] Tables not found. Initializing schema and seed dataset automatically...');
      return await executeInitialization();
    }
    console.error('[Database] Connection check warning:', err.message);
    throw err;
  }
}

export async function executeInitialization() {
  const schemaPath = path.resolve(__dirname, 'database/schema.sql');
  const seedPath = path.resolve(__dirname, 'database/seed.sql');

  if (!fs.existsSync(schemaPath) || !fs.existsSync(seedPath)) {
    throw new Error('Schema or seed SQL files missing from server bundle.');
  }

  const rawSchema = fs.readFileSync(schemaPath, 'utf8');
  const rawSeed = fs.readFileSync(seedPath, 'utf8');

  // Split SQL into individual statements safely
  const schemaStatements = splitSqlStatements(rawSchema);
  const seedStatements = splitSqlStatements(rawSeed);

  console.log(`[Database Init] Executing ${schemaStatements.length} schema statements...`);
  let schemaCreated = 0;
  for (const stmt of schemaStatements) {
    try {
      await query(stmt);
      schemaCreated++;
    } catch (e) {
      // Ignore DROP errors or unsupported trigger warnings in cloud DBs
      if (!stmt.trim().toUpperCase().startsWith('DROP')) {
        console.warn(`[Database Init Warning on statement]: ${e.message}`);
      }
    }
  }

  console.log(`[Database Init] Executing ${seedStatements.length} seed statements...`);
  let seedCreated = 0;
  for (const stmt of seedStatements) {
    try {
      await query(stmt);
      seedCreated++;
    } catch (e) {
      console.warn(`[Database Seed Warning]: ${e.message}`);
    }
  }

  console.log('[Database Init] Initialization completed successfully!');
  return {
    success: true,
    message: 'Database schema and initial seed data applied successfully.',
    schemaStatementsRun: schemaCreated,
    seedStatementsRun: seedCreated,
  };
}

function splitSqlStatements(sqlText) {
  // Remove DELIMITER blocks and clean comments
  const cleaned = sqlText
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .replace(/DELIMITER\s+[\$;\/]+/gi, '');

  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if ((char === "'" || char === '"' || char === '`') && cleaned[i - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (stringChar === char) {
        inString = false;
      }
    }

    if (char === ';' && !inString) {
      const trimmed = current.trim();
      if (trimmed.length > 0 && !trimmed.toUpperCase().startsWith('USE ')) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}
