import { Router } from 'express';
import {
  getAllCriminals,
  getCriminalById,
  createCriminal,
  updateCriminal,
  uploadMugshot,
  deleteCriminal,
} from '../controllers/criminalController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';
import { uploadMugshotMiddleware } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Gallery & Full-text search
router.get('/', getAllCriminals);
router.get('/:id', getCriminalById);

// Create, Update, Delete
router.post(
  '/',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  createCriminal
);

router.put(
  '/:id',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  updateCriminal
);

router.post(
  '/:id/mugshot',
  authorizeRoles(ROLES.OFFICER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  uploadMugshotMiddleware.single('mugshot'),
  uploadMugshot
);

router.delete(
  '/:id',
  authorizeRoles(ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  deleteCriminal
);

export default router;
