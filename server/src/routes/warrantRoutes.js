import { Router } from 'express';
import {
  getAllWarrants,
  getWarrantById,
  createWarrant,
  updateWarrantStatus,
  deleteWarrant,
} from '../controllers/legalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllWarrants);
router.get('/:id', getWarrantById);

router.post(
  '/',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  createWarrant
);

router.patch(
  '/:id/status',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  updateWarrantStatus
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  deleteWarrant
);

export default router;
