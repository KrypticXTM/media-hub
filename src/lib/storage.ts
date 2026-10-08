/**
 * Vercel Blob storage for Library files and the Library metadata document.
 *
 * - Uploaded files go straight from the browser to Blob (client uploads, see
 *   /api/upload) and are stored as public blobs under library/files/ and
 *   library/covers/. Items store the full public blob URL.
 * - Library metadata lives in one JSON blob: library/items.json (see db.ts).
 *
 * Requires BLOB_READ_WRITE_TOKEN (set automatically when the Blob store is
 * connected to the Vercel project; locally run `vercel env pull`).
 */
import { del } from "@vercel/blob";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "File storage is not configured: BLOB_READ_WRITE_TOKEN is missing. Connect the Vercel Blob store to this project (or run `vercel env pull` locally) and restart."
    );
    this.name = "StorageNotConfiguredError";
  }
}

function token(): string | undefined {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  return t && t.startsWith("vercel_blob_rw_") ? t : undefined;
}

export function isBlobConfigured(): boolean {
  return Boolean(token());
}

export function requireBlobToken(): string {
  const t = token();
  if (!t) throw new StorageNotConfiguredError();
  return t;
}

/** Store id embedded in the read-write token: vercel_blob_rw_<storeId>_<secret>. */
function storeId(): string {
  const id = requireBlobToken().split("_")[3];
  if (!id) throw new StorageNotConfiguredError();
  return id.toLowerCase();
}

/** Public base URL of this project's Blob store, e.g. https://<id>.public.blob.vercel-storage.com */
export function blobBaseUrl(): string {
  return `https://${storeId()}.public.blob.vercel-storage.com`;
}

/** Public URL for a pathname in this store (no request made). */
export function publicBlobUrl(pathname: string): string {
  return `${blobBaseUrl()}/${pathname.replace(/^\/+/, "")}`;
}

/** True when the URL points at a blob in THIS store under one of the given prefixes. */
export function isOwnBlobUrl(url: string | null | undefined, prefixes: string[] = ["library/"]): boolean {
  if (!url || !isBlobConfigured()) return false;
  try {
    const u = new URL(url);
    const base = new URL(blobBaseUrl());
    if (u.protocol !== "https:" || u.hostname !== base.hostname) return false;
    const path = decodeURIComponent(u.pathname).replace(/^\/+/, "");
    return prefixes.some((p) => path.startsWith(p));
  } catch {
    return false;
  }
}

/** Delete uploaded blobs. Static paths (/covers/...) and foreign URLs are ignored. */
export async function deleteFiles(urls: (string | null | undefined)[]): Promise<void> {
  const own = urls.filter((u): u is string => isOwnBlobUrl(u, ["library/files/", "library/covers/"]));
  if (own.length === 0) return;
  await del(own, { token: requireBlobToken() });
}
