import { Router } from 'express';
import {
  getAllCases,
  getCaseById,
  updateCaseStatus,
  assignInvestigator,
} from '../controllers/caseController.js';
import {
  linkCriminalToCase,
  unlinkCriminalFromCase,
} from '../controllers/criminalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllCases);
router.get('/:id', getCaseById);

// Update status (e.g. Kanban drag-and-drop or status dropdown)
router.patch(
  '/:id/status',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  updateCaseStatus
);

// Assign lead investigator to case
router.put(
  '/:id/assign',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  assignInvestigator
);

// Link criminal to case (Junction)
router.post(
  '/:id/criminals',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  linkCriminalToCase
);

// Unlink criminal from case (Junction)
router.delete(
  '/:id/criminals/:criminalId',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  unlinkCriminalFromCase
);

export default router;
