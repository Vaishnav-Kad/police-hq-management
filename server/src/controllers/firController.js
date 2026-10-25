import * as firService from '../services/firService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export async function getAllFIRs(req, res, next) {
  try {
    const { station_id, status, crime_type, search } = req.query;
    const firs = await firService.getAllFIRs({
      stationId: station_id ? parseInt(station_id, 10) : null,
      status,
      crimeType: crime_type,
      search,
      userRole: req.user.role,
      userStationId: req.user.station_id,
    });
    return successResponse(res, firs, 'First Information Reports retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getFIRById(req, res, next) {
  try {
    const fir = await firService.getFIRById(req.params.id);
    return successResponse(res, fir, 'FIR details retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function createFIR(req, res, next) {
  try {
    const {
      station_id,
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
    } = req.body;

    if (!incident_date || !crime_type || !description) {
      return errorResponse(res, 'Incident date, crime type, and description are required.', 400);
    }

    // Default station_id to officer's own station if omitted
    const assignedStationId = station_id ? parseInt(station_id, 10) : req.user.station_id;

    const result = await firService.createFIR({
      station_id: assignedStationId,
      filed_by_officer_id: req.user.id,
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
    });

    const fullFIR = await firService.getFIRById(result.firId);

    // Notify connected socket rooms if available
    const io = req.app.get('io');
    if (io) {
      io.emit('new_fir', fullFIR);
    }

    return successResponse(res, fullFIR, 'FIR registered and investigative Case created successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateFIR(req, res, next) {
  try {
    const { crime_type, description, status, latitude, longitude } = req.body;
    const updated = await firService.updateFIR(req.params.id, {
      crime_type,
      description,
      status,
      latitude,
      longitude,
    });
    return successResponse(res, updated, 'FIR updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteFIR(req, res, next) {
  try {
    const result = await firService.deleteFIR(req.params.id);
    return successResponse(res, result, 'FIR removed successfully');
  } catch (err) {
    next(err);
  }
}
