import { Router } from 'express';
import authRoutes from './authRoutes.js';
import stationRoutes from './stationRoutes.js';
import officerRoutes from './officerRoutes.js';
import firRoutes from './firRoutes.js';
import caseRoutes from './caseRoutes.js';
import criminalRoutes from './criminalRoutes.js';
import evidenceRoutes from './evidenceRoutes.js';
import courtDateRoutes from './courtDateRoutes.js';
import warrantRoutes from './warrantRoutes.js';
import witnessRoutes from './witnessRoutes.js';
import arrestRoutes from './arrestRoutes.js';
import auditRoutes from './auditRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import alertRoutes from './alertRoutes.js';

const apiRouter = Router();

// Core Operational Modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/stations', stationRoutes);
apiRouter.use('/officers', officerRoutes);
apiRouter.use('/fir', firRoutes);
apiRouter.use('/cases', caseRoutes);
apiRouter.use('/criminals', criminalRoutes);
apiRouter.use('/evidences', evidenceRoutes);

// Legal & Auxiliary Modules
apiRouter.use('/court-dates', courtDateRoutes);
apiRouter.use('/warrants', warrantRoutes);
apiRouter.use('/witnesses', witnessRoutes);
apiRouter.use('/arrests', arrestRoutes);
apiRouter.use('/audit-logs', auditRoutes);

// Intelligence, Analytics & Alerts
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/alerts', alertRoutes);

export default apiRouter;
