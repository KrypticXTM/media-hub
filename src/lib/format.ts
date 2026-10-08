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

/** Public path (starts with /) is returned as-is; otherwise served via /api/files. */
export function fileUrl(filename: string | null | undefined, download = false): string {
  if (!filename) return "";
  if (filename.startsWith("/")) {
    // Static public asset — ignore download flag (browsers handle Save As)
    return filename;
  }
  const base = `/api/files/${encodeURIComponent(filename)}`;
  return download ? `${base}?download=1` : base;
}

export function sharePath(slug: string): string {
  return `/i/${slug}`;
}
