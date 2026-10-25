import * as caseService from '../services/caseService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export async function getAllCases(req, res, next) {
  try {
    const { status, station_id, priority, assigned_officer_id, search } = req.query;
    const cases = await caseService.getAllCases({
      status,
      stationId: station_id ? parseInt(station_id, 10) : null,
      priority,
      assignedOfficerId: assigned_officer_id ? parseInt(assigned_officer_id, 10) : null,
      search,
      userRole: req.user.role,
      userStationId: req.user.station_id,
    });
    return successResponse(res, cases, 'Cases retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getCaseById(req, res, next) {
  try {
    const caseData = await caseService.getCaseById(req.params.id, req.user.role);
    return successResponse(res, caseData, 'Case dossier retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function updateCaseStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status) {
      return errorResponse(res, 'New status is required.', 400);
    }
    const updated = await caseService.updateCaseStatus(req.params.id, status, req.user.id);
    return successResponse(res, updated, `Case status transitioned to '${status}' successfully`);
  } catch (err) {
    next(err);
  }
}

export async function assignInvestigator(req, res, next) {
  try {
    const { assigned_officer_id } = req.body;
    if (!assigned_officer_id) {
      return errorResponse(res, 'assigned_officer_id is required.', 400);
    }
    const updated = await caseService.assignInvestigator(req.params.id, parseInt(assigned_officer_id, 10), req.user);
    return successResponse(res, updated, 'Investigator assigned to case successfully');
  } catch (err) {
    next(err);
  }
}
