import type { Metadata } from "next";
import { merchConfig } from "@/lib/merch";

export const metadata: Metadata = {
  title: "Merch",
  description:
    "Studio merch — physical goods ship separately from digital downloads.",
};

export default function MerchPage() {
  const { storeUrl } = merchConfig;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-studio-accent">
          Merch
        </p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Merch
        </h1>
        <p className="max-w-2xl text-sm text-studio-muted sm:text-base">
          Physical goods from The Workshop - KrypticXtm. Merch ships separately from digital
          downloads in the Shop — checkout and fulfillment for apparel and
          prints happen through the merch store, not Buy Me A Coffee.
        </p>
      </section>

      <div className="studio-card overflow-hidden">
        <div className="relative flex min-h-[220px] flex-col items-center justify-center gap-5 px-6 py-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(245,208,0,0.16),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(255,176,32,0.12),transparent_50%)]" />
          <div className="relative z-[1] flex flex-col items-center gap-4">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-studio-accent/30 bg-studio-accent/10 text-2xl text-studio-accent"
              aria-hidden
            >
              ✦
            </span>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {storeUrl ? "Browse the merch store" : "Merch store coming soon"}
              </h2>
              <p className="max-w-md text-sm text-studio-muted">
                {storeUrl
                  ? "Jump over to the store for shirts, prints, and other physical gear."
                  : "Products will show up here soon. Check back for apparel, prints, and more."}
              </p>
            </div>
            {storeUrl ? (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="studio-btn-primary"
              >
                Browse merch store
              </a>
            ) : (
              <span className="rounded-full border border-studio-border bg-studio-panel/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-studio-muted">
                Coming soon
              </span>
            )}
          </div>
        </div>

        {/* Room for product grid later */}
        <div className="border-t border-studio-border/80 px-6 py-8">
          <p className="text-center text-xs uppercase tracking-[0.18em] text-studio-muted/70">
            No products listed yet
          </p>
        </div>
      </div>
    </div>
  );
}
