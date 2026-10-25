import { Router } from 'express';
import { getAllStations, getStationById, createStation, updateStation, deleteStation } from '../controllers/stationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getAllStations);
router.get('/:id', getStationById);

// Admin-only management routes
router.post('/', authorizeRoles(ROLES.SYSTEM_ADMIN), createStation);
router.put('/:id', authorizeRoles(ROLES.SYSTEM_ADMIN), updateStation);
router.delete('/:id', authorizeRoles(ROLES.SYSTEM_ADMIN), deleteStation);

export default router;
