import * as auditService from '../services/auditService.js';
import { successResponse } from '../utils/responseHelper.js';

export async function getAllAuditLogs(req, res, next) {
  try {
    const { officer_id, action, target_table, limit, offset } = req.query;

    // Regular officers can only inspect their own actions; Head & Admin can view all
    let targetOfficerId = officer_id ? parseInt(officer_id, 10) : null;
    if (req.user.role === 'Officer' || req.user.role === 'Evidence-Manager') {
      targetOfficerId = req.user.id;
    }

    const logs = await auditService.getAllAuditLogs({
      officerId: targetOfficerId,
      action,
      targetTable: target_table,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return successResponse(res, logs, 'Audit trail logs retrieved successfully');
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogById(req, res, next) {
  try {
    const log = await auditService.getAuditLogById(req.params.id);
    return successResponse(res, log, 'Audit log entry retrieved successfully');
  } catch (err) {
    next(err);
  }
}
