import { Router } from 'express';
import { getAllAuditLogs, getAuditLogById } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getRecentSqlQueries } from '../config/db.js';

const router = Router();

router.use(authenticateToken);

// Real-time SQL query execution logs
router.get('/sql-queries', (req, res) => {
  const queries = getRecentSqlQueries();
  res.json({ success: true, data: queries });
});

// Read-only audit trail
router.get('/', getAllAuditLogs);
router.get('/:id', getAuditLogById);

export default router;
