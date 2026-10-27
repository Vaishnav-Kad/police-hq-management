import { query } from '../config/db.js';

export const INVOLVEMENT_TYPES = ['Suspect', 'Accused', 'Convicted'];

/**
 * Service: List criminals with full-text search ft_criminal_search and regional scoping
 */
export async function getAllCriminals({ search, gender, includeDeleted = false, stationId, userRole, userStationId } = {}) {
  let sql = `
    SELECT 
      c.id,
      c.first_name,
      c.last_name,
      c.alias,
      c.dob,
      c.gender,
      c.physical_description,
      c.mugshot_path,
      c.id_proof_number,
      c.father_name,
      c.threat_level,
      c.gang_affiliation,
      c.prior_convictions_count,
      c.fingerprint_id,
      c.known_territory,
      c.is_deleted,
      c.created_at,
      c.updated_at,
      COUNT(DISTINCT j.case_id) AS total_cases_involved
    FROM Criminals c
    LEFT JOIN Case_Criminal_Junction j ON c.id = j.criminal_id
    LEFT JOIN Cases cs ON j.case_id = cs.id
    LEFT JOIN FIR f ON cs.fir_id = f.id
    WHERE (? = TRUE OR c.is_deleted = FALSE)
  `;
  const params = [includeDeleted];

  // ABAC / Regional Scoping:
  // Explicit stationId or regional officer/evidence manager precinct scoping
  const targetStation = stationId || ((userRole === 'Officer' || userRole === 'Evidence-Manager') && !search ? userStationId : null);
  if (targetStation) {
    sql += ` AND f.station_id = ?`;
    params.push(targetStation);
  }

  if (gender) {
    sql += ` AND c.gender = ?`;
    params.push(gender);
  }

  if (search && search.trim() !== '') {
    const rawSearch = search.trim();
    // Use fulltext index in boolean mode with wildcard expansion
    const ftQuery = rawSearch.split(/\s+/).map((word) => `${word}*`).join(' ');

    sql += ` AND (
      MATCH(c.alias, c.physical_description) AGAINST(? IN BOOLEAN MODE)
      OR c.first_name LIKE ?
      OR c.last_name LIKE ?
      OR c.alias LIKE ?
    )`;
    const wildcard = `%${rawSearch}%`;
    params.push(ftQuery, wildcard, wildcard, wildcard);
  }

  sql += `
    GROUP BY c.id
    ORDER BY c.last_name ASC, c.first_name ASC;
  `;

  return await query(sql, params);
}

/**
 * Service: Get single criminal dossier by ID
 */
export async function getCriminalById(criminalId) {
  const criminalRows = await query(
    `SELECT id, first_name, last_name, alias, dob, gender, physical_description, mugshot_path,
            id_proof_number, father_name, threat_level, gang_affiliation, prior_convictions_count, fingerprint_id, known_territory,
            is_deleted, created_at, updated_at
     FROM Criminals
     WHERE id = ?`,
    [criminalId]
  );

  if (!criminalRows || criminalRows.length === 0) {
    const error = new Error(`Criminal record #${criminalId} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_CRIMINAL_NOT_FOUND';
    throw error;
  }

  const criminal = criminalRows[0];

  // Cases involved in
  criminal.cases = await query(
    `SELECT 
       j.id AS junction_id,
       j.involvement_type,
       j.notes AS junction_notes,
       j.created_at AS association_date,
       cs.id AS case_id,
       cs.case_number,
       cs.case_status,
       cs.priority,
       f.crime_type,
       f.station_id,
       s.name AS station_name
     FROM Case_Criminal_Junction j
     JOIN Cases cs ON j.case_id = cs.id
     JOIN FIR f ON cs.fir_id = f.id
     JOIN Police_Stations s ON f.station_id = s.id
     WHERE j.criminal_id = ? AND cs.is_deleted = FALSE
     ORDER BY cs.created_at DESC`,
    [criminalId]
  );

  // Active or executed warrants
  criminal.warrants = await query(
    `SELECT id, warrant_number, issuing_judge, warrant_type, status, issue_date, expiry_date, execution_date, case_id
     FROM Warrants
     WHERE suspect_id = ?
     ORDER BY issue_date DESC`,
    [criminalId]
  );

  // Custody & arrest records
  criminal.arrests = await query(
    `SELECT a.id, a.arrest_number, a.case_id, a.booking_timestamp, a.holding_cell_number, a.bail_status, a.bail_amount, a.release_timestamp,
            s.name AS station_name
     FROM Arrests_And_Custody a
     JOIN Police_Stations s ON a.station_id = s.id
     WHERE a.suspect_id = ?
     ORDER BY a.booking_timestamp DESC`,
    [criminalId]
  );

  return criminal;
}

/**
 * Service: Create new criminal record
 */
export async function createCriminal({
  first_name,
  last_name,
  alias,
  dob,
  gender,
  physical_description,
  mugshot_path,
  id_proof_number,
  father_name,
  threat_level = 'Medium',
  gang_affiliation = 'Independent',
  prior_convictions_count = 0,
  fingerprint_id,
  known_territory,
}) {
  const result = await query(
    `INSERT INTO Criminals 
     (first_name, last_name, alias, dob, gender, physical_description, mugshot_path, id_proof_number, father_name, threat_level, gang_affiliation, prior_convictions_count, fingerprint_id, known_territory)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      first_name.trim(),
      last_name.trim(),
      alias ? alias.trim() : null,
      dob || null,
      gender || 'Unknown',
      physical_description ? physical_description.trim() : null,
      mugshot_path || null,
      id_proof_number ? id_proof_number.trim() : null,
      father_name ? father_name.trim() : null,
      threat_level || 'Medium',
      gang_affiliation ? gang_affiliation.trim() : 'Independent',
      prior_convictions_count !== undefined ? Number(prior_convictions_count) : 0,
      fingerprint_id ? fingerprint_id.trim() : null,
      known_territory ? known_territory.trim() : null,
    ]
  );

  return await getCriminalById(result.insertId);
}

