import Link from "next/link";

export default function NotFound() {
  return (
    <div className="studio-card mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-white">Not found</h1>
      <p className="mt-2 text-sm text-studio-muted">That page doesn&apos;t exist or has moved.</p>
      <Link href="/shop" className="studio-btn-primary mt-6 inline-flex">
        Back to the shop
      </Link>
    </div>
  );
}
