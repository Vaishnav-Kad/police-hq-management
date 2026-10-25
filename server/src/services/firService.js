import { query, withTransaction } from '../config/db.js';
import { getStationById } from './stationService.js';

/**
 * Helper: Determine default priority from crime type
 */
function determinePriority(crimeType) {
  const normalized = (crimeType || '').toLowerCase();
  if (normalized.includes('homicide') || normalized.includes('murder') || normalized.includes('dacoity') || normalized.includes('terrorism')) {
    return 'Critical';
  }
  if (normalized.includes('robbery') || normalized.includes('narcotics') || normalized.includes('extortion') || normalized.includes('arms')) {
    return 'High';
  }
  if (normalized.includes('theft') || normalized.includes('burglary') || normalized.includes('fraud')) {
    return 'Medium';
  }
  return 'Low';
}

/**
 * Service: List FIRs with filters and ABAC station scoping
 */
export async function getAllFIRs({ stationId, status, crimeType, search, userRole, userStationId } = {}) {
  let sql = `
    SELECT 
      f.id,
      f.fir_number,
      f.station_id,
      f.filed_by_officer_id,
      f.date_filed,
      f.incident_date,
      f.crime_type,
      f.description,
      f.status,
      f.latitude,
      f.longitude,
      f.complainant_name,
      f.complainant_phone,
      f.complainant_address,
      f.complainant_id_proof,
      f.complainant_type,
      f.accused_name,
      f.accused_alias,
      f.accused_details,
      f.suspect_status,
      f.is_deleted,
      f.created_at,
      f.updated_at,
      s.name AS station_name,
      CONCAT(o.first_name, ' ', o.last_name) AS filed_by_officer_name,
      o.badge_number AS filed_by_officer_badge,
      c.id AS case_id,
      c.case_number,
      c.case_status,
      c.priority AS case_priority
    FROM FIR f
    JOIN Police_Stations s ON f.station_id = s.id
    JOIN Police_Officers o ON f.filed_by_officer_id = o.id
    LEFT JOIN Cases c ON f.id = c.fir_id
    WHERE f.is_deleted = FALSE
  `;
  const params = [];

  // ABAC: Regular Officers only see FIRs from their precinct
  if (userRole === 'Officer' || userRole === 'Evidence-Manager') {
    sql += ` AND f.station_id = ?`;
    params.push(userStationId);
  } else if (stationId && stationId !== 'all') {
    sql += ` AND f.station_id = ?`;
    params.push(stationId);
  }

  if (status) {
    sql += ` AND f.status = ?`;
    params.push(status);
  }

  if (crimeType) {
    sql += ` AND f.crime_type LIKE ?`;
    params.push(`%${crimeType.trim()}%`);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (f.fir_number LIKE ? OR f.description LIKE ? OR f.crime_type LIKE ? OR f.complainant_name LIKE ? OR f.accused_name LIKE ? OR f.accused_alias LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY f.date_filed DESC;`;

  return await query(sql, params);
}

/**
 * Service: Get single FIR details by ID
 */
export async function getFIRById(firId) {
  const sql = `
    SELECT 
      f.id,
      f.fir_number,
      f.station_id,
      f.filed_by_officer_id,
      f.date_filed,
      f.incident_date,
      f.crime_type,
      f.description,
      f.status,
      f.latitude,
      f.longitude,
      f.complainant_name,
      f.complainant_phone,
      f.complainant_address,
      f.complainant_id_proof,
      f.complainant_type,
      f.accused_name,
      f.accused_alias,
      f.accused_details,
      f.suspect_status,
      f.is_deleted,
      f.created_at,
      f.updated_at,
      s.name AS station_name,
      s.location AS station_location,
      CONCAT(o.first_name, ' ', o.last_name) AS filed_by_officer_name,
      o.badge_number AS filed_by_officer_badge,
      c.id AS case_id,
      c.case_number,
      c.case_status,
      c.priority AS case_priority,
      c.assigned_officer_id,
      c.open_date,
      c.close_date
    FROM FIR f
    JOIN Police_Stations s ON f.station_id = s.id
    JOIN Police_Officers o ON f.filed_by_officer_id = o.id
    LEFT JOIN Cases c ON f.id = c.fir_id
    WHERE f.id = ?;
  `;
  const rows = await query(sql, [firId]);
  if (!rows || rows.length === 0) {
    const error = new Error(`First Information Report (FIR) #${firId} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_FIR_NOT_FOUND';
    throw error;
  }
  return rows[0];
}

/**
 * Service: Register FIR with Atomic 1:1 Case Creation Transaction
 */
export async function createFIR({
  station_id,
  filed_by_officer_id,
  incident_date,
  crime_type,
  description,
  latitude,
  longitude,
  complainant_name,
  complainant_phone,
  complainant_address,
  complainant_id_proof,
  complainant_type,
  accused_name,
  accused_alias,
  accused_details,
  suspect_status,
}) {
  await getStationById(station_id);

  // Coordinate range validation
  if (latitude !== undefined && latitude !== null) {
    const lat = Number(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      const err = new Error('Invalid latitude coordinate. Must be between -90 and 90.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (longitude !== undefined && longitude !== null) {
    const lng = Number(longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      const err = new Error('Invalid longitude coordinate. Must be between -180 and 180.');
      err.statusCode = 400;
      throw err;
    }
  }

  const priority = determinePriority(crime_type);
  const currentYear = new Date().getFullYear();

  // Execute inside atomic database transaction with session actor propagation
  return await withTransaction(filed_by_officer_id, async (connection) => {
    // 1. Generate unique sequential FIR number and Case number (collision-free)
    const [existingFirs] = await connection.query(
      `SELECT fir_number FROM FIR WHERE fir_number LIKE ?`,
      [`FIR-${currentYear}-%`]
    );
    const [existingCases] = await connection.query(
      `SELECT case_number FROM Cases WHERE case_number LIKE ?`,
      [`CASE-${currentYear}-%`]
    );

    let maxSeq = 0;
    existingFirs.forEach((row) => {
      const match = (row.fir_number || '').match(/FIR-\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    existingCases.forEach((row) => {
      const match = (row.case_number || '').match(/CASE-\d+-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });

    let nextSeq = maxSeq + 1;
    let firNumber = `FIR-${currentYear}-${String(nextSeq).padStart(3, '0')}`;
    let caseNumber = `CASE-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

    while (
      existingFirs.some((r) => r.fir_number === firNumber) ||
      existingCases.some((r) => r.case_number === caseNumber)
    ) {
      nextSeq++;
      firNumber = `FIR-${currentYear}-${String(nextSeq).padStart(3, '0')}`;
      caseNumber = `CASE-${currentYear}-${String(nextSeq).padStart(3, '0')}`;
    }

    // 2. Insert FIR with Complainant & Accused Particulars
    const [firResult] = await connection.query(
      `INSERT INTO FIR 
       (fir_number, station_id, filed_by_officer_id, incident_date, crime_type, description, status, latitude, longitude,
        complainant_name, complainant_phone, complainant_address, complainant_id_proof, complainant_type,
        accused_name, accused_alias, accused_details, suspect_status)
       VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firNumber,
        station_id,
        filed_by_officer_id,
        new Date(incident_date),
        crime_type.trim(),
        description.trim(),
        latitude ? Number(latitude) : null,
        longitude ? Number(longitude) : null,
        complainant_name ? complainant_name.trim() : null,
        complainant_phone ? complainant_phone.trim() : null,
        complainant_address ? complainant_address.trim() : null,
        complainant_id_proof ? complainant_id_proof.trim() : null,
        complainant_type || 'Citizen / Victim',
        accused_name ? accused_name.trim() : 'Unidentified Suspect(s)',
        accused_alias ? accused_alias.trim() : null,
        accused_details ? accused_details.trim() : null,
        suspect_status || 'Named in FIR',
      ]
    );
    const firId = firResult.insertId;

    // 3. Auto-instantiate 1:1 corresponding Case
    const [caseResult] = await connection.query(
      `INSERT INTO Cases 
       (case_number, fir_id, assigned_officer_id, case_status, priority, open_date)
       VALUES (?, ?, NULL, 'Filed', ?, CURDATE())`,
      [caseNumber, firId, priority]
    );
    const caseId = caseResult.insertId;

    // 4. Trigger alert if violent/critical crime
    if (priority === 'Critical' || priority === 'High') {
      await connection.query(
        `INSERT INTO Alerts (case_id, alert_message, severity, is_read)
         VALUES (?, ?, ?, FALSE)`,
        [
          caseId,
          `High-Priority Incident Alert: New ${priority} crime registered under ${firNumber} (${crime_type}). Immediate precinct attention requested.`,
          priority,
        ]
      );
    }

    // 5. Audit log
    await connection.query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'FIR_REGISTERED', 'FIR', ?, ?)`,
      [
        filed_by_officer_id,
        firId,
        JSON.stringify({
          fir_number: firNumber,
          case_number: caseNumber,
          crime_type,
          station_id,
        }),
      ]
    );

    return {
      firId,
      firNumber,
      caseId,
      caseNumber,
      status: 'Active',
      priority,
    };
  });
}

/**
 * Service: Update FIR details
 */
export async function updateFIR(firId, { crime_type, description, status, latitude, longitude }) {
  await getFIRById(firId);

  await query(
    `UPDATE FIR 
     SET crime_type = COALESCE(?, crime_type),
         description = COALESCE(?, description),
         status = COALESCE(?, status),
         latitude = COALESCE(?, latitude),
         longitude = COALESCE(?, longitude)
     WHERE id = ?`,
    [
      crime_type ? crime_type.trim() : null,
      description ? description.trim() : null,
      status || null,
      latitude !== undefined ? Number(latitude) : null,
      longitude !== undefined ? Number(longitude) : null,
      firId,
    ]
  );

  return await getFIRById(firId);
}

/**
 * Service: Soft-delete FIR
 */
export async function deleteFIR(firId) {
  await getFIRById(firId);
  await query(`UPDATE FIR SET is_deleted = TRUE WHERE id = ?`, [firId]);
  return { id: firId, is_deleted: true };
}
