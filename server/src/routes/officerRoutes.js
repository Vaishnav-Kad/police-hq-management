import { Router } from 'express';
import { getAllOfficers, getOfficerById, createOfficer, updateOfficer, deleteOfficer } from '../controllers/officerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllOfficers);
router.get('/:id', getOfficerById);

// Officer administrative routes
router.post('/', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.HEAD_OFFICER, ROLES.OFFICER), createOfficer);
router.put('/:id', authorizeRoles(ROLES.SYSTEM_ADMIN, ROLES.HEAD_OFFICER), updateOfficer);
router.delete('/:id', authorizeRoles(ROLES.SYSTEM_ADMIN), deleteOfficer);

export default router;
