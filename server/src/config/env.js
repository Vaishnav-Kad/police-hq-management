import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '3306', 10),
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'police_hq_db',
  },
  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev_jwt_secret_police_hq_2026',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  },
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  STORAGE_PATH: process.env.STORAGE_PATH || path.resolve(__dirname, '../../../police_storage'),
};
