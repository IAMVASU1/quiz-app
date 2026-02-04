// src/jobs/importProcessor.js
/**
 * Import processor (ESM)
 *
 * A simple job processor that handles an import job:
 * - Calls import.service.importFromFile(filePath, options)
 * - Optionally removes the uploaded file on success
 * - Returns a standardized job result object: { ok: boolean, report, error }
 *
 * This is intentionally simple so you can hook it into any queue (Bull, Bee-Queue, or a simple in-memory queue).
 *
 * Expected job shape:
 *   {
 *     id?: string,
 *     filePath: '/absolute/path/to/file.xlsx',
 *     storageKey?: '12345-file.xlsx',   // optional
 *     options: { target: 'question'|'builtin', uploadedBy, source, difficulty, subject, ... },
 *     removeFileOnSuccess?: true|false
 *   }
 */

import importService from '../services/import.service.js';
import storage from '../utils/storage/index.js'; // to optionally delete file from storage
const LOG = console;

export async function processImportJob(job = {}) {
  if (!job || !job.filePath) {
    const err = new Error('Invalid job: filePath is required');
    LOG.error(err);
    return { ok: false, error: err.message || String(err), job };
  }

  const { filePath, storageKey = null, options = {}, removeFileOnSuccess = true } = job;

  LOG.info(`Processing import job${job.id ? ` ${job.id}` : ''} for file: ${filePath}`);

  try {
    // Call the import service which parses + inserts into DB
    const report = await importService.importFromFile(filePath, options);

    LOG.info(`Import job${job.id ? ` ${job.id}` : ''} completed. Imported=${report.imported} Skipped=${report.skipped} Errors=${(report.errors || []).length}`);

    // Optionally remove the file from storage (local temp dir) after successful import
    if (removeFileOnSuccess) {
      try {
        if (storage && typeof storage.remove === 'function') {
          if (storageKey) {
            await storage.remove(storageKey);
            LOG.info(`Removed uploaded file by storageKey: ${storageKey}`);
          } else {
            // Try to delete by path: if storage exposes TEMP_DIR and simple remove expects key,
            // we attempt to derive the basename and remove that key.
            const { basename } = await import('path');
            const key = basename(filePath);
            await storage.remove(key);
            LOG.info(`Removed uploaded file by derived key: ${key}`);
          }
        } else {
          LOG.warn('Storage adapter does not support remove(); uploaded file not removed automatically.');
        }
      } catch (remErr) {
        LOG.warn('Could not remove uploaded file after import:', remErr?.message || remErr);
      }
    }

    return { ok: true, report, job };
  } catch (err) {
    LOG.error(`Import job${job.id ? ` ${job.id}` : ''} failed:`, err);
    return { ok: false, error: err.message || String(err), job, details: (err.stack || null) };
  }
}

export default { processImportJob };
