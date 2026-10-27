import { query, withTransaction } from '../config/db.js';
import { getCaseById } from './caseService.js';
import { getCriminalById } from './criminalService.js';
import { getStationById } from './stationService.js';

export const COURT_DECISIONS = ['Pending', 'Guilty', 'Not Guilty', 'Bail'];
export const WARRANT_TYPES = ['Arrest', 'Search'];
export const WARRANT_STATUSES = ['Issued', 'Executed', 'Cancelled'];
export const WITNESS_TYPES = ['Victim', 'Witness', 'Reporter'];
export const BAIL_STATUSES = ['Granted', 'Denied', 'Pending', 'Released on Bail'];

// ==============================================================================
// 1. COURT DATES & HEARINGS
// ==============================================================================

export async function getAllCourtDates({ caseId, criminalId, decision, search, stationId, userRole, userStationId } = {}) {
  let sql = `
    SELECT 
      cd.id,
      cd.case_id,
      cd.criminal_id,
      cd.hearing_date,
      cd.court_name,
      cd.judge_name,
      cd.decision,
      cd.notes,
      cd.created_at,
      cd.updated_at,
      c.case_number,
      c.case_status,
      f.station_id,
      CONCAT(cr.first_name, ' ', cr.last_name) AS accused_name,
      cr.alias AS accused_alias
    FROM Court_Dates cd
    JOIN Cases c ON cd.case_id = c.id
    JOIN FIR f ON c.fir_id = f.id
    LEFT JOIN Criminals cr ON cd.criminal_id = cr.id
    WHERE c.is_deleted = FALSE
  `;
  const params = [];

  // ABAC: Regular Officers and Evidence Managers are scoped to their precinct
  if (userRole === 'Officer' || userRole === 'Evidence-Manager') {
    if (userStationId) {
      sql += ` AND f.station_id = ?`;
      params.push(userStationId);
    }
  } else if (stationId) {
    sql += ` AND f.station_id = ?`;
    params.push(stationId);
  }

  if (caseId) {
    sql += ` AND cd.case_id = ?`;
    params.push(caseId);
  }

  if (criminalId) {
    sql += ` AND cd.criminal_id = ?`;
    params.push(criminalId);
  }

  if (decision) {
    sql += ` AND cd.decision = ?`;
    params.push(decision);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (cd.court_name LIKE ? OR cd.judge_name LIKE ? OR c.case_number LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern);
  }

  sql += ` ORDER BY cd.hearing_date ASC;`;

  return await query(sql, params);
}

export async function getCourtDateById(id) {
  const sql = `
    SELECT 
      cd.id,
      cd.case_id,
      cd.criminal_id,
      cd.hearing_date,
      cd.court_name,
      cd.judge_name,
      cd.decision,
      cd.notes,
      cd.created_at,
      cd.updated_at,
      c.case_number,
      c.case_status,
      f.station_id,
      s.name AS station_name,
      CONCAT(cr.first_name, ' ', cr.last_name) AS accused_name,
      cr.alias AS accused_alias
    FROM Court_Dates cd
    JOIN Cases c ON cd.case_id = c.id
    LEFT JOIN FIR f ON c.fir_id = f.id
    LEFT JOIN Police_Stations s ON f.station_id = s.id
    LEFT JOIN Criminals cr ON cd.criminal_id = cr.id
    WHERE cd.id = ?;
  `;
  const rows = await query(sql, [id]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Court hearing record #${id} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_COURT_DATE_NOT_FOUND';
    throw error;
  }
  return rows[0];
}

