import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Workshop - KrypticXtm";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://media-hub-lyart.vercel.app");

// Site-wide Open Graph / Twitter Card defaults (pages with their own openGraph/twitter override these).
const shareUrl = "https://media-hub-lyart.vercel.app";
const shareTitle = "The Workshop - KrypticXtm";
const shareDescription = "Apps and pages I built with Grok and Grokbot. Explore The Workshop.";
const shareImage = `${shareUrl}/covers/active-projects.jpg`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description:
    "The Workshop - KrypticXtm — media library and shop for digital products (support via Buy Me A Coffee).",
  openGraph: {
    type: "website",
    siteName: shareTitle,
    title: shareTitle,
    description: shareDescription,
    url: `${shareUrl}/`,
    images: [{ url: shareImage, width: 1280, height: 720, alt: shareTitle }],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [shareImage],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-studio-muted sm:px-6">
          The Workshop - KrypticXtm · Library + Shop · Share links look like{" "}
          <span className="font-mono text-studio-muted/90">/i/your-slug</span>
        </footer>
      </body>
    </html>
  );
}
