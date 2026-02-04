// src/config/default.js
/**
 * Default configuration values (ESM)
 * These are safe defaults. Override with environment variables.
 */

export default {
  APP_NAME: 'QuizApp',
  API_PREFIX: '/api/v1',
  PORT: process.env.PORT || 3000,
  JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  TEMP_DIR: process.env.TEMP_DIR || './src/public/temp',
  MAX_UPLOAD_MB: parseInt(process.env.MAX_UPLOAD_MB || '10', 10),
  CLEANUP_DAYS: parseInt(process.env.CLEANUP_DAYS || '3', 10),
  CLEANUP_INTERVAL_MS: parseInt(
    process.env.CLEANUP_INTERVAL_MS || String(24 * 60 * 60 * 1000),
    10
  )
};
