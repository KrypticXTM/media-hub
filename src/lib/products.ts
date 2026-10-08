/**
 * Shop catalog — edit this file to add or change products.
 * Tips / support go to Buy Me A Coffee (external link, no API/webhooks).
 */

export interface TipTier {
  /** Display label, e.g. "$5" */
  label: string;
  /** Display amount, e.g. "$5" */
  amount: string;
  /** External tip / support link for this amount */
  checkoutUrl: string;
}

export interface Product {
  id: string;
  title: string;
  /** Display price, e.g. "$1+" for tip jars */
  price: string;
  description: string;
  /** External tip / support link — used when tipTiers is empty */
  checkoutUrl: string;
  /** Button label on Shop / item page (default enjoyment CTA) when tipTiers is empty */
  ctaLabel?: string;
  /** Optional tip amounts — legacy multi-button row; prefer single Support us CTA */
  tipTiers?: TipTier[];
  /** Small badge on the card (omit to hide) */
  badge?: string;
  /** Support/tip product — drives three-layer CTA, hides price chip */
  tipJar?: boolean;
  /** Optional: show Tip on /i/[this-slug] */
  mediaSlug?: string;
  /** Optional: show Tip on item pages that have any of these tags */
  matchTags?: string[];
  /** Optional external app URL shown as an Open App / Launch button on Shop */
  appUrl?: string;
  /** Label for the appUrl button (default "Open App") */
  appLabel?: string;
  /** Optional cover image shown above the product (for example, /covers/lumina.jpg) */
  coverImage?: string;
  /** Optional YouTube video ID for an embed above the product */
  youtubeId?: string;
  /** Optional full YouTube URL (watch, youtu.be, or embed) — used if youtubeId is unset */
  youtubeUrl?: string;
  /**
   * Hide from the public site (shop grid, /shop/{slug} → 404, item-page "Available in Shop").
   * Data is kept; remove this flag to restore the product.
   */
  hidden?: boolean;
}

/** Shared Buy Me A Coffee page for every tip CTA. */
export const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/krypticxtm";

/** Prompt above the tip button. */
export const SUPPORT_CTA_ABOVE = "Did you enjoy this product?";

/** Short tip button label (keep compact so it does not wrap). */
export const SUPPORT_CTA_LABEL = "Support us here";

/** Subtext under the tip button. */
export const SUPPORT_CTA_SUBTEXT = "Any amount keeps us building.";

/** True for support/tip products (drives three-layer CTA). */
export function isTipJarProduct(product: Product): boolean {
  return Boolean(product.tipJar) || product.badge === "Tip jar" || Boolean(product.tipTiers?.length);
}

/** Checkout buttons for a product (single Support us / Tip CTA, or tipTiers if set). */
export function getCheckoutOptions(
  product: Product
): { label: string; href: string }[] {
  if (product.tipTiers && product.tipTiers.length > 0) {
    return product.tipTiers.map((t) => ({
      label: t.label,
      href: t.checkoutUrl,
    }));
  }
  return [
    {
      label: product.ctaLabel || SUPPORT_CTA_LABEL,
      href: product.checkoutUrl,
    },
  ];
}

/** Resolve a YouTube video ID from youtubeId or youtubeUrl. */
export function getYoutubeId(product: Product): string | null {
  if (product.youtubeId?.trim()) return product.youtubeId.trim();
  const url = product.youtubeUrl?.trim();
  if (!url) return null;

  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    const v = u.searchParams.get("v");
    if (v) return v;
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embed?.[1]) return embed[1];
    const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
    if (shorts?.[1]) return shorts[1];
  } catch {
    // bare ID-like string
    if (/^[\w-]{11}$/.test(url)) return url;
  }
  return null;
}

export const PRODUCTS: Product[] = [
  {
    id: "word-lightning-tip",
    title: "Word Lightning",
    price: "$1+",
    description:
      "A verbal fluency trainer focused on vocabulary and word recall.",
    checkoutUrl: BUY_ME_A_COFFEE_URL,
    ctaLabel: "Support us here",
    mediaSlug: "word-lightning",
    appUrl: "https://harbor-beacon-prism-swift.grok.me",
    tipJar: true,
    coverImage: "/covers/word-lightning.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=crHMzC-pJ7E",
  },
  {
    id: "lumina-tip",
    title: "LUMINA",
    price: "$1+",
    description:
      "A digital to-do list that keeps you motivated — and checks in if you stall.",
    checkoutUrl: BUY_ME_A_COFFEE_URL,
    ctaLabel: "Support us here",
    mediaSlug: "lumina",
    appUrl: "https://wind-rocket-nova-palm.grok.me",
    tipJar: true,
    coverImage: "/covers/lumina.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=0MQxT8WHCZI",
  },
  {
    id: "dumbbell-workout-test",
    title: "Dumbbell Workout (Test)",
    price: "$1+",
    description:
      "Full-body dumbbell PDF — test listing. Support opens Buy Me A Coffee.",
    checkoutUrl: BUY_ME_A_COFFEE_URL,
    ctaLabel: "Support us here",
    tipJar: true,
    matchTags: ["for-sale"],
    // Hidden from the public site for now — delete this line to restore.
    hidden: true,
  },
  {
    id: "active-projects",
    title: "Live Sticky Note Board & Active Project Manager",
    price: "$1+",
    description:
      "Optional tip to support the Active Projects Organizer HTML board. Opens Buy Me A Coffee — no paid download.",
    checkoutUrl: BUY_ME_A_COFFEE_URL,
    ctaLabel: "Support us here",
    tipJar: true,
    appUrl: "https://krypticxtm.github.io/active-projects.html",
    appLabel: "Launch",
    coverImage: "/covers/active-projects.jpg",
    youtubeUrl: "https://www.youtube.com/watch?v=XLOz1FfKAPk",
  },
];

/** Products visible on the public site (excludes `hidden: true`). */
export const PUBLIC_PRODUCTS: Product[] = PRODUCTS.filter((p) => !p.hidden);

/** Find a public tip / shop product linked to a library item (by slug or tag). */
export function findProductForItem(item: {
  slug: string;
  tags: string[];
}): Product | undefined {
  return PUBLIC_PRODUCTS.find((p) => {
    if (p.mediaSlug && p.mediaSlug === item.slug) return true;
    if (p.matchTags?.some((t) => item.tags.includes(t))) return true;
    return false;
  });
}

/** Clean kebab-case slug from arbitrary text (no random suffix). */
function kebab(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Stable shop URL slug for a product (/shop/{slug}).
 * Order: mediaSlug → id without trailing -tip / -test → kebab(title).
 */
export function getProductSlug(product: Product): string {
  if (product.mediaSlug?.trim()) return product.mediaSlug.trim();
  const fromId = kebab(product.id.replace(/-(tip|test)$/i, ""));
  if (fromId) return fromId;
  return kebab(product.title) || product.id;
}

/** Shop detail path for a product, e.g. /shop/lumina */
export function getProductPath(product: Product): string {
  return `/shop/${getProductSlug(product)}`;
}

/** All public product slugs (used for static params; hidden products 404). */
export const PRODUCT_SLUGS: string[] = PUBLIC_PRODUCTS.map(getProductSlug);

/** Look up a public product by its shop slug (hidden products are not found). */
export function findProductBySlug(slug: string): Product | undefined {
  let s = slug;
  try {
    s = decodeURIComponent(slug);
  } catch {
    // keep raw slug
  }
  s = s.toLowerCase();
  return PUBLIC_PRODUCTS.find((p) => getProductSlug(p) === s);
}
