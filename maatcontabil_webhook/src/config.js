import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BASE_DIR = path.resolve(__dirname, '..');
export const DB_CONFIG_FILE = path.join(BASE_DIR, 'db-config.json');
export const UPLOADS_DIR = path.join(BASE_DIR, 'uploads');
export const CERTS_DIR = path.join(BASE_DIR, 'certs');
export const PORT = Number(process.env.PORT || 3001);
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const DATABASE_SSLMODE = process.env.DATABASE_SSLMODE || process.env.PGSSLMODE || '';
export const DATABASE_SSL = String(process.env.DATABASE_SSL || '').toLowerCase() === 'true';