export async function createCourtDate({ case_id, criminal_id, hearing_date, court_name, judge_name, decision = 'Pending', notes }, user) {
  await getCaseById(case_id);
  if (criminal_id) {
    await getCriminalById(criminal_id);
  }

  const result = await query(
    `INSERT INTO Court_Dates (case_id, criminal_id, hearing_date, court_name, judge_name, decision, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      case_id,
      criminal_id || null,
      new Date(hearing_date),
      court_name.trim(),
      judge_name.trim(),
      decision,
      notes ? notes.trim() : null,
    ]
  );

  // Auto transition case to 'In Court' if it was under investigation
  await query(
    `UPDATE Cases SET case_status = 'In Court' WHERE id = ? AND case_status IN ('Filed', 'Under Investigation', 'Warrant Issued')`,
    [case_id]
  );

  return await getCourtDateById(result.insertId);
}

export async function updateCourtDate(id, { hearing_date, court_name, judge_name, decision, notes }) {
  await getCourtDateById(id);

  if (decision && !COURT_DECISIONS.includes(decision)) {
    const error = new Error(`Invalid decision '${decision}'. Allowed: ${COURT_DECISIONS.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  await query(
    `UPDATE Court_Dates
     SET hearing_date = COALESCE(?, hearing_date),
         court_name = COALESCE(?, court_name),
         judge_name = COALESCE(?, judge_name),
         decision = COALESCE(?, decision),
         notes = COALESCE(?, notes)
     WHERE id = ?`,
    [
      hearing_date ? new Date(hearing_date) : null,
      court_name ? court_name.trim() : null,
      judge_name ? judge_name.trim() : null,
      decision || null,
      notes ? notes.trim() : null,
      id,
    ]
  );

  return await getCourtDateById(id);
}

export async function deleteCourtDate(id, requestingUser = null) {
  const hearing = await getCourtDateById(id);

  if (requestingUser) {
    if (requestingUser.role !== 'Head-Officer' && requestingUser.role !== 'System-Admin') {
      const error = new Error('Access Denied: Only Head-Officers and System-Admins are authorized to cancel court hearings.');
      error.statusCode = 403;
      error.code = 'ERR_UNAUTHORIZED';
      throw error;
    }
    if (requestingUser.role === 'Head-Officer' && hearing.station_id) {
      if (Number(hearing.station_id) !== Number(requestingUser.station_id)) {
        const error = new Error('Access Denied: Head-Officers can only cancel hearings for cases within their assigned precinct.');
        error.statusCode = 403;
        error.code = 'ERR_STATION_ACCESS_DENIED';
        throw error;
      }
    }
  }

  await query(`DELETE FROM Court_Dates WHERE id = ?`, [id]);

  if (requestingUser?.id) {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'COURT_HEARING_CANCELLED', 'Court_Dates', ?, ?)`,
      [
        requestingUser.id,
        id,
        JSON.stringify({
          case_id: hearing.case_id,
          case_number: hearing.case_number,
          court_name: hearing.court_name,
          hearing_date: hearing.hearing_date,
          actor_badge: requestingUser.badge_number,
        }),
      ]
    );
  }

  return { id, deleted: true };
}

// ==============================================================================
// 2. JUDICIAL WARRANTS
// ==============================================================================

export async function getAllWarrants({ caseId, suspectId, status, warrantType, search, stationId, userRole, userStationId } = {}) {
  let sql = `
    SELECT 
      w.id,
      w.warrant_number,
      w.case_id,
      w.suspect_id,
      w.issuing_judge,
      w.court_name,
      w.target_person_name,
      w.offense_sections,
      w.station_id,
      w.executing_officer_id,
      w.execution_notes,
      w.warrant_type,
      w.status,
      w.issue_date,
      w.expiry_date,
      w.execution_date,
      w.created_at,
      w.updated_at,
      c.case_number,
      c.case_status,
      f.station_id AS case_station_id,
      COALESCE(ws.name, s.name) AS station_name,
      CONCAT(cr.first_name, ' ', cr.last_name) AS suspect_name,
      cr.alias AS suspect_alias,
      CONCAT(eo.first_name, ' ', eo.last_name) AS executing_officer_name
    FROM Warrants w
    JOIN Cases c ON w.case_id = c.id
    JOIN FIR f ON c.fir_id = f.id
    JOIN Police_Stations s ON f.station_id = s.id
    LEFT JOIN Police_Stations ws ON w.station_id = ws.id
    JOIN Criminals cr ON w.suspect_id = cr.id
    LEFT JOIN Police_Officers eo ON w.executing_officer_id = eo.id
    WHERE c.is_deleted = FALSE
  `;
  const params = [];

  // ABAC: Regular Officers and Evidence Managers are scoped to their precinct
  if (userRole === 'Officer' || userRole === 'Evidence-Manager') {
    if (userStationId) {
      sql += ` AND (f.station_id = ? OR w.station_id = ?)`;
      params.push(userStationId, userStationId);
    }
  } else if (stationId) {
    sql += ` AND (f.station_id = ? OR w.station_id = ?)`;
    params.push(stationId, stationId);
  }

  if (caseId) {
    sql += ` AND w.case_id = ?`;
    params.push(caseId);
  }

  if (suspectId) {
    sql += ` AND w.suspect_id = ?`;
    params.push(suspectId);
  }

  if (status) {
    sql += ` AND w.status = ?`;
    params.push(status);
  }

  if (warrantType) {
    sql += ` AND w.warrant_type = ?`;
    params.push(warrantType);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (w.warrant_number LIKE ? OR w.issuing_judge LIKE ? OR w.court_name LIKE ? OR w.target_person_name LIKE ? OR c.case_number LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern, pattern, pattern);
  }

  sql += ` ORDER BY w.issue_date DESC;`;

  return await query(sql, params);
}

export async function getWarrantById(id) {
  const sql = `
    SELECT 
      w.id,
      w.warrant_number,
      w.case_id,
      w.suspect_id,
      w.issuing_judge,
      w.court_name,
      w.target_person_name,
      w.offense_sections,
      w.station_id,
      w.executing_officer_id,
      w.execution_notes,
      w.warrant_type,
      w.status,
      w.issue_date,
      w.expiry_date,
      w.execution_date,
      w.created_at,
      w.updated_at,
      c.case_number,
      c.case_status,
      COALESCE(ws.name, s.name) AS station_name,
      CONCAT(cr.first_name, ' ', cr.last_name) AS suspect_name,
      cr.alias AS suspect_alias,
      CONCAT(eo.first_name, ' ', eo.last_name) AS executing_officer_name
    FROM Warrants w
    JOIN Cases c ON w.case_id = c.id
    JOIN FIR f ON c.fir_id = f.id
    JOIN Police_Stations s ON f.station_id = s.id
    LEFT JOIN Police_Stations ws ON w.station_id = ws.id
    JOIN Criminals cr ON w.suspect_id = cr.id
    LEFT JOIN Police_Officers eo ON w.executing_officer_id = eo.id
    WHERE w.id = ?;
  `;
  const rows = await query(sql, [id]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Warrant #${id} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_WARRANT_NOT_FOUND';
    throw error;
  }
  return rows[0];
}

export async function createWarrant({
  case_id,
  suspect_id,
  issuing_judge,
  warrant_type,
  issue_date,
  expiry_date,
  court_name = 'Sessions Court Fort, Mumbai',
  target_person_name = null,
  offense_sections = 'IPC 302, 120-B / BNSS 103',
  station_id = null,
  executing_officer_id = null,
  execution_notes = null,
}) {
  const caseData = await getCaseById(case_id);
  const criminalData = await getCriminalById(suspect_id);

  if (!WARRANT_TYPES.includes(warrant_type)) {
    const error = new Error(`Invalid warrant type '${warrant_type}'. Allowed: ${WARRANT_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const currentYear = new Date().getFullYear();
  const [countRows] = await query(`SELECT COUNT(*) AS total FROM Warrants WHERE YEAR(created_at) = ?`, [currentYear]);
  const seq = String(countRows[0].total + 1).padStart(3, '0');
  const warrantNumber = `WAR-${currentYear}-${seq}`;
  const targetName = target_person_name ? target_person_name.trim() : `${criminalData.first_name} ${criminalData.last_name}`;
  const targetStation = station_id || caseData.station_id || 1;

  const result = await query(
    `INSERT INTO Warrants (warrant_number, case_id, suspect_id, issuing_judge, warrant_type, status, issue_date, expiry_date, court_name, target_person_name, offense_sections, station_id, executing_officer_id, execution_notes)
     VALUES (?, ?, ?, ?, ?, 'Issued', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      warrantNumber,
      case_id,
      suspect_id,
      issuing_judge.trim(),
      warrant_type,
      new Date(issue_date),
      expiry_date ? new Date(expiry_date) : null,
      court_name ? court_name.trim() : 'Sessions Court Fort, Mumbai',
      targetName,
      offense_sections ? offense_sections.trim() : 'IPC 302, 120-B / BNSS 103',
      targetStation,
      executing_officer_id || null,
      execution_notes ? execution_notes.trim() : null,
    ]
  );

  // If Arrest warrant issued, advance case to 'Warrant Issued' if not already in court or closed
  if (warrant_type === 'Arrest') {
    await query(
      `UPDATE Cases SET case_status = 'Warrant Issued' WHERE id = ? AND case_status IN ('Filed', 'Under Investigation')`,
      [case_id]
    );
  }

  return await getWarrantById(result.insertId);
}

export async function updateWarrantStatus(id, { status, execution_date }, requestingUser = null) {
  const warrant = await getWarrantById(id);

  if (!WARRANT_STATUSES.includes(status)) {
    const error = new Error(`Invalid warrant status '${status}'. Allowed: ${WARRANT_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const warrantStationId = warrant.station_id || warrant.case_station_id;

  if (requestingUser) {
    if (status === 'Cancelled' && requestingUser.role !== 'Head-Officer' && requestingUser.role !== 'System-Admin') {
      const error = new Error('Access Denied: Only Head-Officers and System-Admins are authorized to cancel judicial warrants.');
      error.statusCode = 403;
      error.code = 'ERR_UNAUTHORIZED';
      throw error;
    }
    if (requestingUser.role === 'Head-Officer' && warrantStationId) {
      if (Number(warrantStationId) !== Number(requestingUser.station_id)) {
        const error = new Error('Access Denied: Head-Officers can only update warrants within their assigned precinct.');
        error.statusCode = 403;
        error.code = 'ERR_STATION_ACCESS_DENIED';
        throw error;
      }
    }
  }

  let execDate = execution_date ? new Date(execution_date) : null;
  if (status === 'Executed' && !execDate) {
    execDate = new Date();
  }

  await query(
    `UPDATE Warrants SET status = ?, execution_date = ? WHERE id = ?`,
    [status, execDate, id]
  );

  if (requestingUser?.id) {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'WARRANT_STATUS_UPDATE', 'Warrants', ?, ?)`,
      [
        requestingUser.id,
        id,
        JSON.stringify({
          warrant_number: warrant.warrant_number,
          previous_status: warrant.status,
          new_status: status,
          actor_badge: requestingUser.badge_number,
        }),
      ]
    );
  }

  return await getWarrantById(id);
}

export async function deleteWarrant(id, requestingUser = null) {
  const warrant = await getWarrantById(id);

  const warrantStationId = warrant.station_id || warrant.case_station_id;

  if (requestingUser) {
    if (requestingUser.role !== 'Head-Officer' && requestingUser.role !== 'System-Admin') {
      const error = new Error('Access Denied: Only Head-Officers and System-Admins are authorized to remove warrants.');
      error.statusCode = 403;
      error.code = 'ERR_UNAUTHORIZED';
      throw error;
    }
    if (requestingUser.role === 'Head-Officer' && warrantStationId) {
      if (Number(warrantStationId) !== Number(requestingUser.station_id)) {
        const error = new Error('Access Denied: Head-Officers can only remove warrants within their assigned precinct.');
        error.statusCode = 403;
        error.code = 'ERR_STATION_ACCESS_DENIED';
        throw error;
      }
    }
  }

  await query(`DELETE FROM Warrants WHERE id = ?`, [id]);

  if (requestingUser?.id) {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'WARRANT_REMOVED', 'Warrants', ?, ?)`,
      [
        requestingUser.id,
        id,
        JSON.stringify({
          warrant_number: warrant.warrant_number,
          actor_badge: requestingUser.badge_number,
        }),
      ]
    );
  }

  return { id, deleted: true };
}

// ==============================================================================
// 3. VICTIMS & WITNESSES (With Role-Based Redaction Protection)
// ==============================================================================

export async function getAllWitnesses({ caseId, personType, search, userRole, stationId, userStationId } = {}) {
  let sql = `
    SELECT 
      vw.id,
      vw.case_id,
      vw.person_type,
      vw.name,
      vw.contact_info,
      vw.statement,
      vw.is_protected,
      vw.created_at,
      vw.updated_at,
      c.case_number,
      c.case_status,
      f.station_id
    FROM Victims_And_Witnesses vw
    JOIN Cases c ON vw.case_id = c.id
    JOIN FIR f ON c.fir_id = f.id
    WHERE c.is_deleted = FALSE
  `;
  const params = [];

  // ABAC: Regular Officers and Evidence Managers are scoped to their precinct
  if (userRole === 'Officer' || userRole === 'Evidence-Manager') {
    if (userStationId) {
      sql += ` AND f.station_id = ?`;
      params.push(userStationId);
    }
  } else if (stationId) {
    sql += ` AND f.station_id = ?`;
    params.push(stationId);
  }

  if (caseId) {
    sql += ` AND vw.case_id = ?`;
    params.push(caseId);
  }

  if (personType) {
    sql += ` AND vw.person_type = ?`;
    params.push(personType);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (vw.name LIKE ? OR c.case_number LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern);
  }

  sql += ` ORDER BY vw.id ASC;`;

  const rows = await query(sql, params);

  // Apply witness redaction
  return rows.map((w) => {
    if (w.is_protected && userRole !== 'Head-Officer' && userRole !== 'System-Admin') {
      return {
        ...w,
        contact_info: 'REDACTED (CONFIDENTIAL - LEVEL 1 CLEARANCE REQUIRED)',
        statement: 'REDACTED - STATEMENT PROTECTED UNDER WITNESS SECURITY PROTOCOL',
      };
    }
    return w;
  });
}

export async function getWitnessById(id, userRole) {
  const sql = `
    SELECT 
      vw.id,
      vw.case_id,
      vw.person_type,
      vw.name,
      vw.contact_info,
      vw.statement,
      vw.is_protected,
      vw.created_at,
      vw.updated_at,
      c.case_number,
      c.case_status
    FROM Victims_And_Witnesses vw
    JOIN Cases c ON vw.case_id = c.id
    WHERE vw.id = ?;
  `;
  const rows = await query(sql, [id]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Victim/Witness record #${id} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_WITNESS_NOT_FOUND';
    throw error;
  }

  const witness = rows[0];
  if (witness.is_protected && userRole !== 'Head-Officer' && userRole !== 'System-Admin') {
    return {
      ...witness,
      contact_info: 'REDACTED (CONFIDENTIAL - LEVEL 1 CLEARANCE REQUIRED)',
      statement: 'REDACTED - STATEMENT PROTECTED UNDER WITNESS SECURITY PROTOCOL',
    };
  }
  return witness;
}

export async function createWitness({ case_id, person_type, name, contact_info, statement, is_protected = false }) {
  await getCaseById(case_id);

  if (!WITNESS_TYPES.includes(person_type)) {
    const error = new Error(`Invalid person type '${person_type}'. Allowed: ${WITNESS_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const result = await query(
    `INSERT INTO Victims_And_Witnesses (case_id, person_type, name, contact_info, statement, is_protected)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      case_id,
      person_type,
      name.trim(),
      contact_info ? contact_info.trim() : null,
      statement ? statement.trim() : null,
      Boolean(is_protected),
    ]
  );

  return await getWitnessById(result.insertId, 'System-Admin');
}

export async function updateWitness(id, { person_type, name, contact_info, statement, is_protected }) {
  await getWitnessById(id, 'System-Admin');

  await query(
    `UPDATE Victims_And_Witnesses
     SET person_type = COALESCE(?, person_type),
         name = COALESCE(?, name),
         contact_info = COALESCE(?, contact_info),
         statement = COALESCE(?, statement),
         is_protected = COALESCE(?, is_protected)
     WHERE id = ?`,
    [
      person_type || null,
      name ? name.trim() : null,
      contact_info ? contact_info.trim() : null,
      statement ? statement.trim() : null,
      is_protected !== undefined ? Boolean(is_protected) : null,
      id,
    ]
  );

  return await getWitnessById(id, 'System-Admin');
}

export async function deleteWitness(id) {
  await getWitnessById(id, 'System-Admin');
  await query(`DELETE FROM Victims_And_Witnesses WHERE id = ?`, [id]);
  return { id, deleted: true };
}

// ==============================================================================
// 4. ARRESTS & PRECINCT CUSTODY
// ==============================================================================

export async function getAllArrests({ caseId, suspectId, stationId, bailStatus, search, userRole, userStationId } = {}) {
  let sql = `
    SELECT 
      a.id,
      a.arrest_number,
      a.case_id,
      a.suspect_id,
      a.arrestee_name,
      a.custody_type,
      a.magistrate_production_deadline,
      a.medical_exam_status,
      a.medical_officer_notes,
      a.relative_intimated,
      a.property_seized_inventory,
      a.arresting_officer_id,
      a.station_id,
      a.booking_timestamp,
      a.holding_cell_number,
      a.bail_status,
      a.bail_amount,
      a.release_timestamp,
      a.created_at,
      a.updated_at,
      c.case_number,
      COALESCE(a.arrestee_name, CONCAT(cr.first_name, ' ', cr.last_name)) AS display_detainee_name,
      CONCAT(cr.first_name, ' ', cr.last_name) AS suspect_name,
      cr.alias AS suspect_alias,
      s.name AS station_name,
      s.lockup_rooms,
      s.lockup_capacity,
      CONCAT(o.first_name, ' ', o.last_name) AS arresting_officer_name,
      o.badge_number AS arresting_officer_badge
    FROM Arrests_And_Custody a
    JOIN Cases c ON a.case_id = c.id
    JOIN Criminals cr ON a.suspect_id = cr.id
    JOIN Police_Stations s ON a.station_id = s.id
    JOIN Police_Officers o ON a.arresting_officer_id = o.id
    WHERE c.is_deleted = FALSE
  `;
  const params = [];

  // ABAC: Regular Officers and Evidence Managers are scoped to their precinct station
  if (userRole === 'Officer' || userRole === 'Evidence-Manager') {
    if (userStationId) {
      sql += ` AND a.station_id = ?`;
      params.push(userStationId);
    }
  } else if (stationId) {
    sql += ` AND a.station_id = ?`;
    params.push(stationId);
  }

  if (caseId) {
    sql += ` AND a.case_id = ?`;
    params.push(caseId);
  }

  if (suspectId) {
    sql += ` AND a.suspect_id = ?`;
    params.push(suspectId);
  }

  if (bailStatus) {
    sql += ` AND a.bail_status = ?`;
    params.push(bailStatus);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (a.arrest_number LIKE ? OR a.holding_cell_number LIKE ? OR a.arrestee_name LIKE ? OR c.case_number LIKE ?)`;
    const pattern = `%${search.trim()}%`;
    params.push(pattern, pattern, pattern, pattern);
  }

  sql += ` ORDER BY a.booking_timestamp DESC;`;

  return await query(sql, params);
}

export async function getArrestById(id) {
  const sql = `
    SELECT 
      a.id,
      a.arrest_number,
      a.case_id,
      a.suspect_id,
      a.arrestee_name,
      a.custody_type,
      a.magistrate_production_deadline,
      a.medical_exam_status,
      a.medical_officer_notes,
      a.relative_intimated,
      a.property_seized_inventory,
      a.arresting_officer_id,
      a.station_id,
      a.booking_timestamp,
      a.holding_cell_number,
      a.bail_status,
      a.bail_amount,
      a.release_timestamp,
      a.created_at,
      a.updated_at,
      c.case_number,
      COALESCE(a.arrestee_name, CONCAT(cr.first_name, ' ', cr.last_name)) AS display_detainee_name,
      CONCAT(cr.first_name, ' ', cr.last_name) AS suspect_name,
      cr.alias AS suspect_alias,
      s.name AS station_name,
      s.lockup_rooms,
      s.lockup_capacity,
      CONCAT(o.first_name, ' ', o.last_name) AS arresting_officer_name,
      o.badge_number AS arresting_officer_badge
    FROM Arrests_And_Custody a
    JOIN Cases c ON a.case_id = c.id
    JOIN Criminals cr ON a.suspect_id = cr.id
    JOIN Police_Stations s ON a.station_id = s.id
    JOIN Police_Officers o ON a.arresting_officer_id = o.id
    WHERE a.id = ?;
  `;
  const rows = await query(sql, [id]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Arrest booking record #${id} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_ARREST_NOT_FOUND';
    throw error;
  }
  return rows[0];
}

export async function createArrest({
  case_id,
  suspect_id,
  arresting_officer_id,
  station_id,
  booking_timestamp,
  holding_cell_number,
  bail_status = 'Pending',
  bail_amount = 0.0,
  arrestee_name = null,
  custody_type = 'Police Custody (PCR)',
  magistrate_production_deadline = null,
  medical_exam_status = 'Conducted - Fit for Lockup',
  medical_officer_notes = null,
  relative_intimated = null,
  property_seized_inventory = null,
}) {
  await getCaseById(case_id);
  const criminal = await getCriminalById(suspect_id);
  await getStationById(station_id);

  if (!BAIL_STATUSES.includes(bail_status)) {
    const error = new Error(`Invalid bail status '${bail_status}'. Allowed: ${BAIL_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const currentYear = new Date().getFullYear();
  const [countRows] = await query(`SELECT COUNT(*) AS total FROM Arrests_And_Custody WHERE YEAR(created_at) = ?`, [currentYear]);
  const seq = String(countRows[0].total + 1).padStart(3, '0');
  const arrestNumber = `ARR-${currentYear}-${seq}`;

  const bookingDate = booking_timestamp ? new Date(booking_timestamp) : new Date();
  // 24-Hour Magistrate Production Mandate (CrPC 57 / BNSS 58)
  const productionDeadline = magistrate_production_deadline
    ? new Date(magistrate_production_deadline)
    : new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000);

  const finalArresteeName = arrestee_name ? arrestee_name.trim() : `${criminal.first_name} ${criminal.last_name}`;

  const result = await query(
    `INSERT INTO Arrests_And_Custody 
     (arrest_number, case_id, suspect_id, arresting_officer_id, station_id, booking_timestamp, holding_cell_number, bail_status, bail_amount, arrestee_name, custody_type, magistrate_production_deadline, medical_exam_status, medical_officer_notes, relative_intimated, property_seized_inventory)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      arrestNumber,
      case_id,
      suspect_id,
      arresting_officer_id,
      station_id,
      bookingDate,
      holding_cell_number.trim(),
      bail_status,
      Number(bail_amount) || 0.0,
      finalArresteeName,
      custody_type || 'Police Custody (PCR)',
      productionDeadline,
      medical_exam_status || 'Conducted - Fit for Lockup',
      medical_officer_notes ? medical_officer_notes.trim() : 'Preliminary fitness exam completed at Govt Hospital.',
      relative_intimated ? relative_intimated.trim() : 'Family intimation logged under CrPC Sec 50A.',
      property_seized_inventory ? property_seized_inventory.trim() : 'Personal effects retained in lockup custody locker.',
    ]
  );

  return await getArrestById(result.insertId);
}

export async function updateBailStatus(id, { bail_status, bail_amount, release_timestamp }, requestingUser = null) {
  const arrest = await getArrestById(id);

  if (!BAIL_STATUSES.includes(bail_status)) {
    const error = new Error(`Invalid bail status '${bail_status}'. Allowed: ${BAIL_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (requestingUser) {
    if (requestingUser.role !== 'Head-Officer' && requestingUser.role !== 'System-Admin') {
      const error = new Error('Access Denied: Only Head-Officers and System-Admins are authorized to discharge detainees or modify bail status.');
      error.statusCode = 403;
      error.code = 'ERR_UNAUTHORIZED';
      throw error;
    }
    if (requestingUser.role === 'Head-Officer' && arrest.station_id) {
      if (Number(arrest.station_id) !== Number(requestingUser.station_id)) {
        const error = new Error('Access Denied: Head-Officers can only discharge detainees booked in their assigned precinct station.');
        error.statusCode = 403;
        error.code = 'ERR_STATION_ACCESS_DENIED';
        throw error;
      }
    }
  }

  let releaseTime = release_timestamp ? new Date(release_timestamp) : null;
  if ((bail_status === 'Released on Bail' || bail_status === 'Granted') && !releaseTime) {
    releaseTime = new Date();
  }

  await query(
    `UPDATE Arrests_And_Custody
     SET bail_status = ?,
         bail_amount = COALESCE(?, bail_amount),
         release_timestamp = ?
     WHERE id = ?`,
    [bail_status, bail_amount !== undefined ? Number(bail_amount) : null, releaseTime, id]
  );

  if (requestingUser?.id) {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'JAIL_CUSTODY_DISCHARGED', 'Arrests_And_Custody', ?, ?)`,
      [
        requestingUser.id,
        id,
        JSON.stringify({
          arrest_number: arrest.arrest_number,
          detainee: arrest.arrestee_name || arrest.suspect_name,
          cell: arrest.holding_cell_number,
          previous_bail: arrest.bail_status,
          new_bail: bail_status,
          actor_badge: requestingUser.badge_number,
        }),
      ]
    );
  }

  return await getArrestById(id);
}

export async function deleteArrest(id, requestingUser = null) {
  const arrest = await getArrestById(id);

  if (requestingUser) {
    if (requestingUser.role !== 'Head-Officer' && requestingUser.role !== 'System-Admin') {
      const error = new Error('Access Denied: Only Head-Officers and System-Admins are authorized to remove custody records.');
      error.statusCode = 403;
      error.code = 'ERR_UNAUTHORIZED';
      throw error;
    }
    if (requestingUser.role === 'Head-Officer' && arrest.station_id) {
      if (Number(arrest.station_id) !== Number(requestingUser.station_id)) {
        const error = new Error('Access Denied: Head-Officers can only remove custody records in their assigned precinct station.');
        error.statusCode = 403;
        error.code = 'ERR_STATION_ACCESS_DENIED';
        throw error;
      }
    }
  }

  await query(`DELETE FROM Arrests_And_Custody WHERE id = ?`, [id]);

  if (requestingUser?.id) {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'JAIL_CUSTODY_RECORD_REMOVED', 'Arrests_And_Custody', ?, ?)`,
      [
        requestingUser.id,
        id,
        JSON.stringify({
          arrest_number: arrest.arrest_number,
          detainee: arrest.arrestee_name || arrest.suspect_name,
          cell: arrest.holding_cell_number,
          actor_badge: requestingUser.badge_number,
        }),
      ]
    );
  }

  return { id, deleted: true };
}
