import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { getCaseById } from './caseService.js';
import { getOfficerById } from './officerService.js';

export const EVIDENCE_TYPES = [
  'Firearm',
  'Weapon',
  'Narcotics',
  'Digital Media',
  'Hardware',
  'Document',
  'Biological',
  'Currency',
  'Clothing',
  'Other',
];

/**
 * Utility: Compute SHA-256 hexadecimal hash from file buffer on disk
 */
export function calculateFileHash(absoluteFilePath) {
  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`File not found at path: ${absoluteFilePath}`);
  }
  const fileBuffer = fs.readFileSync(absoluteFilePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Service: List evidence records with filtering and station ABAC scoping
 */
export async function getAllEvidences({ caseId, evidenceType, storageLocation, search, stationId, userRole, userStationId } = {}) {
  let sql = `
    SELECT 
      e.id,
      e.evidence_number,
      e.case_id,
      e.logged_by_officer_id,
      e.description,
      e.evidence_type,
      e.storage_location,
      e.station_id,
      e.locker_bin_number,
      e.chain_of_custody_status,
      e.seizure_memo_number,
      e.witness_name,
      e.file_path,
      e.file_hash,
      e.file_size_bytes,
      e.mime_type,
      e.is_deleted,
      e.created_at,
      e.updated_at,
      c.case_number,
      c.case_status,
      f.crime_type,
      COALESCE(e.station_id, f.station_id) AS resolved_station_id,
      s.name AS station_name,
      s.station_code,
      s.evidence_vault_location,
      CONCAT(o.first_name, ' ', o.last_name) AS logged_by_officer_name,
      o.badge_number AS logged_by_officer_badge,
      custodian.id AS current_custodian_id,
      CONCAT(custodian.first_name, ' ', custodian.last_name) AS current_custodian_name,
      custodian.badge_number AS current_custodian_badge
    FROM Evidences e
    JOIN Cases c ON e.case_id = c.id
    JOIN FIR f ON c.fir_id = f.id
    LEFT JOIN Police_Stations s ON COALESCE(e.station_id, f.station_id) = s.id
    JOIN Police_Officers o ON e.logged_by_officer_id = o.id
    LEFT JOIN (
      -- Subquery to resolve current custodian from latest custody log
      SELECT ecc1.evidence_id, ecc1.transferred_to_officer_id
      FROM Evidence_Chain_Of_Custody ecc1
      INNER JOIN (
        SELECT evidence_id, MAX(id) AS max_id
        FROM Evidence_Chain_Of_Custody
        GROUP BY evidence_id
      ) ecc2 ON ecc1.id = ecc2.max_id
    ) latest_custody ON e.id = latest_custody.evidence_id
    LEFT JOIN Police_Officers custodian ON latest_custody.transferred_to_officer_id = custodian.id
    WHERE e.is_deleted = FALSE
  `;
  const params = [];

  // ABAC: Regular Officers and Evidence Managers are strictly scoped to their precinct station
  if (userRole === 'Officer' || userRole === 'Evidence-Manager') {
    if (userStationId) {
      sql += ` AND (f.station_id = ? OR e.station_id = ?)`;
      params.push(userStationId, userStationId);
    }
  } else if (stationId) {
    sql += ` AND (f.station_id = ? OR e.station_id = ?)`;
    params.push(stationId, stationId);
  }

  if (caseId) {
    sql += ` AND e.case_id = ?`;
    params.push(caseId);
  }

  if (evidenceType) {
    sql += ` AND e.evidence_type = ?`;
    params.push(evidenceType);
  }

  if (storageLocation) {
    sql += ` AND e.storage_location LIKE ?`;
    params.push(`%${storageLocation.trim()}%`);
  }

  if (search && search.trim() !== '') {
    sql += ` AND (e.evidence_number LIKE ? OR e.description LIKE ? OR c.case_number LIKE ?)`;
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  sql += ` ORDER BY e.id DESC;`;

  return await query(sql, params);
}

/**
 * Service: Get single evidence record with custody timeline
 */
export async function getEvidenceById(evidenceId) {
  const rows = await query(
    `SELECT 
       e.id,
       e.evidence_number,
       e.case_id,
       e.logged_by_officer_id,
       e.description,
       e.evidence_type,
       e.storage_location,
       e.station_id,
       e.locker_bin_number,
       e.chain_of_custody_status,
       e.seizure_memo_number,
       e.witness_name,
       e.file_path,
       e.file_hash,
       e.file_size_bytes,
       e.mime_type,
       e.is_deleted,
       e.created_at,
       e.updated_at,
       c.case_number,
       c.case_status,
       c.priority,
       f.crime_type,
       COALESCE(e.station_id, f.station_id) AS resolved_station_id,
       s.name AS station_name,
       s.station_code,
       s.evidence_vault_location,
       CONCAT(o.first_name, ' ', o.last_name) AS logged_by_officer_name,
       o.badge_number AS logged_by_officer_badge
     FROM Evidences e
     JOIN Cases c ON e.case_id = c.id
     JOIN FIR f ON c.fir_id = f.id
     LEFT JOIN Police_Stations s ON COALESCE(e.station_id, f.station_id) = s.id
     JOIN Police_Officers o ON e.logged_by_officer_id = o.id
     WHERE e.id = ?`,
    [evidenceId]
  );

  if (!rows || rows.length === 0) {
    const error = new Error(`Evidence #${evidenceId} not found.`);
    error.statusCode = 404;
    error.code = 'ERR_EVIDENCE_NOT_FOUND';
    throw error;
  }

  const evidence = rows[0];

  // Fetch complete chain of custody timeline
  evidence.chain_of_custody = await getCustodyTimeline(evidenceId);

  // Identify current custodian
  if (evidence.chain_of_custody.length > 0) {
    const latest = evidence.chain_of_custody[evidence.chain_of_custody.length - 1];
    evidence.current_custodian = {
      officer_id: latest.transferred_to_officer_id,
      officer_name: latest.transferred_to_name,
      officer_badge: latest.transferred_to_badge,
      custody_location: latest.custody_location,
      last_transferred_at: latest.transfer_timestamp,
    };
  }

  return evidence;
}

/**
 * Service: Log new evidence with SHA-256 calculation & atomic genesis custody record
 */
export async function createEvidence({
  case_id,
  officer_id,
  description,
  evidence_type,
  storage_location,
  station_id,
  locker_bin_number,
  chain_of_custody_status = 'In Malkhana Vault',
  seizure_memo_number,
  witness_name,
  file,
}) {
  // Verify case exists and is not deleted
  const caseData = await getCaseById(case_id);
  if (caseData.case_status === 'Closed') {
    const error = new Error('Cannot log new evidence to a Closed case.');
    error.statusCode = 400;
    throw error;
  }

  const targetStationId = station_id ? Number(station_id) : (caseData.station_id || 1);
  const currentYear = new Date().getFullYear();

  let filePath = null;
  let fileHash = null;
  let fileSizeBytes = null;
  let mimeType = null;

  // Process uploaded file
  if (file) {
    filePath = `/police_storage/evidences/${file.filename}`;
    fileSizeBytes = file.size;
    mimeType = file.mimetype;

    // Cryptographic SHA-256 Calculation directly from stored bytes
    const absoluteDiskPath = path.join(env.STORAGE_PATH, 'evidences', file.filename);
    fileHash = calculateFileHash(absoluteDiskPath);
  }

  return await withTransaction(officer_id, async (connection) => {
    // 1. Generate sequential evidence number: EVD-YYYY-XXX
    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM Evidences WHERE YEAR(created_at) = ?`,
      [currentYear]
    );
    const seq = String(countRows[0].total + 1).padStart(3, '0');
    const evidenceNumber = `EVD-${currentYear}-${seq}`;
    const seizureMemo = seizure_memo_number ? seizure_memo_number.trim() : `PANCH-${currentYear}-${seq}`;

    // 2. Insert into Evidences
    const [result] = await connection.query(
      `INSERT INTO Evidences 
       (evidence_number, case_id, logged_by_officer_id, description, evidence_type, storage_location, file_path, file_hash, file_size_bytes, mime_type, station_id, locker_bin_number, chain_of_custody_status, seizure_memo_number, witness_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evidenceNumber,
        case_id,
        officer_id,
        description.trim(),
        evidence_type,
        storage_location.trim(),
        filePath,
        fileHash,
        fileSizeBytes,
        mimeType,
        targetStationId,
        locker_bin_number ? locker_bin_number.trim() : null,
        chain_of_custody_status || 'In Malkhana Vault',
        seizureMemo,
        witness_name ? witness_name.trim() : null,
      ]
    );
    const evidenceId = result.insertId;

    // 3. Genesis custody ledger entry: transferred_from is NULL
    await connection.query(
      `INSERT INTO Evidence_Chain_Of_Custody 
       (evidence_id, transferred_from_officer_id, transferred_to_officer_id, purpose, custody_location)
       VALUES (?, NULL, ?, 'Initial crime scene seizure and cataloging into Malkhana', ?)`,
      [evidenceId, officer_id, storage_location.trim()]
    );

    // 4. Record audit log
    await connection.query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'EVIDENCE_LOGGED', 'Evidences', ?, ?)`,
      [
        officer_id,
        evidenceId,
        JSON.stringify({
          evidence_number: evidenceNumber,
          case_id,
          evidence_type,
          file_hash: fileHash,
        }),
      ]
    );

    return {
      id: evidenceId,
      evidence_number: evidenceNumber,
      case_id,
      file_hash: fileHash,
      storage_location,
    };
  });
}

/**
 * Service: Transfer custody of evidence to another officer
 */
export async function transferCustody(
  evidenceId,
  { transferred_to_officer_id, purpose, custody_location },
  currentUser
) {
  const evidence = await getEvidenceById(evidenceId);

  // Recipient validation
  const recipient = await getOfficerById(transferred_to_officer_id);
  if (recipient.is_deleted) {
    const error = new Error('Receiving officer account is deactivated.');
    error.statusCode = 400;
    throw error;
  }

  // Determine current custodian
  const currentCustodianId = evidence.current_custodian?.officer_id || evidence.logged_by_officer_id;

  // Authorization: must be current custodian or privileged role
  const isCurrentCustodian = currentUser.id === currentCustodianId;
  const isPrivileged = ['Evidence-Manager', 'Head-Officer', 'System-Admin'].includes(currentUser.role);

  if (!isCurrentCustodian && !isPrivileged) {
    const error = new Error(
      `Custody Transfer Denied: You are not the current custodian of this evidence item (Current custodian: Officer #${currentCustodianId}).`
    );
    error.statusCode = 403;
    error.code = 'ERR_NOT_CUSTODIAN';
    throw error;
  }

  return await withTransaction(currentUser.id, async (connection) => {
    // 1. Insert new entry in Evidence_Chain_Of_Custody
    const [result] = await connection.query(
      `INSERT INTO Evidence_Chain_Of_Custody 
       (evidence_id, transferred_from_officer_id, transferred_to_officer_id, purpose, custody_location)
       VALUES (?, ?, ?, ?, ?)`,
      [
        evidenceId,
        currentCustodianId,
        transferred_to_officer_id,
        purpose.trim(),
        custody_location.trim(),
      ]
    );

    // 2. Update current storage location on Evidences
    await connection.query(
      `UPDATE Evidences SET storage_location = ? WHERE id = ?`,
      [custody_location.trim(), evidenceId]
    );

    // 3. Audit log
    await connection.query(
      `INSERT INTO Audit_Logs (officer_id, action, target_table, record_id, details)
       VALUES (?, 'CUSTODY_TRANSFER', 'Evidence_Chain_Of_Custody', ?, ?)`,
      [
        currentUser.id,
        result.insertId,
        JSON.stringify({
          evidence_id: evidenceId,
          from_officer: currentCustodianId,
          to_officer: transferred_to_officer_id,
          purpose,
          location: custody_location,
        }),
      ]
    );

    return {
      transferId: result.insertId,
      evidenceId,
      transferredFrom: currentCustodianId,
      transferredTo: transferred_to_officer_id,
      newLocation: custody_location,
      status: 'TRANSFER_RECORDED',
    };
  });
}

/**
 * Service: Fetch complete chronological custody timeline
 */
export async function getCustodyTimeline(evidenceId) {
  return await query(
    `SELECT 
       ecc.id,
       ecc.evidence_id,
       ecc.transferred_from_officer_id,
       ecc.transferred_to_officer_id,
       ecc.transfer_timestamp,
       ecc.purpose,
       ecc.custody_location,
       ecc.created_at,
       CONCAT(o1.first_name, ' ', o1.last_name) AS transferred_from_name,
       o1.badge_number AS transferred_from_badge,
       CONCAT(o2.first_name, ' ', o2.last_name) AS transferred_to_name,
       o2.badge_number AS transferred_to_badge
     FROM Evidence_Chain_Of_Custody ecc
     LEFT JOIN Police_Officers o1 ON ecc.transferred_from_officer_id = o1.id
     JOIN Police_Officers o2 ON ecc.transferred_to_officer_id = o2.id
     WHERE ecc.evidence_id = ?
     ORDER BY ecc.transfer_timestamp ASC, ecc.id ASC`,
    [evidenceId]
  );
}

/**
 * Service: Re-hash actual disk bytes and verify cryptographic integrity
 */
export async function verifyEvidenceIntegrity(evidenceId) {
  const evidence = await getEvidenceById(evidenceId);

  if (!evidence.file_path) {
    return {
      evidenceId,
      evidenceNumber: evidence.evidence_number,
      hasDigitalFile: false,
      status: 'PHYSICAL_ITEM_NO_DIGITAL_ASSET',
      message: 'This evidence item does not have an attached digital file on disk.',
    };
  }

  // Resolve absolute disk path
  const normalizedRelative = evidence.file_path.replace(/^\/police_storage\//, '');
  const absoluteDiskPath = path.join(env.STORAGE_PATH, normalizedRelative);

  if (!fs.existsSync(absoluteDiskPath)) {
    return {
      evidenceId,
      evidenceNumber: evidence.evidence_number,
      hasDigitalFile: true,
      fileMissing: true,
      originalHash: evidence.file_hash,
      status: 'FILE_NOT_FOUND_ON_DISK',
      message: 'ALERT: The physical evidence file is missing from local disk storage!',
    };
  }

  // Calculate live SHA-256 hash of actual file on disk
  const liveHash = calculateFileHash(absoluteDiskPath);
  const isMatch = liveHash.toLowerCase() === (evidence.file_hash || '').toLowerCase();
  const fileStats = fs.statSync(absoluteDiskPath);

  return {
    evidenceId,
    evidenceNumber: evidence.evidence_number,
    hasDigitalFile: true,
    fileMissing: false,
    algorithm: 'SHA-256',
    originalHash: evidence.file_hash,
    liveHash,
    match: isMatch,
    fileSizeBytes: fileStats.size,
    status: isMatch ? 'SECURE_AND_TAMPER_FREE' : 'TAMPER_DETECTED',
    verifiedAt: new Date().toISOString(),
    message: isMatch
      ? 'Cryptographic integrity verified: Stored file matches database SHA-256 hash perfectly.'
      : 'INTEGRITY ALERT: Stored file hash does not match original database digest! File may have been altered or replaced.',
  };
}

/**
 * Service: Soft delete evidence with closed case protection
 */
export async function deleteEvidence(evidenceId) {
  const evidence = await getEvidenceById(evidenceId);

  // Explicit check for closed case protection (matches DB trigger trg_prevent_evidence_delete)
  if (evidence.case_status === 'Closed') {
    const error = new Error('Integrity Violation: Cannot delete evidence associated with a closed case.');
    error.statusCode = 400;
    error.code = 'ERR_CLOSED_CASE_EVIDENCE_DELETE';
    throw error;
  }

  await query(`UPDATE Evidences SET is_deleted = TRUE WHERE id = ?`, [evidenceId]);
  return { id: evidenceId, is_deleted: true };
}

/**
 * Service: Generate structured QR barcode data
 */
export async function getEvidenceQRData(evidenceId) {
  const evidence = await getEvidenceById(evidenceId);

  const qrData = {
    phdms_type: 'EVIDENCE_IDENTIFIER',
    evidence_id: evidence.id,
    evidence_number: evidence.evidence_number,
    case_id: evidence.case_id,
    case_number: evidence.case_number,
    evidence_type: evidence.evidence_type,
    storage_location: evidence.storage_location,
    file_hash_prefix: evidence.file_hash ? evidence.file_hash.slice(0, 16) : null,
    custodian_badge: evidence.current_custodian?.officer_badge || evidence.logged_by_officer_badge,
  };

  return {
    evidenceId: evidence.id,
    evidenceNumber: evidence.evidence_number,
    qrPayload: JSON.stringify(qrData),
    details: qrData,
  };
}

/**
 * Service: Quick lookup by scanned QR payload or identifier string
 */
export async function lookupByQR(scannedInput) {
  if (!scannedInput || typeof scannedInput !== 'string') {
    throw new Error('Valid scanned QR input string is required.');
  }

  let searchId = null;
  let searchNumber = null;

  // Try JSON parse if camera scanner passes full QR JSON payload
  try {
    const parsed = JSON.parse(scannedInput);
    if (typeof parsed === 'object' && parsed !== null) {
      if (parsed.evidence_id) searchId = parsed.evidence_id;
      if (parsed.evidence_number) searchNumber = parsed.evidence_number;
    }
  } catch (_) {
    // Handled below if searchId/searchNumber not set
  }

  if (!searchId && !searchNumber) {
    if (/^\d+$/.test(scannedInput.trim())) {
      searchId = parseInt(scannedInput.trim(), 10);
    } else {
      searchNumber = scannedInput.trim();
    }
  }

  let rows = [];
  if (searchId) {
    rows = await query(`SELECT id FROM Evidences WHERE id = ? AND is_deleted = FALSE`, [searchId]);
  } else if (searchNumber) {
    rows = await query(`SELECT id FROM Evidences WHERE evidence_number = ? AND is_deleted = FALSE`, [searchNumber]);
  }

  if (!rows || rows.length === 0) {
    const error = new Error(`No active evidence found matching scanned QR code '${scannedInput}'.`);
    error.statusCode = 404;
    error.code = 'ERR_QR_LOOKUP_NOT_FOUND';
    throw error;
  }

  return await getEvidenceById(rows[0].id);
}
