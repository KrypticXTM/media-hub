"use client";

import { useState } from "react";
import type { MediaItem } from "@/lib/types";
import { fileUrl } from "@/lib/format";

function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className="flex aspect-video items-center justify-center bg-studio-panel text-studio-muted">
        Project
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="max-h-[480px] w-full object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export default function ItemPreview({ item }: { item: MediaItem }) {
  if (item.type === "project") {
    const cover = item.coverFilename ? fileUrl(item.coverFilename) : null;
    return (
      <div className="studio-card overflow-hidden">
        {cover ? (
          <CoverImage src={cover} alt={item.title} />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-studio-panel text-studio-muted">
            Project
          </div>
        )}
      </div>
    );
  }

  if (!item.filename) {
    return (
      <div className="studio-card flex aspect-video items-center justify-center text-studio-muted">
        No file attached
      </div>
    );
  }

  const src = fileUrl(item.filename);

  if (item.type === "image" || item.type === "gif" || item.mimeType?.startsWith("image/")) {
    return (
      <div className="studio-card overflow-hidden p-2 sm:p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={item.title} className="mx-auto max-h-[70vh] w-auto rounded-xl object-contain" />
      </div>
    );
  }

  if (item.type === "video" || item.mimeType?.startsWith("video/")) {
    return (
      <div className="studio-card overflow-hidden">
        <video src={src} controls className="aspect-video w-full bg-black" preload="metadata" />
      </div>
    );
  }

  if (item.type === "pdf" || item.mimeType === "application/pdf") {
    return (
      <div className="studio-card overflow-hidden">
        <iframe title={item.title} src={src} className="h-[75vh] w-full bg-studio-panel" />
      </div>
    );
  }

  return (
    <div className="studio-card flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="text-4xl opacity-60">▣</div>
      <p className="text-sm text-studio-muted">
        Preview not available for this file type.
        <br />
        Use Download to open it.
      </p>
      <p className="font-mono text-xs text-studio-muted/80">{item.originalName || item.filename}</p>
    </div>
  );
}
