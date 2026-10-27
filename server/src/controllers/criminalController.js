import * as criminalService from '../services/criminalService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { broadcastSync } from '../utils/socketNotifier.js';

export async function getAllCriminals(req, res, next) {
  try {
    const { search, gender, include_deleted, station_id } = req.query;
    const criminals = await criminalService.getAllCriminals({
      search,
      gender,
      includeDeleted: include_deleted === 'true',
      stationId: station_id ? parseInt(station_id, 10) : null,
      userRole: req.user?.role,
      userStationId: req.user?.station_id,
    });
    return successResponse(res, criminals, 'Criminal records retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getCriminalById(req, res, next) {
  try {
    const criminal = await criminalService.getCriminalById(req.params.id);
    return successResponse(res, criminal, 'Criminal dossier retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function createCriminal(req, res, next) {
  try {
    const {
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
    } = req.body;
    if (!first_name || !last_name) {
      return errorResponse(res, 'First name and last name are required.', 400);
    }
    const criminal = await criminalService.createCriminal({
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
    });
    broadcastSync(req, { entity: 'criminals', action: 'CREATE', data: criminal });
    return successResponse(res, criminal, 'Criminal record created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCriminal(req, res, next) {
  try {
    const updated = await criminalService.updateCriminal(req.params.id, req.body);
    broadcastSync(req, { entity: 'criminals', action: 'UPDATE', data: updated });
    return successResponse(res, updated, 'Criminal record updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function uploadMugshot(req, res, next) {
  try {
    if (!req.file) {
      return errorResponse(res, 'No mugshot file provided in request.', 400);
    }
    // Relative path for static serving
    const relativePath = `/police_storage/mugshots/${req.file.filename}`;
    const updated = await criminalService.updateMugshot(req.params.id, relativePath);
    broadcastSync(req, { entity: 'criminals', action: 'UPDATE', data: updated });
    return successResponse(res, updated, 'Mugshot uploaded and updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteCriminal(req, res, next) {
  try {
    const result = await criminalService.deleteCriminal(req.params.id, req.user);
    broadcastSync(req, { entity: 'criminals', action: 'DELETE', data: { id: req.params.id } });
    return successResponse(res, result, 'Criminal record deactivated successfully');
  } catch (err) {
    next(err);
  }
}

export async function linkCriminalToCase(req, res, next) {
  try {
    const { criminal_id, involvement_type, notes } = req.body;
    const caseId = req.params.id;
    if (!criminal_id) {
      return errorResponse(res, 'criminal_id is required.', 400);
    }
    const result = await criminalService.linkCriminalToCase(caseId, criminal_id, involvement_type, notes);
    return successResponse(res, result, 'Criminal linked to case successfully');
  } catch (err) {
    next(err);
  }
}

export async function unlinkCriminalFromCase(req, res, next) {
  try {
    const { id: caseId, criminalId } = req.params;
    const result = await criminalService.unlinkCriminalFromCase(caseId, criminalId);
    return successResponse(res, result, 'Criminal unlinked from case successfully');
  } catch (err) {
    next(err);
  }
}
