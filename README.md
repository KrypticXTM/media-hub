# Media Hub

Personal studio library for images, videos, GIFs, PDFs, docs, spreadsheets, and project links.
Each item gets a stable public share URL like /i/your-slug so you can link it from X posts.

There is also a **Shop** page for digital products. Checkout is handled by Polar (a payment link opens in a new tab). No Polar API keys or webhooks are required for this simple setup.

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
- /shop — products for sale (Buy opens Polar checkout)
- /login — owner login
- /admin — upload files and add projects
- /i/studio-still-demo — example share page

## Shop + Polar (simple)

Products are listed in `src/lib/products.ts`. Each product has a title, price, description, and a `polarCheckoutUrl` from Polar’s dashboard (Share / Checkout link).

- The Shop page shows those products with a **Buy** button.
- Buy opens the Polar checkout URL in a new tab.
- Optional: if a library item’s slug matches `mediaSlug`, or it has a tag listed in `matchTags` (for example `for-sale`), the item detail page also shows a Buy button.

To add another product later: copy the existing entry in `src/lib/products.ts`, paste a new block, and fill in your Polar checkout URL.

This v1 does **not** use Polar webhooks or APIs — payment and delivery stay on Polar’s side.

## Environment variables

- ADMIN_PASSWORD (required) — password for the Login page
- SESSION_SECRET (required) — long random string that signs the session cookie
- NEXT_PUBLIC_SITE_NAME (optional) — title shown in the header

Do not commit .env.local (it is gitignored).

## Where data lives

- data/media.db — titles, tags, slugs, metadata
- data/uploads/ — the actual files (gitignored)
- src/lib/products.ts — shop catalog (edit by hand)

Comments in src/lib/storage.ts explain how to later swap local disk for S3, Cloudflare R2, or Vercel Blob.

## Free deploy notes (Vercel)

On free Vercel, the shop and browsing work, but owner uploads on the public URL won't stick; use a local PC or a paid disk host for lasting uploads.

## Main routes

- / — public library
- /shop — public shop (Polar Buy links)
- /i/[slug] — public item detail (preview, download, copy link; Buy if tagged for sale)
- /login — owner password form
- /admin — owner upload UI
- /api/files/[filename] — serves uploaded files
- /api/upload — owner file upload
- /api/items — library API

## Stack

Next.js App Router, TypeScript, Tailwind CSS, node:sqlite (DatabaseSync), HMAC-signed session cookie. Shop checkout via Polar hosted links.

## Troubleshooting

- Wrong password: fix ADMIN_PASSWORD in .env.local and restart the server
- Empty library: delete data/media.db and restart; demo items seed when the DB is empty
- node:sqlite missing: use Node.js 22.5+. No Visual Studio Build Tools needed on Windows.
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
