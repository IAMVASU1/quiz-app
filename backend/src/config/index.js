// src/config/index.js
/**
 * Loads configuration, preferring environment variables, falling back to defaults.
 * Use `import config from '../config'` to get config object.
 */

import defaults from './default.js';

const config = {
  APP_NAME: process.env.APP_NAME || defaults.APP_NAME,
  API_PREFIX: process.env.API_PREFIX || defaults.API_PREFIX,
  PORT: parseInt(process.env.PORT || defaults.PORT, 10),
  JWT_EXPIRES: process.env.JWT_EXPIRES || defaults.JWT_EXPIRES,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || defaults.STORAGE_DRIVER,
  TEMP_DIR: process.env.TEMP_DIR || defaults.TEMP_DIR,
  MAX_UPLOAD_MB: parseInt(process.env.MAX_UPLOAD_MB || defaults.MAX_UPLOAD_MB, 10),
  CLEANUP_DAYS: parseInt(process.env.CLEANUP_DAYS || defaults.CLEANUP_DAYS, 10),
  CLEANUP_INTERVAL_MS: parseInt(
    process.env.CLEANUP_INTERVAL_MS || defaults.CLEANUP_INTERVAL_MS,
    10
  )
};

export default config;
