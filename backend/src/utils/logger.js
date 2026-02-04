/**
 * Lightweight logger wrapper (ESM)
 * Replace with Winston/Pino later when you want structured logs.
 *
 * Methods:
 * - info, warn, error, debug
 */

const isProd = process.env.NODE_ENV === 'production';

export function info(...args) {
  console.log('[INFO]', ...args);
}

export function warn(...args) {
  console.warn('[WARN]', ...args);
}

export function error(...args) {
  console.error('[ERROR]', ...args);
}

export function debug(...args) {
  if (!isProd) console.debug('[DEBUG]', ...args);
}

export default { info, warn, error, debug };
