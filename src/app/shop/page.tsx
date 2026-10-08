import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { PUBLIC_PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop",
  description: "Digital products from The Workshop - KrypticXtm — support via Buy Me A Coffee.",
};

export default function ShopPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-studio-accent">Shop</p>
        <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Digital goods from The Workshop - KrypticXtm
        </h1>
        <p className="max-w-2xl text-sm text-studio-muted sm:text-base">
          Browse digital goods from The Workshop - KrypticXtm. Tips and support go through Buy Me A Coffee —
          you will leave this site for a secure payment page.
        </p>
      </section>

      {PUBLIC_PRODUCTS.length === 0 ? (
        <div className="studio-card px-6 py-16 text-center">
          <p className="text-studio-muted">Nothing in the shop yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
