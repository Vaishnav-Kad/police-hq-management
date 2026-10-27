import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { getStationById } from './stationService.js';

/**
 * Service: List officers with filtering by station, role, search query and ABAC/RBAC area scoping
 */
export async function getAllOfficers({ stationId, role, search, includeDeleted = false, requestingUser = null } = {}) {
  // Build SELECT with initial_password access rules:
  // - System-Admin: can view all passwords
  // - Head-Officer: can view initial passwords of officers in their precinct or officers they created
  // - Creator officer: can view officers they created
  let passwordSelect = ', o.initial_password';
  const accessParams = [];

  if (requestingUser?.role === 'System-Admin') {
    passwordSelect = ', o.initial_password';
  } else if (requestingUser?.role === 'Head-Officer') {
    passwordSelect = ', CASE WHEN (o.station_id = ? OR o.created_by_officer_id = ?) THEN o.initial_password ELSE NULL END AS initial_password';
    accessParams.push(requestingUser.station_id, requestingUser.id);
  } else if (requestingUser) {
    passwordSelect = ', CASE WHEN o.created_by_officer_id = ? THEN o.initial_password ELSE NULL END AS initial_password';
    accessParams.push(requestingUser.id);
  }

  let sql = `
    SELECT 
      o.id,
      o.badge_number,
      o.first_name,
      o.last_name,
      o.rank_title,
      o.role,
      o.station_id,
      o.email,
      o.phone,
      o.blood_group,
      o.joining_date,
      o.emergency_contact,
      o.id_proof_number,
      o.created_by_officer_id,
      o.is_deleted,
      o.created_at,
      o.updated_at,
      s.name AS station_name,
      s.station_code,
      s.location AS station_location,
      s.lockup_rooms,
      s.evidence_vault_location
      ${passwordSelect}
    FROM Police_Officers o
    JOIN Police_Stations s ON o.station_id = s.id
    WHERE (? = TRUE OR o.is_deleted = FALSE)
  `;
  const params = [...accessParams, includeDeleted];

  if (stationId && stationId !== 'all') {
    sql += ` AND o.station_id = ?`;
    params.push(stationId);
  }

  if (role && role !== 'all') {
    sql += ` AND o.role = ?`;
    params.push(role);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (o.badge_number LIKE ? OR o.first_name LIKE ? OR o.last_name LIKE ? OR o.email LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY o.station_id ASC, o.id ASC;`;

  return await query(sql, params);
}

/**
 * Service: Get single officer details by ID
 */
export async function getOfficerById(officerId, requestingUser = null) {
  let passwordSelect = ', o.initial_password';
  const accessParams = [];

  if (requestingUser?.role === 'System-Admin') {
    passwordSelect = ', o.initial_password';
  } else if (requestingUser?.role === 'Head-Officer') {
    passwordSelect = ', CASE WHEN (o.station_id = ? OR o.created_by_officer_id = ?) THEN o.initial_password ELSE NULL END AS initial_password';
    accessParams.push(requestingUser.station_id, requestingUser.id);
  } else if (requestingUser) {
    passwordSelect = ', CASE WHEN o.created_by_officer_id = ? THEN o.initial_password ELSE NULL END AS initial_password';
    accessParams.push(requestingUser.id);
  }

  const sql = `
    SELECT 
      o.id,
      o.badge_number,
      o.first_name,
      o.last_name,
      o.rank_title,
      o.role,
      o.station_id,
      o.email,
      o.phone,
      o.blood_group,
      o.joining_date,
      o.emergency_contact,
      o.id_proof_number,
      o.created_by_officer_id,
      o.is_deleted,
      o.created_at,
      o.updated_at,
      s.name AS station_name,
      s.station_code,
      s.location AS station_location,
      s.contact_details AS station_contact,
      s.lockup_rooms,
      s.evidence_vault_location
      ${passwordSelect}
    FROM Police_Officers o
    JOIN Police_Stations s ON o.station_id = s.id
    WHERE o.id = ?;
  `;
  const rows = await query(sql, [...accessParams, officerId]);
  if (!rows || rows.length === 0) {
    const error = new Error(`Police Officer #${officerId} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_OFFICER_NOT_FOUND';
    throw error;
  }
  return rows[0];
}

/**
 * Service: Register new officer with bcrypt hashed password & initial credential preservation
 */
export async function createOfficer({
  badge_number,
  first_name,
  last_name,
  rank_title,
  role,
  station_id,
  password,
  email,
  phone,
  blood_group = 'B+',
  joining_date = null,
  emergency_contact = null,
  id_proof_number = null,
  createdByOfficerId = null,
  requestingUser = null,
}) {
  const normalizedBadge = badge_number.trim().toUpperCase();

  // Check unique badge number
  const existingBadge = await query(`SELECT id FROM Police_Officers WHERE badge_number = ?`, [normalizedBadge]);
  if (existingBadge.length > 0) {
    const error = new Error(`Badge number '${normalizedBadge}' is already registered to another officer.`);
    error.statusCode = 409;
    error.code = 'ERR_DUPLICATE_BADGE';
    throw error;
  }

  // If Head-Officer is creating an officer, constrain to their assigned precinct station
  let targetStationId = station_id;
  if (requestingUser && requestingUser.role === 'Head-Officer') {
    targetStationId = requestingUser.station_id;
  }

  // Verify station exists
  await getStationById(targetStationId);

  const rawPassword = password && password.trim() !== '' ? password.trim() : 'Officer@123';

  // Hash password with bcrypt
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  const creatorId = createdByOfficerId || requestingUser?.id || null;

  const result = await query(
    `INSERT INTO Police_Officers 
     (badge_number, first_name, last_name, rank_title, role, station_id, password_hash, initial_password, created_by_officer_id, email, phone, blood_group, joining_date, emergency_contact, id_proof_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      normalizedBadge,
      first_name.trim(),
      last_name.trim(),
      rank_title.trim(),
      role,
      targetStationId,
      passwordHash,
      rawPassword,
      creatorId,
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      blood_group ? blood_group.trim() : 'B+',
      joining_date || new Date().toISOString().slice(0, 10),
      emergency_contact ? emergency_contact.trim() : 'Police Control Desk (022-22620429)',
      id_proof_number ? id_proof_number.trim() : `MH-POL-${normalizedBadge}`,
    ]
  );

  return await getOfficerById(result.insertId, requestingUser || { role: 'System-Admin' });
}

/**
 * Service: Update officer administrative details
 */
export async function updateOfficer(officerId, {
  first_name,
  last_name,
  rank_title,
  role,
  station_id,
  email,
  phone,
  password,
  blood_group,
  joining_date,
  emergency_contact,
  id_proof_number,
}, requestingUser = null) {
  const officer = await getOfficerById(officerId, requestingUser);

  if (requestingUser) {
    if (requestingUser.role !== 'Head-Officer' && requestingUser.role !== 'System-Admin') {
      const error = new Error('Access Denied: Only Head-Officers and System-Admins are authorized to modify officer profiles.');
      error.statusCode = 403;
      error.code = 'ERR_UNAUTHORIZED';
      throw error;
    }
    if (requestingUser.role === 'Head-Officer') {
      if (Number(officer.station_id) !== Number(requestingUser.station_id)) {
        const error = new Error('Jurisdiction Access Denied: Head-Officers can only update officers assigned to their own precinct station.');
        error.statusCode = 403;
        error.code = 'ERR_FORBIDDEN_STATION';
        throw error;
      }
      if (officer.role === 'System-Admin') {
        const error = new Error('Permission Denied: Head-Officers cannot modify a System Administrator profile.');
        error.statusCode = 403;
        error.code = 'ERR_FORBIDDEN_ACTION';
        throw error;
      }
      if (role === 'System-Admin') {
        const error = new Error('Permission Denied: Head-Officers cannot promote an officer to System Administrator.');
        error.statusCode = 403;
        error.code = 'ERR_FORBIDDEN_ACTION';
        throw error;
      }
      if (station_id && Number(station_id) !== Number(requestingUser.station_id)) {
        const error = new Error('Permission Denied: Cross-station transfers require State HQ / System-Admin authorization.');
        error.statusCode = 403;
        error.code = 'ERR_FORBIDDEN_ACTION';
        throw error;
      }
    }
  }

  let passwordHash = null;
  let rawPassword = null;
  if (password && password.trim() !== '') {
    const salt = await bcrypt.genSalt(10);
    passwordHash = await bcrypt.hash(password.trim(), salt);
    rawPassword = password.trim();
  }

  if (station_id) {
    await getStationById(station_id);
  }

  await query(
    `UPDATE Police_Officers 
     SET first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         rank_title = COALESCE(?, rank_title),
         role = COALESCE(?, role),
         station_id = COALESCE(?, station_id),
         email = COALESCE(?, email),
         phone = COALESCE(?, phone),
         password_hash = COALESCE(?, password_hash),
         initial_password = COALESCE(?, initial_password),
         blood_group = COALESCE(?, blood_group),
         joining_date = COALESCE(?, joining_date),
         emergency_contact = COALESCE(?, emergency_contact),
         id_proof_number = COALESCE(?, id_proof_number)
     WHERE id = ?`,
    [
      first_name ? first_name.trim() : null,
      last_name ? last_name.trim() : null,
      rank_title ? rank_title.trim() : null,
      role || null,
      station_id || null,
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      passwordHash,
      rawPassword,
      blood_group ? blood_group.trim() : null,
      joining_date || null,
      emergency_contact ? emergency_contact.trim() : null,
      id_proof_number ? id_proof_number.trim() : null,
      officerId,
    ]
  );

  if (requestingUser?.id) {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'OFFICER_UPDATED', 'Police_Officers', ?, ?)`,
      [
        requestingUser.id,
        officerId,
        JSON.stringify({
          badge_number: officer.badge_number,
          officer_name: `${first_name || officer.first_name} ${last_name || officer.last_name}`,
          rank_title: rank_title || officer.rank_title,
          role: role || officer.role,
          station_id: station_id || officer.station_id,
          actor_badge: requestingUser.badge_number,
        }),
      ]
    );
  }

  return await getOfficerById(officerId, requestingUser);
}

