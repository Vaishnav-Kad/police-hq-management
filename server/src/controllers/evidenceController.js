import fs from 'fs';
import path from 'path';
import * as evidenceService from '../services/evidenceService.js';
import { env } from '../config/env.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export async function getAllEvidences(req, res, next) {
  try {
    const { case_id, evidence_type, storage_location, search, station_id } = req.query;
    const evidences = await evidenceService.getAllEvidences({
      caseId: case_id ? parseInt(case_id, 10) : null,
      evidenceType: evidence_type,
      storageLocation: storage_location,
      search,
      stationId: station_id ? parseInt(station_id, 10) : null,
      userRole: req.user?.role,
      userStationId: req.user?.station_id,
    });
    return successResponse(res, evidences, 'Evidence items retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getEvidenceById(req, res, next) {
  try {
    const evidence = await evidenceService.getEvidenceById(req.params.id);
    return successResponse(res, evidence, 'Evidence details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function createEvidence(req, res, next) {
  try {
    const {
      case_id,
      description,
      evidence_type,
      storage_location,
      station_id,
      locker_bin_number,
      chain_of_custody_status,
      seizure_memo_number,
      witness_name,
    } = req.body;
    if (!case_id || !description || !evidence_type || !storage_location) {
      return errorResponse(res, 'case_id, description, evidence_type, and storage_location are required.', 400);
    }

    const result = await evidenceService.createEvidence({
      case_id: parseInt(case_id, 10),
      officer_id: req.user.id,
      description,
      evidence_type,
      storage_location,
      station_id: station_id ? parseInt(station_id, 10) : req.user.station_id,
      locker_bin_number,
      chain_of_custody_status,
      seizure_memo_number,
      witness_name,
      file: req.file,
    });

    return successResponse(res, result, 'Evidence item cataloged and initial custody logged successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function transferCustody(req, res, next) {
  try {
    const { transferred_to_officer_id, purpose, custody_location } = req.body;
    if (!transferred_to_officer_id || !purpose || !custody_location) {
      return errorResponse(res, 'transferred_to_officer_id, purpose, and custody_location are required.', 400);
    }

    const result = await evidenceService.transferCustody(
      req.params.id,
      {
        transferred_to_officer_id: parseInt(transferred_to_officer_id, 10),
        purpose,
        custody_location,
      },
      req.user
    );

    return successResponse(res, result, 'Chain of custody transfer successfully recorded');
  } catch (err) {
    next(err);
  }
}

export async function verifyEvidenceIntegrity(req, res, next) {
  try {
    const report = await evidenceService.verifyEvidenceIntegrity(req.params.id);
    return successResponse(res, report, 'Evidence integrity verification completed');
  } catch (err) {
    next(err);
  }
}

export async function downloadEvidenceFile(req, res, next) {
  try {
    const evidence = await evidenceService.getEvidenceById(req.params.id);

    if (!evidence.file_path) {
      return errorResponse(res, 'No physical file attached to this evidence item.', 404);
    }

    // Path traversal safety
    const normalizedRelative = evidence.file_path.replace(/^\/police_storage\//, '');
    const absoluteDiskPath = path.join(env.STORAGE_PATH, normalizedRelative);

    if (!fs.existsSync(absoluteDiskPath)) {
      return errorResponse(res, 'Evidence file not found on storage disk.', 404);
    }

    const fileName = path.basename(absoluteDiskPath);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    if (evidence.mime_type) {
      res.setHeader('Content-Type', evidence.mime_type);
    }

    const readStream = fs.createReadStream(absoluteDiskPath);
    readStream.pipe(res);
  } catch (err) {
    next(err);
  }
}

export async function deleteEvidence(req, res, next) {
  try {
    const result = await evidenceService.deleteEvidence(req.params.id);
    return successResponse(res, result, 'Evidence item deactivated successfully');
  } catch (err) {
    next(err);
  }
}

export async function getEvidenceQR(req, res, next) {
  try {
    const qrData = await evidenceService.getEvidenceQRData(req.params.id);
    return successResponse(res, qrData, 'QR barcode data generated successfully');
  } catch (err) {
    next(err);
  }
}

export async function lookupByQR(req, res, next) {
  try {
    const { code } = req.query;
    if (!code) {
      return errorResponse(res, 'Scanned code parameter is required.', 400);
    }
    const evidence = await evidenceService.lookupByQR(code);
    return successResponse(res, evidence, 'Evidence matched via QR code');
  } catch (err) {
    next(err);
  }
}
