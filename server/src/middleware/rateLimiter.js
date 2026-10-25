import rateLimit from 'express-rate-limit';
import { errorResponse } from '../utils/responseHelper.js';

/**
 * Rate Limiter for Login Endpoint
 * Prevents automated password brute-force attempts
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 failed login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      'Too many failed login attempts from this connection. Please try again after 15 minutes.',
      429,
      { retryAfterMinutes: 15 },
      'ERR_RATE_LIMIT_EXCEEDED'
    );
  },
});
