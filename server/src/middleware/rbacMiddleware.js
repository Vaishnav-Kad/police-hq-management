import { errorResponse } from '../utils/responseHelper.js';

/**
 * Standard Role Hierarchy & Constant Definitions
 */
export const ROLES = {
  OFFICER: 'Officer',
  EVIDENCE_MANAGER: 'Evidence-Manager',
  HEAD_OFFICER: 'Head-Officer',
  SYSTEM_ADMIN: 'System-Admin',
};

/**
 * Middleware: Authorize specific roles
 * @param  {...string} allowedRoles - Allowed roles
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking permissions.', 401, null, 'ERR_UNAUTHORIZED');
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access forbidden. Requires one of [${allowedRoles.join(', ')}], but your role is '${req.user.role}'.`,
        403,
        { requiredRoles: allowedRoles, currentRole: req.user.role },
        'ERR_FORBIDDEN_ROLE'
      );
    }

    next();
  };
}
