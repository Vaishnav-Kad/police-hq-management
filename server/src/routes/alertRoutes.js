import { Router } from 'express';
import {
  getAllAlerts,
  createBOLO,
  markAlertRead,
  markAllAlertsRead,
  triggerPendingCaseCheck,
} from '../controllers/alertController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllAlerts);

// Issue BOLO Broadcast (Head-Officer & System-Admin only)
router.post(
  '/bolo',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  createBOLO
);

// Read tracking
router.patch('/read-all', markAllAlertsRead);
router.patch('/:id/read', markAlertRead);

// Manual trigger for 90-day cold case audit check (Admin & Head)
router.post(
  '/check-pending',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  triggerPendingCaseCheck
);

export default router;
