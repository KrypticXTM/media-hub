/**
 * Library item store.
 *
 * Items live in ONE JSON document in Vercel Blob: library/items.json
 *   { version: 1, nextId: number, items: StoredItem[] }
 * Files themselves are separate public blobs (see storage.ts / /api/upload).
 *
 * Code-defined items (Word Lightning, LUMINA) are NOT stored in Blob; they are
 * merged in at read time so they always exist and can't be deleted.
 *
 * Freshness:
 * - Every read of items.json is consistent (see readDocFresh): head() gives
 *   the current ETag and the content is read from an immutable,
 *   content-addressed copy, so CDN caching can never serve a stale list.
 *   Writes are read-modify-write guarded by that ETag (ifMatch) so concurrent
 *   writes can't clobber each other, then invalidate the "library-items" tag.
 * - Public page reads go through Next's data cache tagged "library-items",
 *   so they refresh immediately after any write made through the app (admin
 *   upload/edit/delete) and otherwise at most hourly (only matters for changes
 *   made outside the app). This keeps Blob operations well inside the free
 *   Hobby allowance (10k simple ops/month) even if a share link gets busy.
 */
import { put, head, del, BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";
import { createHash } from "crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import type { MediaItem, MediaType } from "./types";
import { isBlobConfigured, publicBlobUrl, requireBlobToken } from "./storage";
import { makeSlug } from "./slug";

const ITEMS_PATHNAME = "library/items.json";
const VERSIONS_PREFIX = "library/index/";
const CACHE_TAG = "library-items";
const CACHE_SECONDS = 3600;

interface StoredItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  type: MediaType;
  tags: string[];
  fileUrl: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  projectUrl: string | null;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LibraryDoc {
  version: 1;
  nextId: number;
  items: StoredItem[];
}

const EMPTY_DOC: LibraryDoc = { version: 1, nextId: 1, items: [] };

// ---------------------------------------------------------------------------
// Code-defined items (covers are static files in public/covers)
// ---------------------------------------------------------------------------

const BUILTIN_ITEMS: MediaItem[] = [
  {
    id: -1,
    slug: "word-lightning",
    title: "Word Lightning",
    description:
      "A Grok Build app for verbal fluency. Open the live app from The Workshop - KrypticXtm.",
    type: "project",
    tags: ["app", "grok-build", "word-lightning"],
    filename: null,
    originalName: null,
    mimeType: null,
    sizeBytes: null,
    projectUrl: "https://harbor-beacon-prism-swift.grok.me",
    coverFilename: "/covers/word-lightning.jpg",
    createdAt: "2026-10-07T12:00:00.000Z",
    updatedAt: "2026-10-07T12:00:00.000Z",
    builtin: true,
  },
  {
    id: -2,
    slug: "lumina",
    title: "LUMINA",
    description:
      "A holographic to-do list from Grok Build. Clocks optional — she checks in if you stall.",
    type: "project",
    tags: ["app", "grok-build", "todo", "lumina"],
    filename: null,
    originalName: null,
    mimeType: null,
    sizeBytes: null,
    projectUrl: "https://wind-rocket-nova-palm.grok.me",
    coverFilename: "/covers/lumina.jpg",
    createdAt: "2026-10-07T12:00:01.000Z",
    updatedAt: "2026-10-07T12:00:01.000Z",
    builtin: true,
  },
];

const BUILTIN_SLUGS = new Set(BUILTIN_ITEMS.map((i) => i.slug));

export function isBuiltinSlug(slug: string): boolean {
  return BUILTIN_SLUGS.has(slug);
}

// ---------------------------------------------------------------------------
// Blob read / write
// ---------------------------------------------------------------------------

function normalizeDoc(raw: unknown): LibraryDoc {
  if (!raw || typeof raw !== "object") return { ...EMPTY_DOC, items: [] };
  const r = raw as Partial<LibraryDoc>;
  const items = Array.isArray(r.items) ? r.items : [];
  const maxId = items.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0);
  return {
    version: 1,
    nextId: Math.max(Number(r.nextId) || 1, maxId + 1),
    items,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stripQuotes = (etag: string | null | undefined) => (etag ? etag.replace(/^W\//, "").replace(/"/g, "") : "");
const md5 = (text: string) => createHash("md5").update(text).digest("hex");
/** Immutable, content-addressed copy of a given version of items.json. */
const versionPath = (hash: string) => `${VERSIONS_PREFIX}${hash}.json`;

/**
 * Consistent read of items.json.
 *
 * Public blob URLs are CDN-cached (min 60s) and query strings don't bust that
 * cache, so the URL of a file that gets overwritten can serve old content for
 * up to a minute. Instead:
 *  1. head() (Blob API, always current) gives the ETag of items.json, which is
 *     the MD5 of its content.
 *  2. Every write also stores the same JSON at library/index/<md5>.json — an
 *     immutable, content-addressed URL, so any cached copy is by definition
 *     the right one.
 *  3. We fetch that, verify the MD5, and fall back to the main URL (also
 *     MD5-verified) for documents written before versioning existed.
 */
async function readDocFresh(): Promise<{ doc: LibraryDoc; etag: string | null }> {
  const token = requireBlobToken();
  const deadline = Date.now() + 15_000;
  for (let attempt = 0; ; attempt++) {
    let meta;
    try {
      meta = await head(ITEMS_PATHNAME, { token });
    } catch (err) {
      if (err instanceof BlobNotFoundError) return { doc: { ...EMPTY_DOC, items: [] }, etag: null };
      throw err;
    }
    const want = stripQuotes(meta.etag);
    for (const url of [publicBlobUrl(versionPath(want)), meta.url]) {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      const text = await res.text(); // always drain the body
      if (res.ok && md5(text) === want) {
        return { doc: normalizeDoc(JSON.parse(text)), etag: meta.etag };
      }
      if (!res.ok && res.status !== 404) throw new Error(`Failed to read Library index (${res.status})`);
    }
    console.warn(`Library: items.json version ${want} not readable yet (attempt ${attempt + 1})`);
    if (Date.now() > deadline) throw new Error("Library index is still propagating; try again in a moment.");
    await sleep(Math.min(500 * (attempt + 1), 2000));
  }
}

const readDocCached = unstable_cache(
  async (): Promise<LibraryDoc> => (await readDocFresh()).doc,
  ["library-items-doc-v1"],
  { tags: [CACHE_TAG], revalidate: CACHE_SECONDS }
);

/** Doc for public pages. Falls back to an empty list (built-ins only) if Blob is unavailable. */
async function readDocForDisplay(): Promise<LibraryDoc> {
  if (!isBlobConfigured()) return { ...EMPTY_DOC, items: [] };
  try {
    return await readDocCached();
  } catch (err) {
    // Outside a Next.js request (e.g. a maintenance script) there is no data cache.
    if (err instanceof Error && /incrementalCache|static generation store/i.test(err.message)) {
      return (await readDocFresh()).doc;
    }
    console.error("Library: failed to read items.json from Blob", err);
    return { ...EMPTY_DOC, items: [] };
  }
}

function invalidate(): void {
  try {
    revalidateTag(CACHE_TAG);
  } catch {
    // Not inside a Next.js request (scripts) — nothing to invalidate.
  }
}

/**
 * Read-modify-write with optimistic concurrency. `fn` mutates the doc and
 * returns a result; returning `undefined` skips the write.
 */
async function mutate<T>(fn: (doc: LibraryDoc) => T | undefined): Promise<T | undefined> {
  const token = requireBlobToken();
  for (let attempt = 0; attempt < 6; attempt++) {
    const { doc, etag } = await readDocFresh();
    const result = fn(doc);
    if (result === undefined) return undefined;
    const json = JSON.stringify(doc, null, 1);
    const hash = md5(json);
    try {
      // 1) immutable content-addressed copy first, so readers that see the new
      //    ETag can always fetch it (see readDocFresh)
      await put(versionPath(hash), json, {
        access: "public",
        token,
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 31536000,
      });
      // 2) the main document, guarded by the ETag we read (optimistic concurrency)
      const written = await put(ITEMS_PATHNAME, json, {
        access: "public",
        token,
        contentType: "application/json",
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        ...(etag ? { allowOverwrite: true, ifMatch: etag } : { allowOverwrite: false }),
      });
      const newTag = stripQuotes(written.etag);
      if (newTag !== hash) {
        // Safety net in case Blob ever stops using MD5 ETags.
        console.warn("Library: unexpected ETag format from Blob; storing extra version copy");
        await put(versionPath(newTag), json, {
          access: "public",
          token,
          contentType: "application/json",
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 31536000,
        });
      }
      invalidate();
      // 3) tidy up: drop the previous version copy (del is free)
      const prev = stripQuotes(etag);
      if (prev && prev !== hash && prev !== newTag) {
        await del(publicBlobUrl(versionPath(prev)), { token }).catch(() => {});
      }
      return result;
    } catch (err) {
      const conflict =
        err instanceof BlobPreconditionFailedError ||
        (!etag && err instanceof Error && /already exists/i.test(err.message));
      if (!conflict) throw err;
      // Lost a race with another write: drop our unused version copy and retry.
      await del(publicBlobUrl(versionPath(hash)), { token }).catch(() => {});
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  throw new Error("Library is busy (concurrent edits). Please try again.");
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

function parseTags(tags: string | string[] | undefined | null): string[] {
  const list = Array.isArray(tags) ? tags : String(tags || "").split(",");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of list) {
    const v = String(t).trim();
    if (v && !seen.has(v.toLowerCase())) {
      seen.add(v.toLowerCase());
      out.push(v);
    }
  }
  return out;
}

function toItem(s: StoredItem): MediaItem {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    description: s.description || "",
    type: s.type,
    tags: parseTags(s.tags),
    filename: s.fileUrl ?? null,
    originalName: s.originalName ?? null,
    mimeType: s.mimeType ?? null,
    sizeBytes: s.sizeBytes ?? null,
    projectUrl: s.projectUrl ?? null,
    coverFilename: s.coverUrl ?? null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function allItems(doc: LibraryDoc): MediaItem[] {
  const stored = doc.items.filter((i) => !BUILTIN_SLUGS.has(i.slug)).map(toItem);
  return [...BUILTIN_ITEMS, ...stored];
}

function sortNewestFirst(items: MediaItem[]): MediaItem[] {
  return items.sort((a, b) => {
    const d = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    return d !== 0 ? d : b.id - a.id;
  });
}

// ---------------------------------------------------------------------------
// Public API (same semantics as the old SQLite version, now async)
// ---------------------------------------------------------------------------

export interface ListFilters {
  q?: string;
  type?: string;
  tag?: string;
}

export async function listItems(filters: ListFilters = {}): Promise<MediaItem[]> {
  const doc = await readDocForDisplay();
  let items = allItems(doc);

  if (filters.type && filters.type !== "all") {
    items = items.filter((i) => i.type === filters.type);
  }
  if (filters.tag) {
    const tag = filters.tag.toLowerCase();
    items = items.filter((i) => i.tags.some((t) => t.toLowerCase() === tag));
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter((i) =>
      [i.title, i.description, i.tags.join(","), i.originalName || "", i.filename || ""].some((f) =>
        f.toLowerCase().includes(q)
      )
    );
  }
  return sortNewestFirst(items);
}

export async function getItemBySlug(slug: string): Promise<MediaItem | null> {
  const builtin = BUILTIN_ITEMS.find((i) => i.slug === slug);
  if (builtin) return builtin;
  const doc = await readDocForDisplay();
  const s = doc.items.find((i) => i.slug === slug);
  return s ? toItem(s) : null;
}

export async function getItemById(id: number): Promise<MediaItem | null> {
  const builtin = BUILTIN_ITEMS.find((i) => i.id === id);
  if (builtin) return builtin;
  const doc = await readDocForDisplay();
  const s = doc.items.find((i) => i.id === id);
  return s ? toItem(s) : null;
}

export async function getAllTags(): Promise<string[]> {
  const doc = await readDocForDisplay();
  const set = new Set<string>();
  for (const item of allItems(doc)) for (const t of item.tags) set.add(t);
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export interface CreateItemInput {
  /** Optional preferred slug; a unique one is generated from the title otherwise. */
  slug?: string;
  title: string;
  description?: string;
  type: MediaType;
  tags?: string;
  filename?: string | null; // public blob URL
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  projectUrl?: string | null;
  coverFilename?: string | null; // public blob URL or /covers/... static path
}

export async function createItem(input: CreateItemInput): Promise<MediaItem> {
  const created = await mutate((doc) => {
    const taken = new Set([...BUILTIN_SLUGS, ...doc.items.map((i) => i.slug)]);
    let slug = input.slug && !taken.has(input.slug) ? input.slug : makeSlug(input.title);
    while (taken.has(slug)) slug = makeSlug(input.title);

    const now = new Date().toISOString();
    const item: StoredItem = {
      id: doc.nextId,
      slug,
      title: input.title,
      description: input.description || "",
      type: input.type,
      tags: parseTags(input.tags),
      fileUrl: input.filename ?? null,
      originalName: input.originalName ?? null,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      projectUrl: input.projectUrl ?? null,
      coverUrl: input.coverFilename ?? null,
      createdAt: now,
      updatedAt: now,
    };
    doc.nextId += 1;
    doc.items.push(item);
    return item;
  });
  return toItem(created!);
}

export interface UpdateItemInput {
  title?: string;
  description?: string;
  type?: MediaType;
  tags?: string;
  projectUrl?: string | null;
}

export async function updateItem(id: number, input: UpdateItemInput): Promise<MediaItem | null> {
  const updated = await mutate((doc) => {
    const s = doc.items.find((i) => i.id === id);
    if (!s) return undefined;
    if (input.title !== undefined) s.title = input.title;
    if (input.description !== undefined) s.description = input.description;
    if (input.type !== undefined) s.type = input.type;
    if (input.tags !== undefined) s.tags = parseTags(input.tags);
    if (input.projectUrl !== undefined) s.projectUrl = input.projectUrl;
    s.updatedAt = new Date().toISOString();
    return { ...s };
  });
  return updated ? toItem(updated) : null;
}

/** Removes the item from the index and returns it (caller deletes its blobs). */
export async function deleteItem(id: number): Promise<MediaItem | null> {
  const removed = await mutate((doc) => {
    const idx = doc.items.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const [s] = doc.items.splice(idx, 1);
    return s;
  });
  return removed ? toItem(removed) : null;
}

/** True if any stored item references this blob URL (used before deleting orphan uploads). */
export async function isUrlReferenced(url: string): Promise<boolean> {
  const { doc } = await readDocFresh();
  return doc.items.some((i) => i.fileUrl === url || i.coverUrl === url);
}
