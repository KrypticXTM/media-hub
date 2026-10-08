import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyLinkButton from "@/components/CopyLinkButton";
import DeleteButton from "@/components/DeleteButton";
import FeedbackForm from "@/components/FeedbackForm";
import ItemPreview from "@/components/ItemPreview";
import TagBadge from "@/components/TagBadge";
import { isAuthenticated } from "@/lib/auth";
import { getItemBySlug } from "@/lib/db";
import { fileUrl, formatBytes, formatDate, sharePath } from "@/lib/format";
import { findProductForItem, getCheckoutOptions, isTipJarProduct, SUPPORT_CTA_ABOVE, SUPPORT_CTA_SUBTEXT } from "@/lib/products";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.title,
    description: item.description || undefined,
  };
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const item = getItemBySlug(slug);
  if (!item) notFound();
  const authed = await isAuthenticated();
  const path = sharePath(item.slug);
  const product = findProductForItem(item);
  const isTipJar = product ? isTipJarProduct(product) : false;
  const checkoutOptions = product ? getCheckoutOptions(product) : [];
  const showFeedback = item.type === "project" || Boolean(product);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-studio-muted">
        <Link href="/library" className="hover:text-studio-accent">
          ← Library
        </Link>
        <span>·</span>
        <span className="uppercase tracking-wider">{item.type}</span>
        <span>·</span>
        <span>{formatDate(item.createdAt)}</span>
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{item.title}</h1>
        {item.description ? (
          <p className="max-w-3xl text-studio-muted">{item.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {item.tags.map((t) => (
            <TagBadge key={t} tag={t} href={`/?tag=${encodeURIComponent(t)}`} />
          ))}
        </div>
      </div>

      {product ? (
        <div className="studio-card flex flex-col gap-3 border-studio-accent/25 bg-gradient-to-r from-studio-accent/10 to-studio-accent2/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-studio-accent">
              Available in Shop
            </p>
            <p className="text-sm text-studio-text">
              {product.title}{isTipJar ? null : (
                <> · <span className="font-semibold text-white">{product.price}</span></>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {checkoutOptions.length > 0 ? (
              <div className="flex flex-col gap-1">
                {isTipJar ? (
                  <p className="text-xs font-medium text-studio-muted">{SUPPORT_CTA_ABOVE}</p>
                ) : null}
                {checkoutOptions.map((opt) => (
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
            <Link href="/shop" className="studio-btn-ghost shrink-0">
              View Shop
            </Link>
          </div>
        </div>
      ) : null}

      <ItemPreview item={item} />

      <div className="studio-card flex flex-col gap-4 p-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-studio-muted">
          {item.originalName ? (
            <div>
              File: <span className="font-mono text-studio-text">{item.originalName}</span>
              {item.sizeBytes != null ? ` · ${formatBytes(item.sizeBytes)}` : ""}
            </div>
          ) : null}
          <div className="font-mono text-xs">Share path: {path}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyLinkButton path={path} />
          {item.filename ? (
            <a href={fileUrl(item.filename, true)} className="studio-btn-primary">
              Download
            </a>
          ) : null}
          {item.type === "project" && item.projectUrl ? (
            <>
              <a
                href={item.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="studio-btn-primary"
              >
                Open App
              </a>
              {product ? (
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
                  Free
                </span>
              ) : null}
            </>
          ) : null}
          {authed ? <DeleteButton id={item.id} title={item.title} /> : null}
        </div>
      </div>

      {showFeedback ? (
        <FeedbackForm projectTitle={item.title} projectSlug={item.slug} />
      ) : null}
    </div>
  );
}
