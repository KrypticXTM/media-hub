"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { MEDIA_TYPES } from "@/lib/types";

export default function SearchFilters({ tags }: { tags: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") || "");

  const type = params.get("type") || "all";
  const tag = params.get("tag") || "";

  const push = useCallback(
    (next: Record<string, string>) => {
      const sp = new URLSearchParams();
      const merged = {
        q: next.q !== undefined ? next.q : q,
        type: next.type !== undefined ? next.type : type,
        tag: next.tag !== undefined ? next.tag : tag,
      };
      if (merged.q) sp.set("q", merged.q);
      if (merged.type && merged.type !== "all") sp.set("type", merged.type);
      if (merged.tag) sp.set("tag", merged.tag);
      startTransition(() => {
        router.push(sp.toString() ? `/library?${sp}` : "/library");
      });
    },
    [q, type, tag, router]
  );

  return (
    <div className="studio-card space-y-4 p-4 sm:p-5">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          push({ q });
        }}
      >
        <input
          className="studio-input flex-1"
          placeholder="Search title, description, tags, filename…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="studio-btn-primary" disabled={pending}>
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => push({ type: "all" })}
          className={`rounded-full px-3 py-1 text-xs transition ${
            type === "all"
              ? "bg-studio-accent text-studio-bg"
              : "border border-studio-border text-studio-muted hover:text-studio-text"
          }`}
        >
          All
        </button>
        {MEDIA_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => push({ type: t.value })}
            className={`rounded-full px-3 py-1 text-xs transition ${
              type === t.value
                ? "bg-studio-accent text-studio-bg"
                : "border border-studio-border text-studio-muted hover:text-studio-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-studio-border pt-3">
          <span className="text-xs text-studio-muted">Tags:</span>
          <button
            type="button"
            onClick={() => push({ tag: "" })}
            className={`rounded-full px-2.5 py-0.5 text-xs ${
              !tag ? "text-studio-accent" : "text-studio-muted hover:text-studio-text"
            }`}
          >
            any
          </button>
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => push({ tag: t })}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                tag === t
                  ? "border-studio-accent/50 text-studio-accent"
                  : "border-studio-border text-studio-muted hover:text-studio-text"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
