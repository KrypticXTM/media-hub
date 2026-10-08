"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PlayBadge, { WatchDemoChip } from "@/components/PlayBadge";
import YouTubeStage, { loadYouTubeApi } from "@/components/YouTubeStage";

/**
 * Product-page media: cover + yellow play button. Clicking opens a portal
 * lightbox with an autoplaying YouTube player. Close via ×, Esc, or backdrop.
 * Fills its parent — place inside a `relative aspect-video` box.
 */
export default function VideoLightbox({
  youtubeId,
  coverImage,
  title,
}: {
  youtubeId: string;
  coverImage?: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives fade/scale-in
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const thumb = coverImage || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;

  const close = useCallback(() => {
    setShown(false);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;

    // Lock scroll (compensate scrollbar width to avoid layout shift)
    const { overflow, paddingRight } = document.body.style;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (sbw > 0) document.body.style.paddingRight = `${sbw}px`;

    // Make the rest of the page inert (focus trap + hides it from screen readers)
    const others = Array.from(document.body.children).filter(
      (el) => el !== dialog && !el.hasAttribute("inert") && el.tagName !== "SCRIPT"
    ) as HTMLElement[];
    others.forEach((el) => el.setAttribute("inert", ""));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);

    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeRef.current?.focus();
    });

    const trigger = triggerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      others.forEach((el) => el.removeAttribute("inert"));
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      trigger?.focus();
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        onPointerEnter={() => loadYouTubeApi().catch(() => {})}
        onFocus={() => loadYouTubeApi().catch(() => {})}
        aria-label={`Watch demo: ${title}`}
        aria-haspopup="dialog"
        data-youtube-id={youtubeId}
        className="group absolute inset-0 block h-full w-full cursor-pointer overflow-hidden focus-visible:outline-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.35)_100%)] opacity-40 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
        <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <PlayBadge size="lg" />
        </span>
        <WatchDemoChip />
      </button>

      {open
        ? createPortal(
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${title} demo`}
              onClick={(e) => {
                if (e.target === e.currentTarget) close();
              }}
              className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none ${
                shown ? "opacity-100" : "opacity-0"
              }`}
            >
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close video"
                className="absolute right-3 top-3 z-[1] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-accent sm:right-5 sm:top-5"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <div
                className={`relative aspect-video w-[min(92vw,960px,calc(75vh*16/9))] overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10 transition-transform duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none ${
                  shown ? "scale-100" : "scale-95"
                }`}
              >
                <YouTubeStage youtubeId={youtubeId} poster={thumb} title={title} />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
