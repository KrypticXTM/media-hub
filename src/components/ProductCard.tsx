import Link from "next/link";
import FeedbackForm from "@/components/FeedbackForm";
import PlayBadge, { WatchDemoChip } from "@/components/PlayBadge";
import type { Product } from "@/lib/products";
import {
  getCheckoutOptions,
  getProductPath,
  getProductSlug,
  getYoutubeId,
  isTipJarProduct,
  SUPPORT_CTA_ABOVE,
  SUPPORT_CTA_SUBTEXT,
} from "@/lib/products";

const freePillClass =
  "shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200";

export default function ProductCard({ product }: { product: Product }) {
  const youtubeId = getYoutubeId(product);
  const options = getCheckoutOptions(product);
  const projectSlug = getProductSlug(product);
  const productPath = getProductPath(product);
  // Prefer a clean project name for tip jars (e.g. "Word Lightning Tip" → "Word Lightning")
  const projectTitle = product.mediaSlug
    ? product.title.replace(/\s+Tip$/i, "").trim() || product.title
    : product.title;
  const isTipJar = isTipJarProduct(product);
  const freePill = <span className={freePillClass}>Free</span>;

  return (
    <article className="studio-card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-studio-accent/30 hover:shadow-glow">
      {/* Media: cover always links to the product page; video products get a visual play hint. */}
      <div className="relative aspect-video w-full overflow-hidden bg-studio-panel">
        {product.coverImage || youtubeId ? (
          <Link
            href={productPath}
            aria-label={youtubeId ? `View ${product.title} (has demo video)` : `View ${product.title}`}
            className="group block h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.coverImage || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
              alt={`${product.title} cover art`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
            {youtubeId ? (
              <>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <PlayBadge size="sm" />
                </span>
                <WatchDemoChip />
              </>
            ) : null}
          </Link>
        ) : (
          <Link
            href={productPath}
            aria-label={`View ${product.title}`}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-studio-panel via-studio-card to-studio-panel px-4 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(245,208,0,0.14),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(255,176,32,0.10),transparent_50%)]" />
            <span className="relative z-[1] text-2xl opacity-70" aria-hidden>
              ▶
            </span>
            <span className="relative z-[1] text-sm font-medium text-studio-muted">
              Demo video coming soon
            </span>
          </Link>
        )}
        {!isTipJar ? (
          <span className="pointer-events-none absolute right-3 top-3 z-[1] rounded-full border border-studio-accent/30 bg-studio-accent/15 px-2.5 py-0.5 text-xs font-semibold text-studio-accent backdrop-blur">
            {product.price}
          </span>
        ) : null}
      </div>

      {/* Under: product info + Support / tip CTA */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-2">
          {product.badge ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/80">
                {product.badge}
              </span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-studio-text">
              <Link
                href={productPath}
                className="transition hover:text-studio-accent focus-visible:text-studio-accent"
              >
                {product.title}
              </Link>
            </h2>
            {!product.appUrl ? freePill : null}
          </div>
          <p className="text-sm leading-relaxed text-studio-muted">{product.description}</p>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-2">
          {!isTipJar ? (
            <span className="text-lg font-semibold text-white">{product.price}</span>
          ) : null}
          {product.appUrl ? (
            <div className="flex items-center gap-2">
              <a
                href={product.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="studio-btn-primary shrink-0"
              >
                {product.appLabel || "Open App"}
              </a>
              {freePill}
            </div>
          ) : null}
          {options.length > 0 ? (
            <div className="flex flex-col gap-1">
              {isTipJar ? (
                <p className="text-xs font-medium text-studio-muted">{SUPPORT_CTA_ABOVE}</p>
              ) : null}
              {options.map((opt) => (
                <a
                  key={opt.label}
                  href={opt.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="studio-btn-primary shrink-0 self-start whitespace-nowrap"
                >
                  {opt.label}
                </a>
              ))}
              {isTipJar ? (
                <p className="text-xs text-studio-muted">{SUPPORT_CTA_SUBTEXT}</p>
              ) : null}
            </div>
          ) : null}

          <FeedbackForm
            projectTitle={projectTitle}
            projectSlug={projectSlug}
            compact
          />
        </div>
      </div>
    </article>
  );
}
