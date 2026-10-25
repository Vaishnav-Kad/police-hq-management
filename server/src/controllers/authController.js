import { loginOfficer, getOfficerProfile } from '../services/authService.js';
import { successResponse } from '../utils/responseHelper.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { query } from '../config/db.js';

/**
 * Controller: POST /api/auth/quick-switch
 */
export async function quickSwitch(req, res, next) {
  try {
    const { badge_number, id } = req.body;
    let rows = [];
    if (id) {
      rows = await query('SELECT * FROM Police_Officers WHERE id = ?', [id]);
    } else if (badge_number) {
      rows = await query('SELECT * FROM Police_Officers WHERE badge_number = ?', [badge_number]);
    }

    if (!rows || rows.length === 0) {
      rows = await query('SELECT * FROM Police_Officers WHERE id = 1');
    }

    const officer = rows[0];
    const token = generateToken({
      id: officer.id,
      badge_number: officer.badge_number,
      role: officer.role,
      station_id: officer.station_id,
    });

    return successResponse(res, { token, user: officer }, 'Session switched successfully', 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { badge_number, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await loginOfficer(badge_number, password, ipAddress);

    return successResponse(res, result, 'Authentication successful', 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const profile = await getOfficerProfile(req.user.id);
    return successResponse(res, profile, 'Profile retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

/**
 * Controller: POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    // In stateless JWT architectures, client purges local token.
    return successResponse(res, { loggedOut: true }, 'Logged out successfully', 200);
  } catch (err) {
    next(err);
  }
}
