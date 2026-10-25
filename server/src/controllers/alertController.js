import * as alertService from '../services/alertService.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export async function getAllAlerts(req, res, next) {
  try {
    const { severity, unread_only, limit } = req.query;
    const alerts = await alertService.getAllAlerts(req.user.id, {
      severity,
      unreadOnly: unread_only === 'true',
      limit: limit ? parseInt(limit, 10) : 50,
    });
    return successResponse(res, alerts, 'Priority alerts retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function createBOLO(req, res, next) {
  try {
    const { message, severity, case_id } = req.body;
    if (!message) {
      return errorResponse(res, 'Alert message is required.', 400);
    }
    const io = req.app.get('io');
    const alert = await alertService.createBOLOAlert(
      { message, severity: severity || 'High', case_id: case_id ? parseInt(case_id, 10) : null },
      req.user,
      io
    );
    return successResponse(res, alert, 'Priority BOLO alert issued and broadcast successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function markAlertRead(req, res, next) {
  try {
    const result = await alertService.markAlertAsRead(parseInt(req.params.id, 10), req.user.id);
    return successResponse(res, result, 'Alert marked as read');
  } catch (err) {
    next(err);
  }
}

export async function markAllAlertsRead(req, res, next) {
  try {
    const result = await alertService.markAllAlertsAsRead(req.user.id);
    return successResponse(res, result, `Marked ${result.markedCount} alerts as read`);
  } catch (err) {
    next(err);
  }
}

export async function triggerPendingCaseCheck(req, res, next) {
  try {
    const result = await alertService.checkAndGenerate90DayPendingAlerts();
    return successResponse(res, result, '90-day cold case audit completed');
  } catch (err) {
    next(err);
  }
}
