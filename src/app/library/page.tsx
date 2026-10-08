import { Suspense } from "react";
import ItemCard from "@/components/ItemCard";
import SearchFilters from "@/components/SearchFilters";
import { getAllTags, listItems } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const items = listItems({ q: sp.q, type: sp.type, tag: sp.tag });
  const tags = getAllTags();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-studio-accent">Library</p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Everything in one place
        </h1>
        <p className="max-w-2xl text-sm text-studio-muted sm:text-base">
          Browse images, videos, PDFs, docs, and projects. Each item has a stable share link you can
          drop into an X post.
        </p>
      </section>

      <Suspense fallback={<div className="studio-card h-28 animate-pulse" />}>
        <SearchFilters tags={tags} />
      </Suspense>

      {items.length === 0 ? (
        <div className="studio-card px-6 py-16 text-center">
          <p className="text-studio-muted">No items match. Try clearing filters or upload something from Admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
