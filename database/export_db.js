import mysql from '../server/node_modules/mysql2/promise.js';
import fs from 'fs';
import dotenv from '../server/node_modules/dotenv/lib/main.js';
dotenv.config({ path: './server/.env' });

async function dump() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'police_hq_db',
    port: process.env.DB_PORT || 3306,
  });

  const [tables] = await pool.query('SHOW TABLES');
  const tableNames = tables.map((r) => Object.values(r)[0]);
  let sqlDump = '-- Police HQ Data Management System (PHDMS v2.0)\n-- Full Consolidated Export Dump\n\nCREATE DATABASE IF NOT EXISTS `police_hq_db`;\nUSE `police_hq_db`;\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n';

  for (const t of tableNames) {
    const [createRes] = await pool.query('SHOW CREATE TABLE `' + t + '`');
    sqlDump += 'DROP TABLE IF EXISTS `' + t + '`;\n' + createRes[0]['Create Table'] + ';\n\n';

    const [rows] = await pool.query('SELECT * FROM `' + t + '`');
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]).map((k) => '`' + k + '`').join(', ');
      for (const row of rows) {
        const vals = Object.values(row).map((v) => {
          if (v === null) return 'NULL';
          if (typeof v === 'number' || typeof v === 'boolean') return v;
          if (v instanceof Date) return "'" + v.toISOString().slice(0, 19).replace('T', ' ') + "'";
          return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
        }).join(', ');
        sqlDump += 'INSERT INTO `' + t + '` (' + keys + ') VALUES (' + vals + ');\n';
      }
      sqlDump += '\n';
    }
  }

  sqlDump += 'SET FOREIGN_KEY_CHECKS = 1;\n';
  fs.writeFileSync('./database/police_hq_full_export.sql', sqlDump, 'utf8');
  console.log('Successfully generated ./database/police_hq_full_export.sql with ' + tableNames.length + ' tables!');
  await pool.end();
}

dump().catch((e) => console.error(e));
