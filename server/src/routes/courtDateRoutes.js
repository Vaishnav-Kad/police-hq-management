import { Router } from 'express';
import {
  getAllCourtDates,
  getCourtDateById,
  createCourtDate,
  updateCourtDate,
  deleteCourtDate,
} from '../controllers/legalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllCourtDates);
router.get('/:id', getCourtDateById);

router.post(
  '/',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  createCourtDate
);

router.put(
  '/:id',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  updateCourtDate
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  deleteCourtDate
);

export default router;
