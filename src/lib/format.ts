export function formatBytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * URL for an item's file or cover.
 * - Full URLs (Vercel Blob) are returned as-is; `download` adds Blob's ?download=1
 *   which makes the browser save the file instead of opening it.
 * - Static public paths (/covers/...) are returned as-is.
 */
export function fileUrl(filename: string | null | undefined, download = false): string {
  if (!filename) return "";
  if (/^https?:\/\//i.test(filename)) {
    if (!download) return filename;
    return filename + (filename.includes("?") ? "&" : "?") + "download=1";
  }
  // Static public asset — ignore download flag (browsers handle Save As)
  return filename;
}

export function sharePath(slug: string): string {
  return `/i/${slug}`;
}