/**
 * Service: Soft-delete / decommission officer with rank & station checks
 */
export async function deleteOfficer(officerId, requestingUser = null) {
  const officer = await getOfficerById(officerId);

  if (requestingUser) {
    if (requestingUser.role === 'Head-Officer') {
      if (Number(officer.station_id) !== Number(requestingUser.station_id)) {
        const error = new Error('Jurisdiction Access Denied: Head Officers can only decommission officers assigned to their own precinct station.');
        error.statusCode = 403;
        error.code = 'ERR_FORBIDDEN_STATION';
        throw error;
      }
      if (officer.role === 'System-Admin') {
        const error = new Error('Permission Denied: Head Officers cannot decommission a System Administrator.');
        error.statusCode = 403;
        error.code = 'ERR_FORBIDDEN_ACTION';
        throw error;
      }
    }
    if (Number(officerId) === Number(requestingUser.id)) {
      const error = new Error('Action Denied: You cannot decommission your own active officer account.');
      error.statusCode = 400;
      error.code = 'ERR_SELF_DECOMMISSION';
      throw error;
    }
  }

  // Check if officer is assigned to active open cases
  const assignedCases = await query(
    `SELECT COUNT(*) AS total FROM Cases WHERE assigned_officer_id = ? AND is_deleted = FALSE AND case_status NOT IN ('Closed', 'Cold')`,
    [officerId]
  );

  if (assignedCases[0].total > 0) {
    const error = new Error(
      `Cannot deactivate Officer ${officer.rank_title} ${officer.first_name} ${officer.last_name}: currently assigned as primary investigator on ${assignedCases[0].total} active cases. Reassign cases first.`
    );
    error.statusCode = 400;
    error.code = 'ERR_OFFICER_HAS_ACTIVE_CASES';
    throw error;
  }

  await query(`UPDATE Police_Officers SET is_deleted = TRUE WHERE id = ?`, [officerId]);

  // Record Audit Log
  const actorId = requestingUser?.id || officerId;
  await query(
    `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
     VALUES (?, 'OFFICER_DECOMMISSIONED', 'Police_Officers', ?, ?)`,
    [
      actorId,
      officerId,
      JSON.stringify({
        decommissioned_badge: officer.badge_number,
        officer_name: `${officer.first_name} ${officer.last_name}`,
        rank_title: officer.rank_title,
        station_id: officer.station_id,
        actor_badge: requestingUser?.badge_number || 'SYSTEM',
        timestamp: new Date().toISOString(),
      }),
    ]
  );

  return { id: officerId, is_deleted: true };
}
