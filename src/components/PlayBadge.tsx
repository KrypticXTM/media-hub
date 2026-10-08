/** Yellow play circle — purely visual (no interactivity). Shared by tile hint + page play button. */
export default function PlayBadge({
  size = "lg",
  loading = false,
}: {
  size?: "sm" | "lg";
  loading?: boolean;
}) {
  const box =
    size === "sm"
      ? "h-11 w-11 shadow-[0_6px_18px_rgba(0,0,0,0.45),0_0_0_4px_rgba(245,208,0,0.18)] group-hover:shadow-[0_8px_22px_rgba(0,0,0,0.5),0_0_0_6px_rgba(245,208,0,0.25),0_0_24px_rgba(245,208,0,0.4)]"
      : "h-14 w-14 sm:h-[68px] sm:w-[68px] shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_0_6px_rgba(245,208,0,0.18)] group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_0_9px_rgba(245,208,0,0.25),0_0_36px_rgba(245,208,0,0.45)]";
  const icon = size === "sm" ? "h-5 w-5" : "h-6 w-6 sm:h-7 sm:w-7";
  return (
    <span
      className={`relative flex items-center justify-center rounded-full bg-studio-accent text-studio-bg transition duration-300 ease-out group-hover:scale-110 group-focus-visible:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-black motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${box}`}
      aria-hidden
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-studio-bg/30 border-t-studio-bg" />
      ) : (
        <svg viewBox="0 0 24 24" className={`${icon} translate-x-[2px]`} fill="currentColor">
          <path d="M7 4.5v15a1 1 0 0 0 1.53.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
        </svg>
      )}
    </span>
  );
}

/** Small "WATCH DEMO" chip (visual only). */
export function WatchDemoChip({ label = "Watch demo" }: { label?: string }) {
  return (
    <span className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-sm transition-colors duration-300 group-hover:text-studio-accent">
      {label}
    </span>
  );
}
