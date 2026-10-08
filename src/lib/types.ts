export type MediaType =
  | "image"
  | "video"
  | "gif"
  | "pdf"
  | "doc"
  | "spreadsheet"
  | "project"
  | "other";

export interface MediaItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  type: MediaType;
  tags: string[]; // parsed from comma-separated DB field
  /** Public Vercel Blob URL of the uploaded file (or null for projects). */
  filename: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  projectUrl: string | null;
  /** Public Vercel Blob URL, or a static path like /covers/x.jpg for code-defined items. */
  coverFilename: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  /** Code-defined item (Word Lightning, LUMINA) — always present, not editable/deletable. */
  builtin?: boolean;
}

export const MEDIA_TYPES: { value: MediaType; label: string }[] = [
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "gif", label: "GIFs" },
  { value: "pdf", label: "PDFs" },
  { value: "doc", label: "Docs" },
  { value: "spreadsheet", label: "Spreadsheets" },
  { value: "project", label: "Projects" },
  { value: "other", label: "Other" },
];
