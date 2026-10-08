"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { MEDIA_TYPES } from "@/lib/types";
import {
  ACCEPT_ATTR,
  FILES_PREFIX,
  MAX_UPLOAD_BYTES,
  formatLimit,
  guessContentType,
  isAllowedContentType,
  safeBlobName,
} from "@/lib/upload-rules";

/** Files above this size are sent in parallel parts (more reliable for big videos). */
const MULTIPART_THRESHOLD = 50 * 1024 * 1024;

export default function UploadForm({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!file || !(file instanceof File) || file.size === 0) {
      setError("Choose a file to upload");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large (max ${formatLimit(MAX_UPLOAD_BYTES)})`);
      return;
    }
    const contentType = guessContentType(file.name, file.type);
    if (!isAllowedContentType(contentType)) {
      setError("That file type isn't allowed. Use images, GIFs, videos, PDFs, docs, spreadsheets or text.");
      return;
    }

    setBusy(true);
    setProgress(0);
    let uploadedUrl: string | null = null;
    try {
      // 1) Browser -> Vercel Blob directly (bypasses the ~4.5MB server body limit)
      const blob = await upload(`${FILES_PREFIX}${safeBlobName(file.name)}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType,
        multipart: file.size > MULTIPART_THRESHOLD,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      uploadedUrl = blob.url;

      // 2) Save the Library item
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: blob.url,
          originalName: file.name,
          mimeType: contentType,
          sizeBytes: file.size,
          title: String(data.get("title") || "").trim(),
          description: String(data.get("description") || ""),
          tags: String(data.get("tags") || ""),
          type: String(data.get("type") || "") || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Saving the item failed");
      uploadedUrl = null;
      setMessage(`Uploaded — share link: /i/${json.item.slug}`);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      if (uploadedUrl) {
        // Don't leave an orphaned file in storage
        fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: uploadedUrl }),
        }).catch(() => {});
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="studio-card space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">Upload a file</h2>
        <p className="text-sm text-studio-muted">
          Images, videos, GIFs, PDFs, docs, spreadsheets, or text — up to {formatLimit(MAX_UPLOAD_BYTES)}.
        </p>
      </div>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">File</span>
        <input name="file" type="file" required accept={ACCEPT_ATTR} disabled={disabled || busy} className="studio-input file:mr-3 file:rounded-lg file:border-0 file:bg-studio-accent/20 file:px-3 file:py-1 file:text-studio-accent" />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Title (optional — defaults to filename)</span>
        <input name="title" className="studio-input" placeholder="My cool still" />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Description</span>
        <textarea name="description" rows={3} className="studio-input resize-y" placeholder="What is this?" />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Tags (comma-separated)</span>
        <input name="tags" className="studio-input" placeholder="studio, wip, 2026" />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Type (optional override)</span>
        <select name="type" className="studio-input" defaultValue="">
          <option value="">Auto-detect</option>
          {MEDIA_TYPES.filter((t) => t.value !== "project").map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-studio-danger">{error}</p> : null}
      {message ? <p className="text-sm text-studio-success">{message}</p> : null}

      <button type="submit" disabled={disabled || busy} className="studio-btn-primary">
        {busy ? (progress != null && progress < 100 ? `Uploading… ${progress}%` : "Saving…") : "Upload"}
      </button>
    </form>
  );
}
