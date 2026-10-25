import { errorResponse } from '../utils/responseHelper.js';
import { ROLES } from './rbacMiddleware.js';

/**
 * Middleware: Enforce Station Precinct Jurisdictional Boundaries (ABAC)
 * 
 * Rules:
 * - System-Admin has unrestricted cross-precinct authority.
 * - Head-Officer has authority over their assigned precinct (or global oversight if allowed).
 * - Officers and Evidence-Managers are strictly bound to their assigned precinct.
 * 
 * @param {Function|string} getTargetStationId - Function (req) => stationId, or property name on req.body / req.params
 * @param {Object} options - { allowGlobalHead: false }
 */
export function enforceStationJurisdiction(getTargetStationId, options = { allowGlobalHead: false }) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before verifying jurisdiction.', 401, null, 'ERR_UNAUTHORIZED');
    }

    // System Administrators hold unrestricted jurisdiction across all stations
    if (req.user.role === ROLES.SYSTEM_ADMIN) {
      return next();
    }

    let targetStationId;
    if (typeof getTargetStationId === 'function') {
      targetStationId = getTargetStationId(req);
    } else if (typeof getTargetStationId === 'string') {
      targetStationId = req.params?.[getTargetStationId] ?? req.body?.[getTargetStationId] ?? req.query?.[getTargetStationId];
    } else {
      targetStationId = req.body?.station_id ?? req.params?.stationId ?? req.query?.station_id;
    }

    // If targetStationId cannot be resolved or is not applicable, let downstream handle or proceed
    if (targetStationId === undefined || targetStationId === null) {
      return next();
    }

    const userStationId = Number(req.user.station_id);
    const parsedTargetStationId = Number(targetStationId);

    // If options allow Head-Officer cross-station oversight
    if (options.allowGlobalHead && req.user.role === ROLES.HEAD_OFFICER) {
      return next();
    }

    if (userStationId !== parsedTargetStationId) {
      return errorResponse(
        res,
        `Jurisdictional Access Denied: You are stationed at Precinct #${userStationId}, and cannot modify resources at Precinct #${parsedTargetStationId}.`,
        403,
        { assignedStationId: userStationId, targetStationId: parsedTargetStationId },
        'ERR_JURISDICTION_DENIED'
      );
    }

    next();
  };
}
