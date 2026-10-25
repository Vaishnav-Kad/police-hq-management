import * as stationService from '../services/stationService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export async function getAllStations(req, res, next) {
  try {
    const includeDeleted = req.query.include_deleted === 'true';
    const stations = await stationService.getAllStations(includeDeleted);
    return successResponse(res, stations, 'Police stations retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getStationById(req, res, next) {
  try {
    const station = await stationService.getStationById(req.params.id);
    return successResponse(res, station, 'Station details retrieved');
  } catch (err) {
    next(err);
  }
}

export async function createStation(req, res, next) {
  try {
    const {
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
    } = req.body;
    if (!name || !location || !contact_details) {
      return errorResponse(res, 'Name, location, and contact_details are required fields.', 400);
    }
    const station = await stationService.createStation({
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
    });
    return successResponse(res, station, 'Police station created successfully with lockup and evidence vault provisioning', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateStation(req, res, next) {
  try {
    const station = await stationService.updateStation(req.params.id, req.body);
    return successResponse(res, station, 'Police station updated successfully');
  } catch (err) {
    next(err);
  }
}

export async function deleteStation(req, res, next) {
  try {
    const result = await stationService.deleteStation(req.params.id);
    return successResponse(res, result, 'Police station deactivated successfully');
  } catch (err) {
    next(err);
  }
}
