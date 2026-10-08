import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyLinkButton from "@/components/CopyLinkButton";
import FeedbackForm from "@/components/FeedbackForm";
import VideoLightbox from "@/components/VideoLightbox";
import {
  findProductBySlug,
  getCheckoutOptions,
  getProductPath,
  getProductSlug,
  getYoutubeId,
  isTipJarProduct,
  PRODUCT_SLUGS,
  SUPPORT_CTA_ABOVE,
  SUPPORT_CTA_SUBTEXT,
} from "@/lib/products";

type Props = { params: Promise<{ slug: string }> };

/** Only known product slugs exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) return { title: "Not found" };
  const description = product.description;
  return {
    title: product.title,
    description,
    alternates: { canonical: getProductPath(product) },
    openGraph: {
      title: `${product.title} · The Workshop - KrypticXtm`,
      description,
      url: getProductPath(product),
      images: product.coverImage ? [{ url: product.coverImage }] : undefined,
    },
    twitter: {
      card: product.coverImage ? "summary_large_image" : "summary",
      title: product.title,
      description,
      images: product.coverImage ? [product.coverImage] : undefined,
    },
  };
}

const freePillClass =
  "shrink-0 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200";

export default async function ShopProductPage({ params }: Props) {
  const { slug } = await params;
  const product = findProductBySlug(slug);
  if (!product) notFound();

  const productSlug = getProductSlug(product);
  const path = getProductPath(product);
  const youtubeId = getYoutubeId(product);
  const isTipJar = isTipJarProduct(product);
  const options = getCheckoutOptions(product);
  const projectTitle = product.mediaSlug
    ? product.title.replace(/\s+Tip$/i, "").trim() || product.title
    : product.title;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link
        href="/shop"
        className="inline-block text-sm text-studio-muted hover:text-studio-accent"
      >
        ← Back to Shop
      </Link>

      {/* Full-width title + description */}
      <div className="space-y-2">
        {product.badge ? (
          <span className="inline-block rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/80">
            {product.badge}
          </span>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {product.title}
          </h1>
          {!product.appUrl ? <span className={freePillClass}>Free</span> : null}
        </div>
        <p className="max-w-3xl text-studio-muted">{product.description}</p>
        {!isTipJar ? (
          <p className="text-lg font-semibold text-white">{product.price}</p>
        ) : null}
      </div>

      {/* Media | CTAs — tops align */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="studio-card relative aspect-video w-full overflow-hidden bg-studio-panel">
          {youtubeId ? (
            <VideoLightbox youtubeId={youtubeId} coverImage={product.coverImage} title={product.title} />
          ) : product.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.coverImage}
              alt={`${product.title} cover art`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-studio-panel via-studio-card to-studio-panel px-4 text-center">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(245,208,0,0.14),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(255,176,32,0.10),transparent_50%)]" />
              <span className="relative z-[1] text-3xl opacity-70" aria-hidden>
                ▶
              </span>
              <span className="relative z-[1] text-sm font-medium text-studio-muted">
                Demo video coming soon
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="studio-card flex flex-col gap-3 p-4">
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
                <span className={freePillClass}>Free</span>
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

            <div className="flex flex-wrap items-center gap-2 border-t border-studio-border/60 pt-3">
              <CopyLinkButton path={path} />
              <Link href="/shop" className="studio-btn-ghost shrink-0">
                View all products
              </Link>
            </div>
          </div>

          <FeedbackForm projectTitle={projectTitle} projectSlug={productSlug} compact />
        </div>
      </div>
    </div>
  );
}
