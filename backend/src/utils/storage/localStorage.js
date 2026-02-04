/**
 * Local storage implementation (ES Module)
 * - Moves multer temp file into TEMP_DIR under the given destination name
 * - Provides getStream, remove and listing functionality
 */

import fs from "fs";
import path from "path";
import util from "util";
import stream from "stream";
import { fileURLToPath } from "url";

const pipeline = util.promisify(stream.pipeline);

// __dirname replacement in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEMP_DIR = process.env.TEMP_DIR
  ? path.resolve(process.env.TEMP_DIR)
  : path.join(__dirname, "..", "public", "temp");

// Ensure directory exists
fs.mkdirSync(TEMP_DIR, { recursive: true });

export async function saveLocal(filePath, destinationName) {
  const dest = path.join(TEMP_DIR, destinationName);
  await fs.promises.rename(filePath, dest);
  return { key: destinationName, path: dest };
}

export async function putStream(key, readableStream) {
  const dest = path.join(TEMP_DIR, key);
  const writeStream = fs.createWriteStream(dest);
  await pipeline(readableStream, writeStream);
  return { key, path: dest };
}

export function getStream(key) {
  const src = path.join(TEMP_DIR, key);
  if (!fs.existsSync(src)) throw new Error("File not found");
  return fs.createReadStream(src);
}

export async function exists(key) {
  return fs.existsSync(path.join(TEMP_DIR, key));
}

export async function remove(key) {
  const p = path.join(TEMP_DIR, key);
  if (fs.existsSync(p)) await fs.promises.unlink(p);
  return true;
}

export async function listOlderThan(days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const files = await fs.promises.readdir(TEMP_DIR);

  const results = [];
  for (const file of files) {
    const p = path.join(TEMP_DIR, file);
    try {
      const stat = await fs.promises.stat(p);
      if (stat.mtimeMs < cutoff) {
        results.push({ key: file, mtime: stat.mtimeMs, size: stat.size });
      }
    } catch {
      // ignore
    }
  }
  return results;
}

export default {
  TEMP_DIR,
  saveLocal,
  putStream,
  getStream,
  exists,
  remove,
  listOlderThan,
};
