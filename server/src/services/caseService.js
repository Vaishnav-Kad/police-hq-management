import { query, withTransaction } from '../config/db.js';
import { getOfficerById } from './officerService.js';

export const CASE_STATUSES = [
  'Filed',
  'Under Investigation',
  'Warrant Issued',
  'In Court',
  'Closed',
  'Cold',
];

/**
 * Service: List cases querying the dynamic database view vw_active_cases
 */
export async function getAllCases({ status, stationId, priority, assignedOfficerId, search, userRole, userStationId } = {}) {
  let sql = `
    SELECT 
      v.id,
      v.case_number,
      v.fir_id,
      v.fir_number,
      v.crime_type,
      v.station_id,
      v.station_name,
      v.assigned_officer_id,
      v.assigned_officer_name,
      v.assigned_officer_badge,
      v.case_status,
      v.priority,
      v.open_date,
      v.close_date,
      v.days_active,
      v.created_at,
      v.updated_at
    FROM vw_active_cases v
    WHERE 1=1
  `;
  const params = [];

  // ABAC: Regular Officers only see cases for their assigned precinct
  if (userRole === 'Officer' || userRole === 'Evidence-Manager') {
    sql += ` AND v.station_id = ?`;
    params.push(userStationId);
  } else if (stationId) {
    sql += ` AND v.station_id = ?`;
    params.push(stationId);
  }

  if (status) {
    sql += ` AND v.case_status = ?`;
    params.push(status);
  }

  if (priority) {
    sql += ` AND v.priority = ?`;
    params.push(priority);
  }

  if (assignedOfficerId) {
    sql += ` AND v.assigned_officer_id = ?`;
    params.push(assignedOfficerId);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (v.case_number LIKE ? OR v.fir_number LIKE ? OR v.crime_type LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY v.created_at DESC;`;

  return await query(sql, params);
}

/**
 * Service: Get comprehensive case dossier by ID
 */
export async function getCaseById(caseId, userRole = null) {
  const caseRows = await query(
    `SELECT 
       c.id,
       c.case_number,
       c.fir_id,
       c.assigned_officer_id,
       c.case_status,
       c.priority,
       c.open_date,
       c.close_date,
       DATEDIFF(COALESCE(c.close_date, CURDATE()), c.open_date) AS days_active,
       c.is_deleted,
       c.created_at,
       c.updated_at,
       f.fir_number,
       f.incident_date,
       f.date_filed,
       f.crime_type,
       f.description AS fir_description,
       f.latitude,
       f.longitude,
       f.station_id,
       s.name AS station_name,
       s.location AS station_location,
       CONCAT(o.first_name, ' ', o.last_name) AS assigned_officer_name,
       o.badge_number AS assigned_officer_badge,
       o.rank_title AS assigned_officer_rank
     FROM Cases c
     JOIN FIR f ON c.fir_id = f.id
     JOIN Police_Stations s ON f.station_id = s.id
     LEFT JOIN Police_Officers o ON c.assigned_officer_id = o.id
     WHERE c.id = ?`,
    [caseId]
  );

  if (!caseRows || caseRows.length === 0) {
    const error = new Error(`Case #${caseId} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_CASE_NOT_FOUND';
    throw error;
  }

  const caseData = caseRows[0];

  // Fetch associated suspects / accused from junction
  caseData.criminals = await query(
    `SELECT 
       j.id AS junction_id,
       j.involvement_type,
       j.notes AS junction_notes,
       cr.id AS criminal_id,
       cr.first_name,
       cr.last_name,
       cr.alias,
       cr.gender,
       cr.mugshot_path
     FROM Case_Criminal_Junction j
     JOIN Criminals cr ON j.criminal_id = cr.id
     WHERE j.case_id = ? AND cr.is_deleted = FALSE`,
    [caseId]
  );

  // Fetch evidence records
  caseData.evidences = await query(
    `SELECT id, evidence_number, description, evidence_type, storage_location, file_path, file_hash, file_size_bytes, mime_type, created_at
     FROM Evidences
     WHERE case_id = ? AND is_deleted = FALSE
     ORDER BY id ASC`,
    [caseId]
  );

  // Fetch court trial dates
  caseData.court_dates = await query(
    `SELECT cd.id, cd.hearing_date, cd.court_name, cd.judge_name, cd.decision, cd.notes,
            CONCAT(cr.first_name, ' ', cr.last_name) AS accused_name
     FROM Court_Dates cd
     LEFT JOIN Criminals cr ON cd.criminal_id = cr.id
     WHERE cd.case_id = ?
     ORDER BY cd.hearing_date ASC`,
    [caseId]
  );

  // Fetch warrants
  caseData.warrants = await query(
    `SELECT w.id, w.warrant_number, w.issuing_judge, w.warrant_type, w.status, w.issue_date, w.expiry_date,
            CONCAT(cr.first_name, ' ', cr.last_name) AS suspect_name
     FROM Warrants w
     JOIN Criminals cr ON w.suspect_id = cr.id
     WHERE w.case_id = ?`,
    [caseId]
  );

  // Fetch victims and witnesses with role-based redaction
  const witnesses = await query(
    `SELECT id, person_type, name, contact_info, statement, is_protected
     FROM Victims_And_Witnesses
     WHERE case_id = ?`,
    [caseId]
  );

  caseData.victims_and_witnesses = witnesses.map((w) => {
    // Redact contact info and sensitive statements for protected witnesses if viewer is regular officer
    if (w.is_protected && userRole !== 'Head-Officer' && userRole !== 'System-Admin') {
      return {
        ...w,
        contact_info: 'REDACTED (CONFIDENTIAL - LEVEL 1 CLEARANCE REQUIRED)',
        statement: 'REDACTED - STATEMENT PROTECTED UNDER WITNESS SECURITY PROTOCOL',
      };
    }
    return w;
  });

  // Fetch custody bookings
  caseData.arrests = await query(
    `SELECT a.id, a.arrest_number, a.booking_timestamp, a.holding_cell_number, a.bail_status, a.bail_amount,
            CONCAT(cr.first_name, ' ', cr.last_name) AS suspect_name
     FROM Arrests_And_Custody a
     JOIN Criminals cr ON a.suspect_id = cr.id
     WHERE a.case_id = ?`,
    [caseId]
  );

  return caseData;
}

/**
 * Service: Update case status across 5 Kanban stages
 * Leverages session variable @current_officer_id for trigger trg_audit_case_update
 */
export async function updateCaseStatus(caseId, newStatus, officerId) {
  if (!CASE_STATUSES.includes(newStatus)) {
    const error = new Error(`Invalid case status '${newStatus}'. Allowed: ${CASE_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const current = await getCaseById(caseId);

  let closeDate = current.close_date;
  if (newStatus === 'Closed') {
    closeDate = new Date().toISOString().split('T')[0];
  } else if (current.case_status === 'Closed' && newStatus !== 'Closed') {
    closeDate = null; // Reopen case
  }

  // Execute in transaction to propagate @current_officer_id to trigger trg_audit_case_update
  await withTransaction(officerId, async (connection) => {
    await connection.query(
      `UPDATE Cases 
       SET case_status = ?,
           close_date = ?
       WHERE id = ?`,
      [newStatus, closeDate, caseId]
    );
  });

  return await getCaseById(caseId);
}

/**
 * Service: Assign lead investigator to case (Head-Officer / Admin)
 * Validates officer is stationed at the precinct of the case!
 */
export async function assignInvestigator(caseId, assignedOfficerId, supervisorOfficer) {
  const caseData = await getCaseById(caseId);
  const officer = await getOfficerById(assignedOfficerId);

  // ABAC Check: Head-Officer can only assign officers stationed at the same precinct
  if (supervisorOfficer.role === 'Head-Officer') {
    if (Number(officer.station_id) !== Number(caseData.station_id)) {
      const error = new Error(
        `Jurisdictional Assignment Error: Officer #${assignedOfficerId} belongs to Station #${officer.station_id}, but this case belongs to Station #${caseData.station_id}.`
      );
      error.statusCode = 403;
      error.code = 'ERR_CROSS_STATION_ASSIGNMENT';
      throw error;
    }
  }

  await withTransaction(supervisorOfficer.id, async (connection) => {
    await connection.query(
      `UPDATE Cases 
       SET assigned_officer_id = ?,
           case_status = CASE WHEN case_status = 'Filed' THEN 'Under Investigation' ELSE case_status END
       WHERE id = ?`,
      [assignedOfficerId, caseId]
    );
  });

  return await getCaseById(caseId);
}
