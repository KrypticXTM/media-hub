import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deleteItem, getItemById, updateItem } from "@/lib/db";
import { deleteFiles, isBlobConfigured, StorageNotConfiguredError } from "@/lib/storage";
import { MEDIA_TYPES, type MediaType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const VALID_TYPES = new Set<string>(MEDIA_TYPES.map((t) => t.value));

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const item = await getItemById(Number(id));
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item });
}

function guard(id: number): NextResponse | null {
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (id < 0) {
    return NextResponse.json(
      { error: "Built-in items (Word Lightning, LUMINA) are defined in code and can't be changed here." },
      { status: 400 }
    );
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: new StorageNotConfiguredError().message }, { status: 503 });
  }
  return null;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = Number((await ctx.params).id);
  const bad = guard(id);
  if (bad) return bad;
  try {
    const body = await req.json();
    if (body.type !== undefined && !VALID_TYPES.has(String(body.type))) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    const item = await updateItem(id, {
      title: body.title !== undefined ? String(body.title) : undefined,
      description: body.description !== undefined ? String(body.description) : undefined,
      type: body.type !== undefined ? (body.type as MediaType) : undefined,
      tags: body.tags !== undefined ? String(body.tags) : undefined,
      projectUrl: body.projectUrl !== undefined ? body.projectUrl : undefined,
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = Number((await ctx.params).id);
  const bad = guard(id);
  if (bad) return bad;
  try {
    const item = await deleteItem(id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    try {
      await deleteFiles([item.filename, item.coverFilename]);
    } catch (e) {
      // The item is gone from the Library; report but don't fail the request.
      console.error("Item deleted but blob cleanup failed:", e);
      return NextResponse.json({ ok: true, warning: "Item deleted, but its file could not be removed from storage." });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
