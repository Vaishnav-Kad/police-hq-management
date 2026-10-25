import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

// Ensure storage directories exist
const mugshotsDir = path.join(env.STORAGE_PATH, 'mugshots');
const evidencesDir = path.join(env.STORAGE_PATH, 'evidences');

[mugshotsDir, evidencesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Mugshot Multer Disk Storage
const mugshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, mugshotsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const criminalId = req.params.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `mugshot_${criminalId}_${uniqueSuffix}${ext}`);
  },
});

// File filter: accept only image formats for mugshots
const mugshotFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image format. Allowed: ${allowed.join(', ')}`), false);
  }
};

export const uploadMugshotMiddleware = multer({
  storage: mugshotStorage,
  fileFilter: mugshotFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Evidence File Disk Storage
const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, evidencesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Sanitize original name
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `evd_${baseName}_${uniqueSuffix}${ext}`);
  },
});

export const uploadEvidenceMiddleware = multer({
  storage: evidenceStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});
