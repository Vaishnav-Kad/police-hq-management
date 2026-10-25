import { query } from '../config/db.js';

/**
 * Service: List all police stations with officer and case counts
 */
export async function getAllStations(includeDeleted = false) {
  const sql = `
    SELECT 
      s.id,
      s.name,
      s.location,
      s.contact_details,
      s.station_code,
      s.zone_division,
      s.jurisdiction_area_sq_km,
      s.lockup_capacity,
      s.lockup_rooms,
      s.evidence_vault_location,
      s.evidence_vault_capacity,
      s.is_deleted,
      s.created_at,
      s.updated_at,
      COUNT(DISTINCT CASE WHEN o.is_deleted = FALSE THEN o.id END) AS active_officers_count,
      COUNT(DISTINCT CASE WHEN c.is_deleted = FALSE AND c.case_status NOT IN ('Closed', 'Cold') THEN c.id END) AS active_cases_count
    FROM Police_Stations s
    LEFT JOIN Police_Officers o ON s.id = o.station_id
    LEFT JOIN FIR f ON s.id = f.station_id
    LEFT JOIN Cases c ON f.id = c.fir_id
    WHERE ? = TRUE OR s.is_deleted = FALSE
    GROUP BY s.id
    ORDER BY s.id ASC;
  `;
  return await query(sql, [includeDeleted]);
}

/**
 * Service: Get single station details by ID
 */
export async function getStationById(stationId) {
  const sql = `
    SELECT 
      s.id,
      s.name,
      s.location,
      s.contact_details,
      s.station_code,
      s.zone_division,
      s.jurisdiction_area_sq_km,
      s.lockup_capacity,
      s.lockup_rooms,
      s.evidence_vault_location,
      s.evidence_vault_capacity,
      s.is_deleted,
      s.created_at,
      s.updated_at,
      COUNT(DISTINCT CASE WHEN o.is_deleted = FALSE THEN o.id END) AS active_officers_count,
      COUNT(DISTINCT CASE WHEN c.is_deleted = FALSE AND c.case_status NOT IN ('Closed', 'Cold') THEN c.id END) AS active_cases_count
    FROM Police_Stations s
    LEFT JOIN Police_Officers o ON s.id = o.station_id
    LEFT JOIN FIR f ON s.id = f.station_id
    LEFT JOIN Cases c ON f.id = c.fir_id
    WHERE s.id = ?
    GROUP BY s.id;
  `;
  const rows = await query(sql, [stationId]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Police Station #${stationId} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_STATION_NOT_FOUND';
    throw error;
  }
  return rows[0];
}

/**
 * Service: Create new police station (Admin only) with Lockup & Evidence Vault provisioning
 */
export async function createStation({
  name,
  location,
  contact_details,
  station_code,
  zone_division,
  jurisdiction_area_sq_km,
  lockup_capacity,
  lockup_rooms,
  evidence_vault_location,
  evidence_vault_capacity,
}) {
  const generatedCode = station_code ? station_code.trim().toUpperCase() : `MUM-STN-${Date.now().toString().slice(-4)}`;
  const lockupRoomsDef = lockup_rooms ? lockup_rooms.trim() : 'Cell 1 (General), Cell 2 (Remand)';
  const vaultLocDef = evidence_vault_location ? evidence_vault_location.trim() : `${name.trim()} Malkhana Vault Bay 1`;

  const result = await query(
    `INSERT INTO Police_Stations 
     (name, location, contact_details, station_code, zone_division, jurisdiction_area_sq_km, lockup_capacity, lockup_rooms, evidence_vault_location, evidence_vault_capacity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      location.trim(),
      contact_details.trim(),
      generatedCode,
      zone_division ? zone_division.trim() : 'Zone 1',
      jurisdiction_area_sq_km ? Number(jurisdiction_area_sq_km) : 10.0,
      lockup_capacity ? Number(lockup_capacity) : 10,
      lockupRoomsDef,
      vaultLocDef,
      evidence_vault_capacity ? Number(evidence_vault_capacity) : 50,
    ]
  );
  return await getStationById(result.insertId);
}

/**
 * Service: Update station details (Admin only)
 */
export async function updateStation(stationId, {
  name,
  location,
  contact_details,
  station_code,
  zone_division,
  jurisdiction_area_sq_km,
  lockup_capacity,
  lockup_rooms,
  evidence_vault_location,
  evidence_vault_capacity,
}) {
  await getStationById(stationId); // Ensure exists

  await query(
    `UPDATE Police_Stations 
     SET name = COALESCE(?, name),
         location = COALESCE(?, location),
         contact_details = COALESCE(?, contact_details),
         station_code = COALESCE(?, station_code),
         zone_division = COALESCE(?, zone_division),
         jurisdiction_area_sq_km = COALESCE(?, jurisdiction_area_sq_km),
         lockup_capacity = COALESCE(?, lockup_capacity),
         lockup_rooms = COALESCE(?, lockup_rooms),
         evidence_vault_location = COALESCE(?, evidence_vault_location),
         evidence_vault_capacity = COALESCE(?, evidence_vault_capacity)
     WHERE id = ?`,
    [
      name ? name.trim() : null,
      location ? location.trim() : null,
      contact_details ? contact_details.trim() : null,
      station_code ? station_code.trim().toUpperCase() : null,
      zone_division ? zone_division.trim() : null,
      jurisdiction_area_sq_km !== undefined ? Number(jurisdiction_area_sq_km) : null,
      lockup_capacity !== undefined ? Number(lockup_capacity) : null,
      lockup_rooms ? lockup_rooms.trim() : null,
      evidence_vault_location ? evidence_vault_location.trim() : null,
      evidence_vault_capacity !== undefined ? Number(evidence_vault_capacity) : null,
      stationId,
    ]
  );

  return await getStationById(stationId);
}

/**
 * Service: Soft-delete police station with safety checks
 */
export async function deleteStation(stationId) {
  await getStationById(stationId);

  // Safety Check: Check if active cases exist at this station
  const activeCases = await query(
    `SELECT COUNT(*) AS total 
     FROM Cases c 
     JOIN FIR f ON c.fir_id = f.id 
     WHERE f.station_id = ? AND c.is_deleted = FALSE AND c.case_status NOT IN ('Closed', 'Cold')`,
    [stationId]
  );

  if (activeCases[0].total > 0) {
    const error = new Error(`Cannot deactivate Station #${stationId}: it currently holds ${activeCases[0].total} active open cases.`);
    error.statusCode = 400;
    error.code = 'ERR_STATION_HAS_ACTIVE_CASES';
    throw error;
  }

  await query(`UPDATE Police_Stations SET is_deleted = TRUE WHERE id = ?`, [stationId]);
  return { id: stationId, is_deleted: true };
}
