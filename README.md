# The Workshop - KrypticXtm

Personal studio library for images, videos, GIFs, PDFs, docs, spreadsheets, and project links.
Each item gets a stable public share URL like /i/your-slug so you can link it from X posts.

There is also a **Shop** page for digital products. Checkout is handled by Polar (a payment link opens in a new tab). No Polar API keys or webhooks are required for this simple setup.

**Merch** (`/merch`) is for physical goods and ships separately from digital downloads in the Shop. Set `storeUrl` in `src/lib/merch.ts` when an external store is ready. Shop product cards use an over/under layout: optional YouTube demo (`youtubeId` / `youtubeUrl` in `src/lib/products.ts`) on top, product info + Polar Buy below (placeholder if no video yet).

Visitors browse freely. Only the owner (password login) can upload or delete.

## Quick start

1. Install Node.js 22.5+ from https://nodejs.org (Node 24 recommended)
2. Open a terminal in this project folder
3. Copy env example: cp .env.example .env.local
4. Edit .env.local and set ADMIN_PASSWORD and SESSION_SECRET
5. Install packages, then start the dev server (see package.json scripts: install / dev / build / start)
6. Open http://localhost:3000

Useful URLs:
- / — library home (search + type/tag filters)
- /shop — digital products for sale (Buy opens Polar checkout)
- /merch — physical merch (external store or coming soon)
- /login — owner login
- /admin — upload files and add projects
- /i/studio-still-demo — example share page

## Shop + Polar (simple)

Products are listed in `src/lib/products.ts`. Each product has a title, price, description, and a `polarCheckoutUrl` from Polar’s dashboard (Share / Checkout link).

- The Shop page shows those products with a **Buy** button.
- Buy opens the Polar checkout URL in a new tab.
- Optional: set `youtubeId` or `youtubeUrl` for a demo embed above the product; otherwise a “Demo video coming soon” panel keeps the over/under layout.
- Optional: if a library item’s slug matches `mediaSlug`, or it has a tag listed in `matchTags` (for example `for-sale`), the item detail page also shows a Buy button.

To add another product later: copy the existing entry in `src/lib/products.ts`, paste a new block, and fill in your Polar checkout URL.

This v1 does **not** use Polar webhooks or APIs — payment and delivery stay on Polar’s side.

## Merch

Config lives in `src/lib/merch.ts`. Leave `storeUrl` as `null` for a friendly coming-soon state, or set it to an external shop URL to show a **Browse merch store** CTA. Physical merch fulfillment is separate from Shop / Polar digital downloads.

## Environment variables

- ADMIN_PASSWORD (required) — password for the Login page
- SESSION_SECRET (required) — long random string that signs the session cookie
- NEXT_PUBLIC_SITE_NAME (optional) — title shown in the header (default: The Workshop - KrypticXtm)
- BLOB_READ_WRITE_TOKEN (required for uploads) — Vercel Blob token. Set automatically on Vercel because the `workshop-library` Blob store is connected to the project; locally run `npx vercel env pull .env.local`. Without it the Library still shows the built-in items, and Admin shows a "File storage is not configured" notice.

Do not commit .env.local (it is gitignored).

## Where data lives

Library data lives in the Vercel Blob store `workshop-library` (free Hobby tier), so uploads survive cold starts and redeploys:

- library/files/… and library/covers/… — uploaded files (public blobs; browsers load them straight from Blob)
- library/items.json — the Library item list (titles, tags, slugs, file URLs, dates). library/index/<md5>.json is an immutable copy of the current version used for always-fresh reads (see src/lib/db.ts)
- Word Lightning and LUMINA are defined in code (src/lib/db.ts, covers in public/covers) and merged in at read time
- src/lib/products.ts — shop catalog (edit by hand)
- src/lib/merch.ts — merch store URL config

Uploads go straight from the browser to Blob (client uploads), so files up to 100 MB work even though Vercel functions cap request bodies at ~4.5 MB. Deleting an item also deletes its file.

## Free deploy notes (Vercel)

Everything runs on free Vercel features. Vercel Blob on Hobby includes 1 GB storage, 10,000 simple operations, 2,000 advanced operations (uploads) and 10 GB data transfer per month; if a limit is exceeded Blob pauses until the 30-day window resets (no charges). See https://vercel.com/docs/vercel-blob/usage-and-pricing

## Main routes

- / — redirects to /shop
- /library — public library
- /shop — public shop (Polar Buy links)
- /merch — public merch (external store or coming soon)
- /i/[slug] — public item detail (preview, download, copy link; Buy if tagged for sale)
- /login — owner password form
- /admin — owner upload UI
- /api/upload — owner-only: issues Vercel Blob client-upload tokens (and removes orphaned uploads)
- /api/items, /api/items/[id] — library API (list, create, edit, delete)

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Vercel Blob (@vercel/blob), HMAC-signed session cookie. Shop checkout via Polar hosted links.

## Troubleshooting

- Wrong password: fix ADMIN_PASSWORD in .env.local and restart the server
- "File storage is not configured" in Admin: BLOB_READ_WRITE_TOKEN is missing — run `npx vercel env pull .env.local` and restart
- Shop Buy link wrong: edit polarCheckoutUrl in src/lib/products.ts and restart / rebuild

## Exact commands

```
npm install
npm run dev
```

Build for production:

```
npm run build
npm start
```
