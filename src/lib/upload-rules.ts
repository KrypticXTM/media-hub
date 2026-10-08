/**
 * Upload rules shared by the browser (UploadForm / ProjectForm) and the server
 * (/api/upload token route, /api/items). No server-only imports here.
 */
import type { MediaType } from "./types";

/** Max size for a Library file upload (Vercel Blob client uploads bypass the ~4.5MB function body limit). */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
/** Max size for a project cover image. */
export const MAX_COVER_BYTES = 15 * 1024 * 1024; // 15 MB

/** Pathname prefixes inside the Blob store. */
export const FILES_PREFIX = "library/files/";
export const COVERS_PREFIX = "library/covers/";

/** Content types accepted for Library files: images (incl. GIF), video, PDF, docs, spreadsheets, text. */
export const ALLOWED_CONTENT_TYPES = [
  "image/*",
  "video/*",
  "text/*",
  "application/pdf",
  "application/rtf",
  "application/json",
  // Word / docs
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  // Spreadsheets
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
  // Slides (docs)
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.presentation",
];

export const ALLOWED_COVER_TYPES = ["image/*"];

/** File picker hint for the upload form. */
export const ACCEPT_ATTR =
  "image/*,video/*,text/*,.pdf,.txt,.md,.csv,.tsv,.rtf,.json,.doc,.docx,.odt,.xls,.xlsx,.ods,.ppt,.pptx,.odp";

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  heic: "image/heic",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  rtf: "application/rtf",
  json: "application/json",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odp: "application/vnd.oasis.opendocument.presentation",
};

/** Best-effort content type: the browser's file.type, else a guess from the extension. */
export function guessContentType(name: string, browserType?: string | null): string {
  if (browserType) return browserType;
  const ext = name.toLowerCase().split(".").pop() || "";
  return EXT_MIME[ext] || "application/octet-stream";
}

/** Does a content type match the allow-list (supports "type/*" wildcards)? */
export function isAllowedContentType(contentType: string, allowed = ALLOWED_CONTENT_TYPES): boolean {
  const ct = contentType.split(";")[0].trim().toLowerCase();
  return allowed.some((a) => (a.endsWith("/*") ? ct.startsWith(a.slice(0, -1)) : ct === a));
}

/** Make a filename safe for a Blob pathname (keeps the extension). */
export function safeBlobName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) : "";
  return ext ? `${base}.${ext}` : base;
}

export function detectType(mime: string, name: string): MediaType {
  const lower = name.toLowerCase();
  if (mime === "image/gif" || lower.endsWith(".gif")) return "gif";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    mime === "text/csv" ||
    mime === "text/tab-separated-values" ||
    /\.(xlsx?|csv|tsv|ods)$/i.test(lower)
  )
    return "spreadsheet";
  if (
    mime.includes("document") ||
    mime.includes("msword") ||
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    mime.startsWith("text/") ||
    mime === "application/rtf" ||
    /\.(docx?|txt|rtf|md|odt|pptx?|odp)$/i.test(lower)
  )
    return "doc";
  return "other";
}

export function formatLimit(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
