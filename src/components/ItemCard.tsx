"use client";

import { useState } from "react";
import Link from "next/link";
import type { MediaItem } from "@/lib/types";
import { fileUrl, formatBytes } from "@/lib/format";
import TagBadge from "./TagBadge";

const TYPE_LABEL: Record<string, string> = {
  image: "Image",
  video: "Video",
  gif: "GIF",
  pdf: "PDF",
  doc: "Doc",
  spreadsheet: "Sheet",
  project: "Project",
  other: "File",
};

function thumbSrc(item: MediaItem): string | null {
  if (item.coverFilename) return fileUrl(item.coverFilename);
  if (item.filename && (item.type === "image" || item.type === "gif")) {
    return fileUrl(item.filename);
  }
  return null;
}

function TypePlaceholder({ item }: { item: MediaItem }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-studio-muted">
      <span className="text-3xl opacity-70">
        {item.type === "video"
          ? "▶"
          : item.type === "pdf"
            ? "PDF"
            : item.type === "project"
              ? "◇"
              : "▣"}
      </span>
      <span className="text-xs uppercase tracking-wider">{TYPE_LABEL[item.type] || item.type}</span>
    </div>
  );
}

export default function ItemCard({ item }: { item: MediaItem }) {
  const thumb = thumbSrc(item);
  const [broken, setBroken] = useState(false);

  return (
    <Link
      href={`/i/${item.slug}`}
      className="studio-card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-studio-accent/30 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-studio-panel">
        {thumb && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={() => setBroken(true)}
          />
        ) : (
          <TypePlaceholder item={item} />
        )}
        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
          {TYPE_LABEL[item.type] || item.type}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-studio-text group-hover:text-white">
          {item.title}
        </h3>
        {item.description ? (
          <p className="line-clamp-2 text-xs text-studio-muted">{item.description}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {item.tags.slice(0, 3).map((t) => (
            <TagBadge key={t} tag={t} />
          ))}
        </div>
        {item.sizeBytes != null ? (
          <div className="text-[11px] text-studio-muted/80">{formatBytes(item.sizeBytes)}</div>
        ) : null}
      </div>
    </Link>
  );
}
