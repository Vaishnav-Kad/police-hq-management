import { Router } from 'express';
import { login, getMe, logout, quickSwitch } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateLoginInput } from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public Routes
router.post('/login', authLimiter, validateLoginInput, login);
router.post('/quick-switch', quickSwitch);

// Protected Routes
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

export default router;
