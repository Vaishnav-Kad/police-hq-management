import { query } from '../config/db.js';

export const ALERT_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Service: List alerts for an officer with personalized read status
 */
export async function getAllAlerts(officerId, { severity, unreadOnly = false, limit = 50 } = {}) {
  let sql = `
    SELECT 
      a.id,
      a.case_id,
      a.alert_message,
      a.severity,
      a.created_at,
      c.case_number,
      c.case_status,
      c.priority AS case_priority,
      CASE WHEN ar.read_at IS NOT NULL THEN TRUE ELSE FALSE END AS is_read_by_me,
      ar.read_at
    FROM Alerts a
    LEFT JOIN Cases c ON a.case_id = c.id
    LEFT JOIN Alert_Reads ar ON a.id = ar.alert_id AND ar.officer_id = ?
    WHERE 1=1
  `;
  const params = [officerId];

  if (severity) {
    sql += ` AND a.severity = ?`;
    params.push(severity);
  }

  if (unreadOnly) {
    sql += ` AND ar.read_at IS NULL`;
  }

  sql += ` ORDER BY a.created_at DESC LIMIT ?;`;
  params.push(parseInt(limit, 10));

  return await query(sql, params);
}

/**
 * Service: Create a high-priority BOLO or precinct alert and emit over WebSockets
 */
export async function createBOLOAlert({ message, severity = 'High', case_id = null }, issuerOfficer, io = null) {
  if (!ALERT_SEVERITIES.includes(severity)) {
    const error = new Error(`Invalid severity '${severity}'. Allowed: ${ALERT_SEVERITIES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `INSERT INTO Alerts (case_id, alert_message, severity, is_read)
     VALUES (?, ?, ?, FALSE)`,
    [case_id || null, message.trim(), severity]
  );

  const alertId = result.insertId;

  // Audit log
  await query(
    `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
     VALUES (?, 'BOLO_ALERT_ISSUED', 'Alerts', ?, ?)`,
    [
      issuerOfficer.id,
      alertId,
      JSON.stringify({
        message,
        severity,
        case_id,
        issuer_badge: issuerOfficer.badge_number,
      }),
    ]
  );

  const alertPayload = {
    id: alertId,
    case_id,
    alert_message: message.trim(),
    severity,
    created_at: new Date().toISOString(),
    issuer: {
      id: issuerOfficer.id,
      name: `${issuerOfficer.first_name} ${issuerOfficer.last_name}`,
      badge: issuerOfficer.badge_number,
    },
  };

  // Real-time WebSocket broadcast
  if (io) {
    io.emit('priority_alert', alertPayload);
  }

  return alertPayload;
}

/**
 * Service: Mark alert as read for the current officer
 */
export async function markAlertAsRead(alertId, officerId) {
  await query(
    `INSERT INTO Alert_Reads (alert_id, officer_id, read_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE read_at = NOW()`,
    [alertId, officerId]
  );
  return { alertId, officerId, isRead: true };
}

/**
 * Service: Mark all unread alerts as read for the current officer
 */
export async function markAllAlertsAsRead(officerId) {
  const unreadAlerts = await query(
    `SELECT a.id 
     FROM Alerts a 
     LEFT JOIN Alert_Reads ar ON a.id = ar.alert_id AND ar.officer_id = ?
     WHERE ar.read_at IS NULL`,
    [officerId]
  );

  for (const alert of unreadAlerts) {
    await query(
      `INSERT INTO Alert_Reads (alert_id, officer_id, read_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE read_at = NOW()`,
      [alert.id, officerId]
    );
  }

  return { markedCount: unreadAlerts.length };
}

/**
 * Service: Automated scanner for 90-day cold/pending cases with 30-day deduplication
 */
export async function checkAndGenerate90DayPendingAlerts() {
  const pendingCases = await query(
    `SELECT 
       c.id, 
       c.case_number, 
       c.open_date,
       DATEDIFF(CURDATE(), c.open_date) AS days_active
     FROM Cases c
     WHERE c.is_deleted = FALSE
       AND c.case_status NOT IN ('Closed', 'Cold')
       AND DATEDIFF(CURDATE(), c.open_date) > 90
       AND NOT EXISTS (
         SELECT 1 FROM Alerts a 
         WHERE a.case_id = c.id 
           AND a.alert_message LIKE '%pending for over 90 days%'
           AND a.created_at >= NOW() - INTERVAL 30 DAY
       )`
  );

  let generated = 0;
  for (const c of pendingCases) {
    await query(
      `INSERT INTO Alerts (case_id, alert_message, severity, is_read)
       VALUES (?, ?, 'High', FALSE)`,
      [
        c.id,
        `Automatic Notice: Case ${c.case_number} has been pending for ${c.days_active} days without closure. Review required.`,
      ]
    );
    generated++;
  }

  return { scanned: pendingCases.length, alertsGenerated: generated };
}
