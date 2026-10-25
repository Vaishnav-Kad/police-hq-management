import { Router } from 'express';
import {
  getAllEvidences,
  getEvidenceById,
  createEvidence,
  transferCustody,
  verifyEvidenceIntegrity,
  downloadEvidenceFile,
  deleteEvidence,
  getEvidenceQR,
  lookupByQR,
} from '../controllers/evidenceController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authorizeRoles, ROLES } from '../middleware/rbacMiddleware.js';
import { uploadEvidenceMiddleware } from '../middleware/uploadMiddleware.js';

const router = Router();

router.use(authenticateToken);

// QR lookup for scanner (must be before :id route)
router.get('/lookup/qr', lookupByQR);

// Evidence listing and detail
router.get('/', getAllEvidences);
router.get('/:id', getEvidenceById);
router.get('/:id/qr', getEvidenceQR);
router.get('/:id/download', downloadEvidenceFile);

// Log new evidence item (with optional file upload)
router.post(
  '/',
  authorizeRoles(ROLES.OFFICER, ROLES.EVIDENCE_MANAGER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  uploadEvidenceMiddleware.single('file'),
  createEvidence
);

// Custody Transfer
router.post(
  '/:id/transfer',
  authorizeRoles(ROLES.OFFICER, ROLES.EVIDENCE_MANAGER, ROLES.HEAD_OFFICER, ROLES.SYSTEM_ADMIN),
  transferCustody
);

// Integrity Verification (SHA-256 check)
router.post('/:id/verify', verifyEvidenceIntegrity);

// Deactivate Evidence (Evidence-Manager & System-Admin only, blocked on Closed cases)
router.delete(
  '/:id',
  authorizeRoles(ROLES.EVIDENCE_MANAGER, ROLES.SYSTEM_ADMIN),
  deleteEvidence
);

export default router;
