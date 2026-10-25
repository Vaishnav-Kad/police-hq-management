import { Router } from 'express';
import {
  getDashboardSummary,
  getCrimeTypeDistribution,
  getMonthlyCrimeTrends,
  getOfficerPerformance,
  getAreaCrimeRates,
} from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/summary', getDashboardSummary);
router.get('/crime-types', getCrimeTypeDistribution);
router.get('/monthly-trends', getMonthlyCrimeTrends);
router.get('/officer-success', getOfficerPerformance);
router.get('/area-rates', getAreaCrimeRates);

export default router;
