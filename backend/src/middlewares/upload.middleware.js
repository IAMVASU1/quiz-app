// src/middlewares/upload.middleware.js
/**
 * Multer upload middleware (local disk) — ESM
 *
 * - Stores uploaded files into TEMP_DIR
 * - Safe filenames
 * - File size limit
 * - Validates extensions
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import localStorage from '../utils/storage/localStorage.js';
import { fileURLToPath } from 'url';

// __dirname replacement in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// fallback temp directory
let tempDir = path.join(__dirname, '..', 'public', 'temp');

// use localStorage TEMP_DIR if available
if (localStorage?.TEMP_DIR) {
  tempDir = localStorage.TEMP_DIR;
}

// ensure directory exists
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});

const maxMB = parseInt(process.env.MAX_UPLOAD_MB || '10', 10);

const upload = multer({
  storage,
  limits: { fileSize: maxMB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(xlsx|xls|csv)$/i;
    if (!allowedExt.test(file.originalname)) {
      return cb(new Error('Only spreadsheet files are allowed (.xlsx, .xls, .csv)'));
    }
    return cb(null, true);
  }
});

export default upload;
