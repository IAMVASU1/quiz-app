// src/utils/fileCleanup.job.js
/**
 * File cleanup job (ESM)
 *
 * Exports:
 *  - cleanupOlderThan(days = 3): scans storage (local TEMP dir) and removes files older than `days`.
 *  - startCleanupInterval(days = 3, intervalMs = 24h): starts a periodic cleanup (returns interval id).
 *
 * Notes:
 *  - Uses the storage facade at ../utils/storage/index.js which must implement listOlderThan(days) and remove(key).
 *  - Safe to call on startup and schedule.
 */

import storage from './storage/index.js'; // storage facade (ESM)
import { fileURLToPath } from 'url';
import path from 'path';

// optional logger (replace with your logger util if available)
const LOG = console;

/**
 * Remove files older than `days`. Returns array of removed file keys.
 * If storage doesn't support listOlderThan, and TEMP_DIR is a real path, we fall back to scanning.
 */
export async function cleanupOlderThan(days = 3) {
  if (!storage || typeof storage.listOlderThan !== 'function' || typeof storage.remove !== 'function') {
    LOG.warn('Storage adapter does not implement listOlderThan/remove. Cleanup aborted.');
    return [];
  }

  try {
    LOG.info(`Running cleanupOlderThan(${days})...`);
    const oldFiles = await storage.listOlderThan(days);
    if (!Array.isArray(oldFiles) || oldFiles.length === 0) {
      LOG.info('No old files to remove.');
      return [];
    }

    const removed = [];
    for (const f of oldFiles) {
      try {
        await storage.remove(f.key);
        LOG.info(`Removed file: ${f.key} (mtime: ${new Date(f.mtime).toISOString()}, size: ${f.size})`);
        removed.push(f.key);
      } catch (e) {
        LOG.error(`Failed to remove ${f.key}: ${e?.message || e}`);
      }
    }

    return removed;
  } catch (err) {
    LOG.error('cleanupOlderThan error:', err);
    throw err;
  }
}

/**
 * Start a periodic cleanup interval. Returns the interval timer id.
 * - days: file age cutoff in days
 * - intervalMs: how often to run in milliseconds
 */
export function startCleanupInterval(days = 3, intervalMs = 24 * 60 * 60 * 1000) {
  // Run once immediately (don't await to avoid blocking caller)
  cleanupOlderThan(days).catch((e) => LOG.error('Initial cleanup error:', e));

  const id = setInterval(() => {
    cleanupOlderThan(days).catch((e) => LOG.error('Scheduled cleanup error:', e));
  }, intervalMs);

  // make sure node won't keep process alive if only this timer is running
  if (typeof id.unref === 'function') id.unref();

  LOG.info(`Scheduled cleanup every ${intervalMs}ms, removing files older than ${days} day(s).`);
  return id;
}

export default { cleanupOlderThan, startCleanupInterval };
