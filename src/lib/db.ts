import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import type { MediaItem, MediaItemRow, MediaType } from "./types";
import { ensureUploadDir } from "./storage";

const DATA_DIR =
  process.env.VERCEL || process.env.DATA_DIR
    ? path.join(process.env.DATA_DIR || "/tmp", "media-hub")
    : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "media.db");

let dbInstance: DatabaseSync | null = null;

function rowToItem(row: MediaItemRow): MediaItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description || "",
    type: row.type,
    tags: row.tags
      ? row.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    filename: row.filename,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    projectUrl: row.project_url,
    coverFilename: row.cover_filename,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  ensureUploadDir();

  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS media_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '',
      filename TEXT,
      original_name TEXT,
      mime_type TEXT,
      size_bytes INTEGER,
      project_url TEXT,
      cover_filename TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(type);
    CREATE INDEX IF NOT EXISTS idx_media_slug ON media_items(slug);
  `);

  dbInstance = db;

  // Demo/sample items are no longer seeded; remove any left over from older builds.
  db.prepare(
    "DELETE FROM media_items WHERE slug IN ('studio-still-demo','welcome-notes-demo','sample-pdf-demo','shape-morph-demo')"
  ).run();

  // Always ensure featured Grok Build apps exist (existing DBs + redeploys)
  ensureWordLightning(db);
  ensureLumina(db);

  return db;
}


// Static public asset (bundled with the deploy) — not /tmp uploads
const WORD_LIGHTNING_COVER = "/covers/word-lightning.jpg";
const WORD_LIGHTNING_SLUG = "word-lightning";

/** Upsert the Library project card. Cover is served from public/covers (Vercel-safe). */
function ensureWordLightning(db: DatabaseSync): void {
  const fields = {
    slug: WORD_LIGHTNING_SLUG,
    title: "Word Lightning",
    description:
      "A Grok Build app for verbal fluency. Open the live app from The Workshop - KrypticXtm.",
    type: "project",
    tags: "app,grok-build,word-lightning",
    filename: null as string | null,
    original_name: null as string | null,
    mime_type: null as string | null,
    size_bytes: null as number | null,
    project_url: "https://harbor-beacon-prism-swift.grok.me",
    cover_filename: WORD_LIGHTNING_COVER,
  };

  const existing = db
    .prepare("SELECT id FROM media_items WHERE slug = ?")
    .get(WORD_LIGHTNING_SLUG) as unknown as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE media_items SET
        title = @title,
        description = @description,
        type = @type,
        tags = @tags,
        filename = @filename,
        original_name = @original_name,
        mime_type = @mime_type,
        size_bytes = @size_bytes,
        project_url = @project_url,
        cover_filename = @cover_filename,
        updated_at = datetime('now')
       WHERE slug = @slug`
    ).run(fields);
  } else {
    db.prepare(
      `INSERT INTO media_items
        (slug, title, description, type, tags, filename, original_name, mime_type, size_bytes, project_url, cover_filename)
       VALUES
        (@slug, @title, @description, @type, @tags, @filename, @original_name, @mime_type, @size_bytes, @project_url, @cover_filename)`
    ).run(fields);
  }
}


const LUMINA_SLUG = "lumina";
const LUMINA_COVER = "/covers/lumina.jpg";

