import { query } from '../config/db.js';

/**
 * Service: Query append-only audit trail
 */
export async function getAllAuditLogs({ officerId, action, targetTable, limit = 50, offset = 0 } = {}) {
  let sql = `
    SELECT 
      a.id,
      a.officer_id,
      a.action,
      a.target_table,
      a.record_id,
      a.details,
      a.timestamp,
      CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
      o.badge_number AS officer_badge,
      o.role AS officer_role,
      s.name AS station_name
    FROM Audit_Logs a
    LEFT JOIN Police_Officers o ON a.officer_id = o.id
    LEFT JOIN Police_Stations s ON o.station_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (officerId) {
    sql += ` AND a.officer_id = ?`;
    params.push(officerId);
  }

  if (action) {
    sql += ` AND a.action = ?`;
    params.push(action);
  }

  if (targetTable) {
    sql += ` AND a.target_table = ?`;
    params.push(targetTable);
  }

  sql += ` ORDER BY a.timestamp DESC LIMIT ? OFFSET ?;`;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  return await query(sql, params);
}

/**
 * Service: Get single audit log record
 */
export async function getAuditLogById(id) {
  const sql = `
    SELECT 
      a.id,
      a.officer_id,
      a.action,
      a.target_table,
      a.record_id,
      a.details,
      a.timestamp,
      CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
      o.badge_number AS officer_badge,
      o.role AS officer_role,
      s.name AS station_name
    FROM Audit_Logs a
    LEFT JOIN Police_Officers o ON a.officer_id = o.id
    LEFT JOIN Police_Stations s ON o.station_id = s.id
    WHERE a.id = ?;
  `;
  const rows = await query(sql, [id]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Audit log entry #${id} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_AUDIT_LOG_NOT_FOUND';
    throw error;
  }
  return rows[0];
}
