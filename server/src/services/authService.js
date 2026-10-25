import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { generateToken } from '../middleware/authMiddleware.js';

/**
 * Service: Login officer using badge number and password
 */
export async function loginOfficer(badgeNumber, password, ipAddress = null) {
  const rows = await query(
    `SELECT o.id, o.badge_number, o.first_name, o.last_name, o.rank_title, o.role, 
            o.station_id, o.password_hash, o.email, o.phone, o.is_deleted,
            s.name AS station_name, s.location AS station_location
     FROM Police_Officers o
     JOIN Police_Stations s ON o.station_id = s.id
     WHERE o.badge_number = ?`,
    [badgeNumber]
  );

  if (!rows || rows.length === 0) {
    const error = new Error('Invalid badge number or password.');
    error.statusCode = 401;
    error.code = 'ERR_INVALID_CREDENTIALS';
    throw error;
  }

  const officer = rows[0];

  if (officer.is_deleted) {
    const error = new Error('Officer account has been deactivated or suspended.');
    error.statusCode = 403;
    error.code = 'ERR_ACCOUNT_DEACTIVATED';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, officer.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid badge number or password.');
    error.statusCode = 401;
    error.code = 'ERR_INVALID_CREDENTIALS';
    throw error;
  }

  // Generate signed JWT
  const tokenPayload = {
    id: officer.id,
    badge_number: officer.badge_number,
    role: officer.role,
    station_id: officer.station_id,
  };
  const token = generateToken(tokenPayload);

  // Record audit log entry for security traceability
  try {
    await query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'LOGIN', 'Police_Officers', ?, ?)`,
      [
        officer.id,
        officer.id,
        JSON.stringify({
          message: 'Officer authenticated successfully',
          badge_number: officer.badge_number,
          ip: ipAddress,
          timestamp: new Date().toISOString(),
        }),
      ]
    );
  } catch (auditErr) {
    console.error('[Audit Warning] Could not record login audit log:', auditErr.message);
  }

  return {
    token,
    user: {
      id: officer.id,
      badge_number: officer.badge_number,
      first_name: officer.first_name,
      last_name: officer.last_name,
      rank_title: officer.rank_title,
      role: officer.role,
      station_id: officer.station_id,
      station_name: officer.station_name,
      station_location: officer.station_location,
      email: officer.email,
      phone: officer.phone,
    },
  };
}

/**
 * Service: Fetch current officer profile
 */
export async function getOfficerProfile(officerId) {
  const rows = await query(
    `SELECT o.id, o.badge_number, o.first_name, o.last_name, o.rank_title, o.role, 
            o.station_id, o.email, o.phone, o.created_at,
            s.name AS station_name, s.location AS station_location, s.contact_details AS station_contact
     FROM Police_Officers o
     JOIN Police_Stations s ON o.station_id = s.id
     WHERE o.id = ? AND o.is_deleted = FALSE`,
    [officerId]
  );

  if (!rows || rows.length === 0) {
    const error = new Error('Officer profile not found.');
    error.statusCode = 404;
    error.code = 'ERR_OFFICER_NOT_FOUND';
    throw error;
  }

  return rows[0];
}