/**
 * Service: Update criminal record
 */
export async function updateCriminal(criminalId, {
  first_name,
  last_name,
  alias,
  dob,
  gender,
  physical_description,
  mugshot_path,
  id_proof_number,
  father_name,
  threat_level,
  gang_affiliation,
  prior_convictions_count,
  fingerprint_id,
  known_territory,
}) {
  await getCriminalById(criminalId);

  await query(
    `UPDATE Criminals 
     SET first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         alias = COALESCE(?, alias),
         dob = COALESCE(?, dob),
         gender = COALESCE(?, gender),
         physical_description = COALESCE(?, physical_description),
         mugshot_path = COALESCE(?, mugshot_path),
         id_proof_number = COALESCE(?, id_proof_number),
         father_name = COALESCE(?, father_name),
         threat_level = COALESCE(?, threat_level),
         gang_affiliation = COALESCE(?, gang_affiliation),
         prior_convictions_count = COALESCE(?, prior_convictions_count),
         fingerprint_id = COALESCE(?, fingerprint_id),
         known_territory = COALESCE(?, known_territory)
     WHERE id = ?`,
    [
      first_name ? first_name.trim() : null,
      last_name ? last_name.trim() : null,
      alias !== undefined ? (alias ? alias.trim() : null) : null,
      dob || null,
      gender || null,
      physical_description ? physical_description.trim() : null,
      mugshot_path || null,
      id_proof_number ? id_proof_number.trim() : null,
      father_name ? father_name.trim() : null,
      threat_level || null,
      gang_affiliation ? gang_affiliation.trim() : null,
      prior_convictions_count !== undefined ? Number(prior_convictions_count) : null,
      fingerprint_id ? fingerprint_id.trim() : null,
      known_territory ? known_territory.trim() : null,
      criminalId,
    ]
  );

  return await getCriminalById(criminalId);
}

/**
 * Service: Update mugshot file path
 */
export async function updateMugshot(criminalId, mugshotPath) {
  await getCriminalById(criminalId);
  await query(`UPDATE Criminals SET mugshot_path = ? WHERE id = ?`, [mugshotPath, criminalId]);
  return await getCriminalById(criminalId);
}

/**
 * Service: Soft delete / archive criminal
 */
export async function deleteCriminal(criminalId, requestingUser = null) {
  const crim = await getCriminalById(criminalId);

  if (requestingUser) {
    if (requestingUser.role !== 'Head-Officer' && requestingUser.role !== 'System-Admin') {
      const error = new Error('Access Denied: Only Head-Officers and System-Admins are authorized to deactivate criminal dossiers.');
      error.statusCode = 403;
      error.code = 'ERR_UNAUTHORIZED';
      throw error;
    }
  }

  await query(`UPDATE Criminals SET is_deleted = TRUE WHERE id = ?`, [criminalId]);

  if (requestingUser?.id) {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'CRIMINAL_RECORD_DEACTIVATED', 'Criminals', ?, ?)`,
      [
        requestingUser.id,
        criminalId,
        JSON.stringify({
          name: `${crim.first_name} ${crim.last_name}`,
          alias: crim.alias,
          actor_badge: requestingUser.badge_number,
        }),
      ]
    );
  }

  return { id: criminalId, is_deleted: true };
}

/**
 * Service: Associate criminal with case (Junction)
 */
export async function linkCriminalToCase(caseId, criminalId, involvementType = 'Suspect', notes = null) {
  if (!INVOLVEMENT_TYPES.includes(involvementType)) {
    const error = new Error(`Invalid involvement type '${involvementType}'. Allowed: ${INVOLVEMENT_TYPES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  await query(
    `INSERT INTO Case_Criminal_Junction (case_id, criminal_id, involvement_type, notes)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE involvement_type = VALUES(involvement_type), notes = VALUES(notes)`,
    [caseId, criminalId, involvementType, notes ? notes.trim() : null]
  );

  return { caseId, criminalId, involvementType, linked: true };
}

/**
 * Service: Remove criminal association from case
 */
export async function unlinkCriminalFromCase(caseId, criminalId) {
  await query(
    `DELETE FROM Case_Criminal_Junction WHERE case_id = ? AND criminal_id = ?`,
    [caseId, criminalId]
  );
  return { caseId, criminalId, unlinked: true };
}
