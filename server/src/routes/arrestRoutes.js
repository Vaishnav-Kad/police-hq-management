import { Router } from 'express';
import {
  getAllArrests,
  getArrestById,
  createArrest,
  updateBailStatus,
  deleteArrest,
} from '../controllers/legalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllArrests);
router.get('/:id', getArrestById);

router.post(
  '/',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  createArrest
);

router.patch(
  '/:id/bail',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  updateBailStatus
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.SYSTEM_ADMIN),
  deleteArrest
);

export default router;