/** Upsert the LUMINA to-do Library project card (Grok Build). Cover is served from public/covers (Vercel-safe). */
function ensureLumina(db: DatabaseSync): void {
  const fields = {
    slug: LUMINA_SLUG,
    title: "LUMINA",
    description:
      "A holographic to-do list from Grok Build. Clocks optional — she checks in if you stall.",
    type: "project",
    tags: "app,grok-build,todo,lumina",
    filename: null as string | null,
    original_name: null as string | null,
    mime_type: null as string | null,
    size_bytes: null as number | null,
    project_url: "https://wind-rocket-nova-palm.grok.me",
    cover_filename: LUMINA_COVER,
  };

  const existing = db
    .prepare("SELECT id FROM media_items WHERE slug = ?")
    .get(LUMINA_SLUG) as unknown as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE media_items SET
        title = @title,
        description = @description,
        type = @type,
        tags = @tags,
        filename = @filename,
        original_name = @original_name,
        mime_type = @mime_type,
        size_bytes = @size_bytes,
        project_url = @project_url,
        cover_filename = @cover_filename,
        updated_at = datetime('now')
       WHERE slug = @slug`
    ).run(fields);
  } else {
    db.prepare(
      `INSERT INTO media_items
        (slug, title, description, type, tags, filename, original_name, mime_type, size_bytes, project_url, cover_filename)
       VALUES
        (@slug, @title, @description, @type, @tags, @filename, @original_name, @mime_type, @size_bytes, @project_url, @cover_filename)`
    ).run(fields);
  }
}

// Kept for reference; not called.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function seedDemoItems(db: DatabaseSync): void {
  const insert = db.prepare(`
    INSERT INTO media_items
      (slug, title, description, type, tags, filename, original_name, mime_type, size_bytes, project_url, cover_filename)
    VALUES
      (@slug, @title, @description, @type, @tags, @filename, @original_name, @mime_type, @size_bytes, @project_url, @cover_filename)
  `);

  // Tiny SVG placeholders written into uploads so previews work out of the box
  const uploads = path.join(DATA_DIR, "uploads");
  const svg = (label: string, color: string) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}"/><stop offset="100%" stop-color="#1a1f2e"/>
        </linearGradient></defs>
        <rect width="800" height="500" fill="url(#g)"/>
        <text x="50%" y="48%" text-anchor="middle" fill="#e8ecf4" font-family="system-ui,sans-serif" font-size="36" font-weight="600">${label}</text>
        <text x="50%" y="58%" text-anchor="middle" fill="#8b95a8" font-family="system-ui,sans-serif" font-size="18">Demo placeholder</text>
      </svg>`
    );

  const demoFiles: { name: string; buf: Buffer }[] = [
    { name: "demo-studio.svg", buf: svg("Studio Still", "#8a7010") },
    { name: "demo-cover.svg", buf: svg("Project Cover", "#a67c18") },
    {
      name: "demo-notes.txt",
      buf: Buffer.from(
        "Welcome to The Workshop - KrypticXtm.\nReplace this demo file anytime from the Admin page.\n"
      ),
    },
  ];
  for (const f of demoFiles) {
    fs.writeFileSync(path.join(uploads, f.name), f.buf);
  }

  // Minimal valid PDF (one blank page) so PDF embed demo works
  const pdf = Buffer.from(
    `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 68 >>stream
BT /F1 24 Tf 72 720 Td (Demo PDF — The Workshop - KrypticXtm) Tj ET
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000385 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
462
%%EOF
`
  );
  fs.writeFileSync(path.join(uploads, "demo-sheet.pdf"), pdf);

  const demos = [
    {
      slug: "studio-still-demo",
      title: "Studio Still (Demo)",
      description:
        "A placeholder image so the library is not empty on first launch. Replace or delete anytime.",
      type: "image",
      tags: "demo,studio,photo",
      filename: "demo-studio.svg",
      original_name: "studio-still.svg",
      mime_type: "image/svg+xml",
      size_bytes: demoFiles[0].buf.length,
      project_url: null,
      cover_filename: null,
    },
    {
      slug: "welcome-notes-demo",
      title: "Welcome Notes (Demo)",
      description:
        "A sample text document. Upload real docs, PDFs, and spreadsheets from Admin.",
      type: "doc",
      tags: "demo,notes",
      filename: "demo-notes.txt",
      original_name: "welcome-notes.txt",
      mime_type: "text/plain",
      size_bytes: demoFiles[2].buf.length,
      project_url: null,
      cover_filename: null,
    },
    {
      slug: "sample-pdf-demo",
      title: "Sample PDF (Demo)",
      description: "A tiny demo PDF with an embedded preview on its share page.",
      type: "pdf",
      tags: "demo,pdf",
      filename: "demo-sheet.pdf",
      original_name: "sample.pdf",
      mime_type: "application/pdf",
      size_bytes: pdf.length,
      project_url: null,
      cover_filename: null,
    },
    {
      slug: "shape-morph-demo",
      title: "Shape Morph (Demo Project)",
      description:
        "Example of an app/project entry — link out to a live URL with an optional cover image.",
      type: "project",
      tags: "demo,app,project",
      filename: null,
      original_name: null,
      mime_type: null,
      size_bytes: null,
      project_url: "https://example.com",
      cover_filename: "demo-cover.svg",
    },
  ];

  db.exec("BEGIN");
  try {
    for (const d of demos) insert.run(d);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

export interface ListFilters {
  q?: string;
  type?: string;
  tag?: string;
}

export function listItems(filters: ListFilters = {}): MediaItem[] {
  const db = getDb();
  let sql = "SELECT * FROM media_items WHERE 1=1";
  const params: Record<string, string> = {};

  if (filters.type && filters.type !== "all") {
    sql += " AND type = @type";
    params.type = filters.type;
  }
  if (filters.tag) {
    sql += " AND (',' || lower(tags) || ',') LIKE @tag";
    params.tag = `%,${filters.tag.toLowerCase()},%`;
  }
  if (filters.q) {
    sql += ` AND (
      lower(title) LIKE @q OR
      lower(description) LIKE @q OR
      lower(tags) LIKE @q OR
      lower(COALESCE(original_name,'')) LIKE @q OR
      lower(COALESCE(filename,'')) LIKE @q
    )`;
    params.q = `%${filters.q.toLowerCase()}%`;
  }

  sql += " ORDER BY datetime(created_at) DESC, id DESC";
  const rows = db.prepare(sql).all(params) as unknown as MediaItemRow[];
  return rows.map(rowToItem);
}

export function getItemBySlug(slug: string): MediaItem | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM media_items WHERE slug = ?").get(slug) as unknown as MediaItemRow | undefined;
  return row ? rowToItem(row) : null;
}

