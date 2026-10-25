import { Router } from 'express';
import { getAllFIRs, getFIRById, createFIR, updateFIR, deleteFIR } from '../controllers/firController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';
import { enforceStationJurisdiction } from '../middleware/abacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllFIRs);
router.get('/:id', getFIRById);

// Register new FIR (ABAC: Officer must match FIR station)
router.post(
  '/',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  enforceStationJurisdiction('station_id', { allowGlobalHead: true }),
  createFIR
);

router.put(
  '/:id',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  updateFIR
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  deleteFIR
);

export default router;
