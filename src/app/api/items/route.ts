import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { isAuthenticated } from "@/lib/auth";
import { createItem, listItems, getAllTags } from "@/lib/db";
import { isBlobConfigured, isOwnBlobUrl, requireBlobToken, StorageNotConfiguredError } from "@/lib/storage";
import { COVERS_PREFIX, FILES_PREFIX, detectType } from "@/lib/upload-rules";
import { MEDIA_TYPES, type MediaType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = new Set<string>(MEDIA_TYPES.map((t) => t.value));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const type = searchParams.get("type") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const [items, tags] = await Promise.all([listItems({ q, type, tag }), getAllTags()]);
  return NextResponse.json({ items, tags });
}

/**
 * Create a Library item. For file items the browser has already uploaded the
 * file to Blob (client upload) and sends its URL as `fileUrl` (or `filename`).
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: new StorageNotConfiguredError().message }, { status: 503 });
  }

  try {
    const body = await req.json();
    const fileUrl: string | null = body.fileUrl || body.filename || null;
    const coverUrl: string | null = body.coverUrl || body.coverFilename || null;

    if (fileUrl && !isOwnBlobUrl(fileUrl, [FILES_PREFIX])) {
      return NextResponse.json({ error: "File URL is not a Library upload" }, { status: 400 });
    }
    if (coverUrl && !isOwnBlobUrl(coverUrl, [COVERS_PREFIX, FILES_PREFIX])) {
      return NextResponse.json({ error: "Cover URL is not a Library upload" }, { status: 400 });
    }

    // Trust the store, not the client, for size/content type of the uploaded file.
    let mimeType: string | null = body.mimeType ? String(body.mimeType) : null;
    let sizeBytes: number | null = body.sizeBytes != null ? Number(body.sizeBytes) : null;
    if (fileUrl) {
      try {
        const meta = await head(fileUrl, { token: requireBlobToken() });
        mimeType = meta.contentType || mimeType;
        sizeBytes = meta.size;
      } catch {
        return NextResponse.json({ error: "Uploaded file not found in storage" }, { status: 400 });
      }
    }

    const originalName: string | null = body.originalName ? String(body.originalName).slice(0, 255) : null;
    const title =
      String(body.title || "").trim() ||
      (originalName ? originalName.replace(/\.[^.]+$/, "") : "") ||
      "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let type: MediaType;
    if (body.type && VALID_TYPES.has(String(body.type))) type = body.type as MediaType;
    else if (fileUrl) type = detectType(mimeType || "", originalName || fileUrl);
    else type = "project";

    const item = await createItem({
      title,
      description: String(body.description || ""),
      type,
      tags: String(body.tags || ""),
      projectUrl: body.projectUrl ? String(body.projectUrl) : null,
      filename: fileUrl,
      originalName,
      mimeType,
      sizeBytes,
      coverFilename: coverUrl,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