export function getItemById(id: number): MediaItem | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM media_items WHERE id = ?").get(id) as unknown as MediaItemRow | undefined;
  return row ? rowToItem(row) : null;
}

export function getAllTags(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT tags FROM media_items").all() as unknown as { tags: string }[];
  const set = new Set<string>();
  for (const r of rows) {
    for (const t of r.tags.split(",")) {
      const trimmed = t.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export interface CreateItemInput {
  slug: string;
  title: string;
  description?: string;
  type: MediaType;
  tags?: string;
  filename?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  projectUrl?: string | null;
  coverFilename?: string | null;
}

export function createItem(input: CreateItemInput): MediaItem {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO media_items
        (slug, title, description, type, tags, filename, original_name, mime_type, size_bytes, project_url, cover_filename)
       VALUES
        (@slug, @title, @description, @type, @tags, @filename, @original_name, @mime_type, @size_bytes, @project_url, @cover_filename)`
    )
    .run({
      slug: input.slug,
      title: input.title,
      description: input.description || "",
      type: input.type,
      tags: input.tags || "",
      filename: input.filename ?? null,
      original_name: input.originalName ?? null,
      mime_type: input.mimeType ?? null,
      size_bytes: input.sizeBytes ?? null,
      project_url: input.projectUrl ?? null,
      cover_filename: input.coverFilename ?? null,
    });
  return getItemById(Number(info.lastInsertRowid))!;
}

export interface UpdateItemInput {
  title?: string;
  description?: string;
  type?: MediaType;
  tags?: string;
  projectUrl?: string | null;
}

export function updateItem(id: number, input: UpdateItemInput): MediaItem | null {
  const db = getDb();
  const existing = getItemById(id);
  if (!existing) return null;

  db.prepare(
    `UPDATE media_items SET
      title = @title,
      description = @description,
      type = @type,
      tags = @tags,
      project_url = @project_url,
      updated_at = datetime('now')
     WHERE id = @id`
  ).run({
    id,
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    type: input.type ?? existing.type,
    tags: input.tags ?? existing.tags.join(","),
    project_url: input.projectUrl !== undefined ? input.projectUrl : existing.projectUrl,
  });

  return getItemById(id);
}

export function deleteItem(id: number): MediaItem | null {
  const db = getDb();
  const existing = getItemById(id);
  if (!existing) return null;
  db.prepare("DELETE FROM media_items WHERE id = ?").run(id);
  return existing;
}
