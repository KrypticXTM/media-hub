"use client";

import { useEffect, useRef, useState } from "react";

/* Minimal typings for the YouTube IFrame Player API. */
type YTPlayer = {
  playVideo: () => void;
  mute: () => void;
  destroy: () => void;
  getPlayerState: () => number;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      host?: string;
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number; target: YTPlayer }) => void;
        onError?: () => void;
      };
    }
  ) => YTPlayer;
  PlayerState: { PLAYING: number };
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Load https://www.youtube.com/iframe_api once per page. */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(s);
  });
  return apiPromise;
}

const PLAYER_VARS = {
  autoplay: 1,
  rel: 0,
  playsinline: 1,
  iv_load_policy: 3,
  controls: 1,
  color: "white",
} as const;

/**
 * Mounts an autoplaying YouTube player that fills its parent (`relative` box).
 * - Uses the official IFrame Player API on youtube-nocookie.
 * - Our poster covers the player until YouTube reports PLAYING, hiding YouTube's
 *   start screen/title; the title bar then auto-hides while playing.
 * - Sound autoplay blocked (e.g. iOS)? Retries muted; after 5s lifts the poster
 *   so YouTube's own play button is reachable.
 * - API blocked? Falls back to a plain nocookie embed.
 * Unmounting destroys the player (stops audio).
 */
export default function YouTubeStage({
  youtubeId,
  poster,
  title,
}: {
  youtubeId: string;
  poster: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let player: YTPlayer | null = null;
    const timers: number[] = [];
    const mount = mountRef.current;
    const reveal = () => !cancelled && setPlaying(true);

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !mount) return;
        const target = document.createElement("div");
        mount.appendChild(target);
        player = new YT.Player(target, {
          host: "https://www.youtube-nocookie.com",
          videoId: youtubeId,
          width: "100%",
          height: "100%",
          playerVars: { ...PLAYER_VARS, origin: window.location.origin },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              e.target.playVideo();
              timers.push(
                window.setTimeout(() => {
                  const s = e.target.getPlayerState();
                  // still unstarted/cued (not merely buffering) → retry muted
                  if (s === -1 || s === 5) {
                    e.target.mute();
                    e.target.playVideo();
                  }
                }, 1500)
              );
              timers.push(window.setTimeout(reveal, 5000));
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) reveal();
            },
            onError: reveal,
          },
        });
      })
      .catch(() => {
        if (cancelled || !mount) return;
        const iframe = document.createElement("iframe");
        const qs = new URLSearchParams(
          Object.entries(PLAYER_VARS).map(([k, v]) => [k, String(v)])
        ).toString();
        iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?${qs}`;
        iframe.title = `${title} demo video`;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        mount.appendChild(iframe);
        reveal();
      });

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      try {
        player?.destroy();
      } catch {
        // ignore
      }
      if (mount) mount.innerHTML = "";
    };
  }, [youtubeId, title]);

  return (
    <div className="absolute inset-0 bg-black">
      <div
        ref={mountRef}
        className="absolute inset-0 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full"
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${
          playing ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt="" className="h-full w-full object-cover" />
        <span className="absolute inset-0 bg-black/30" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-studio-accent motion-reduce:animate-none" />
        </span>
      </div>
    </div>
  );
}
