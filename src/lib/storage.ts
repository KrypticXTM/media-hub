/**
 * Local filesystem storage for uploaded media.
 *
 * Files live under data/uploads/ (gitignored).
 * Served publicly via GET /api/files/[filename].
 *
 * --- Future: S3 / Cloudflare R2 / Vercel Blob ---
 * Swap the functions below to talk to an object store instead of disk.
 * Keep the same signatures so API routes and DB rows stay unchanged:
 *   - storeFile(buffer, preferredName) -> stored filename
 *   - deleteFile(filename) -> void
 *   - getFilePath(filename) -> absolute path or signed URL helper
 * Store only the object key in the DB `filename` column.
 */

import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR =
  process.env.VERCEL || process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR || "/tmp", "media-hub", "uploads")
    : path.join(process.cwd(), "data", "uploads");

export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function getUploadDir(): string {
  ensureUploadDir();
  return UPLOAD_DIR;
}

export function getFilePath(filename: string): string {
  // Prevent path traversal — only allow bare filenames
  const safe = path.basename(filename);
  return path.join(getUploadDir(), safe);
}

export function storeFile(buffer: Buffer, originalName: string): string {
  ensureUploadDir();
  const ext = path.extname(originalName).toLowerCase().slice(0, 20);
  const stored = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, stored), buffer);
  return stored;
}

export function deleteFile(filename: string | null | undefined): void {
  if (!filename) return;
  const full = getFilePath(filename);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
  }
}

export function fileExists(filename: string): boolean {
  return fs.existsSync(getFilePath(filename));
}
