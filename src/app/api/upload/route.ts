import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/auth";
import { isUrlReferenced } from "@/lib/db";
import { deleteFiles, isBlobConfigured, isOwnBlobUrl, requireBlobToken } from "@/lib/storage";
import {
  ALLOWED_CONTENT_TYPES,
  ALLOWED_COVER_TYPES,
  COVERS_PREFIX,
  FILES_PREFIX,
  MAX_COVER_BYTES,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload-rules";

export const runtime = "nodejs";

const NOT_CONFIGURED =
  "File storage is not configured (BLOB_READ_WRITE_TOKEN missing). Connect the Vercel Blob store to this project, or run `vercel env pull` locally.";

/**
 * Issues short-lived client-upload tokens so the browser uploads files
 * straight to Vercel Blob (no 4.5MB function body limit). Admin only.
 * The Library item itself is created afterwards via POST /api/items.
 */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: NOT_CONFIGURED }, { status: 503 });
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      token: requireBlobToken(),
      onBeforeGenerateToken: async (pathname) => {
        // Re-check the admin session at token time (defense in depth).
        if (!(await isAuthenticated())) throw new Error("Unauthorized");
        if (pathname.includes("..")) throw new Error("Invalid pathname");
        if (pathname.startsWith(FILES_PREFIX)) {
          return {
            allowedContentTypes: ALLOWED_CONTENT_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            addRandomSuffix: true,
            allowOverwrite: false,
          };
        }
        if (pathname.startsWith(COVERS_PREFIX)) {
          return {
            allowedContentTypes: ALLOWED_COVER_TYPES,
            maximumSizeInBytes: MAX_COVER_BYTES,
            addRandomSuffix: true,
            allowOverwrite: false,
          };
        }
        throw new Error("Invalid upload path");
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    console.error("upload token error:", msg);
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 400 });
  }
}

/** Remove an uploaded blob that never made it into the Library (e.g. item creation failed). */
export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: NOT_CONFIGURED }, { status: 503 });
  }
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || !isOwnBlobUrl(url, [FILES_PREFIX, COVERS_PREFIX])) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    if (await isUrlReferenced(url)) {
      return NextResponse.json({ error: "File is in use by a Library item" }, { status: 409 });
    }
    await deleteFiles([url]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
