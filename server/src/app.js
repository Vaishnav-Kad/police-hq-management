import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { successResponse } from './utils/responseHelper.js';

import apiRouter from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-officer-id', 'x-officer-badge']
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  return successResponse(res, {
    status: 'ONLINE',
    service: 'Police Headquarters Management System API',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  }, 'Service healthy');
});

// Serve Mugshots statically for image display (controlled)
app.use('/police_storage/mugshots', express.static(path.join(env.STORAGE_PATH, 'mugshots')));

// Mount API routes
app.use('/api', apiRouter);

// Catch-all 404 & centralized error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
