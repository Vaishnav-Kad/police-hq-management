import { Router } from 'express';
import {
  getAllWitnesses,
  getWitnessById,
  createWitness,
  updateWitness,
  deleteWitness,
} from '../controllers/legalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllWitnesses);
router.get('/:id', getWitnessById);

router.post(
  '/',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  createWitness
);

router.put(
  '/:id',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  updateWitness
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  deleteWitness
);

export default router;
