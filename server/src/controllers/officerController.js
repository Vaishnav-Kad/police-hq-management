import * as officerService from '../services/officerService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';
import { broadcastSync } from '../utils/socketNotifier.js';

export async function getAllOfficers(req, res, next) {
  try {
    const { station_id, role, search, include_deleted } = req.query;
    const officers = await officerService.getAllOfficers({
      stationId: station_id ? parseInt(station_id, 10) : null,
      role,
      search,
      includeDeleted: include_deleted === 'true',
      requestingUser: req.user,
    });
    return successResponse(res, officers, 'Officers retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getOfficerById(req, res, next) {
  try {
    const officer = await officerService.getOfficerById(req.params.id, req.user);
    return successResponse(res, officer, 'Officer profile retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createOfficer(req, res, next) {
  try {
    const {
      badge_number,
      first_name,
      last_name,
      rank_title,
      role,
      station_id,
      password,
      email,
      phone,
      blood_group,
      joining_date,
      emergency_contact,
      id_proof_number,
    } = req.body;
    if (!badge_number || !first_name || !last_name || !rank_title || !role || !station_id) {
      return errorResponse(res, 'Badge number, first name, last name, rank, role, and station are required.', 400);
    }
    const officer = await officerService.createOfficer({
      badge_number,
      first_name,
      last_name,
      rank_title,
      role,
      station_id: parseInt(station_id, 10),
      password,
      email,
      phone,
      blood_group,
      joining_date,
      emergency_contact,
      id_proof_number,
      createdByOfficerId: req.user?.id || null,
      requestingUser: req.user,
    });
    broadcastSync(req, { entity: 'officers', action: 'CREATE', data: officer });
    return successResponse(res, officer, 'Officer registered successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateOfficer(req, res, next) {
  try {
    const {
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
    } = req.body;
    const officer = await officerService.updateOfficer(
      req.params.id,
      {
        first_name,
        last_name,
        rank_title,
        role,
        station_id: station_id ? parseInt(station_id, 10) : undefined,
        email,
        phone,
        password,
        blood_group,
        joining_date,
        emergency_contact,
        id_proof_number,
      },
      req.user
    );
    broadcastSync(req, { entity: 'officers', action: 'UPDATE', data: officer });
    return successResponse(res, officer, 'Officer profile updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteOfficer(req, res, next) {
  try {
    const result = await officerService.deleteOfficer(req.params.id, req.user);
    broadcastSync(req, { entity: 'officers', action: 'DELETE', data: { id: req.params.id } });
    return successResponse(res, result, 'Officer account decommissioned successfully');
  } catch (err) {
    next(err);
  }
}
