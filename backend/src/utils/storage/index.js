/**
 * Storage facade (ES Module)
 *
 * Loads storage implementation based on STORAGE_DRIVER env var:
 * - local (default) -> ./localStorage.js
 * - minio -> ./minioStorage.js (not implemented here)
 * - gridfs -> ./gridfsStorage.js (not implemented here)
 *
 * The implementation must export:
 * - saveLocal(tempPath, destinationName) -> { key, path }
 * - putStream(key, readableStream)
 * - getStream(key) -> readableStream
 * - exists(key) -> boolean
 * - remove(key)
 * - listOlderThan(days) -> [{ key, mtime, size }]
 * - TEMP_DIR (string)
 */

const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();

let impl;

if (driver === "local") {
  impl = await import("./localStorage.js");
} else if (driver === "minio") {
  throw new Error('minio storage not implemented yet. Change STORAGE_DRIVER to "local"');
} else if (driver === "gridfs") {
  throw new Error('gridfs storage not implemented yet. Change STORAGE_DRIVER to "local"');
} else {
  throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
}

export default impl.default || impl;
