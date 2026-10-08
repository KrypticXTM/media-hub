"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "The Workshop - KrypticXtm";

function navClass(active: boolean) {
  return `studio-btn-ghost !px-3 !py-2 text-xs sm:text-sm ${
    active ? "border-studio-accent/40 text-studio-accent" : ""
  }`;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setAuthed(!!d.authenticated))
      .catch(() => setAuthed(false));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthed(false);
    router.push("/shop");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-studio-border/80 bg-studio-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/shop" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-studio-accent to-studio-accent2 text-sm font-bold text-studio-bg shadow-glow">
            K
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight text-studio-text group-hover:text-white">
              {siteName}
            </div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-studio-muted">
              KrypticXtm
            </div>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          <Link href="/shop" className={navClass(pathname === "/shop" || pathname.startsWith("/shop/"))}>
            Shop
          </Link>
          <Link href="/library" className={navClass(pathname === "/library" || pathname.startsWith("/i/"))}>
            Library
          </Link>
          <Link href="/merch" className={navClass(pathname === "/merch" || pathname.startsWith("/merch/"))}>
            Merch
          </Link>
          {authed ? (
            <>
              <Link href="/admin" className={navClass(pathname === "/admin")}>
                Admin
              </Link>
              <button type="button" onClick={logout} className="studio-btn-ghost !px-3 !py-2 text-xs sm:text-sm">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="studio-btn-primary !px-3 !py-2 text-xs sm:text-sm">
              Owner login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
