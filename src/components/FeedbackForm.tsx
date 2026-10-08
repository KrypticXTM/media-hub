"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

type FeedbackType = "Feedback" | "Bug report";

export default function FeedbackForm({
  projectTitle,
  projectSlug,
  compact = false,
}: {
  projectTitle: string;
  projectSlug: string;
  /** Tighter chrome when nested inside a product tile */
  compact?: boolean;
}) {
  const pathname = usePathname();
  const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT?.trim() || "";

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("Feedback");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const toggleClass = compact
    ? "flex w-full items-center justify-between gap-3 rounded-lg border border-studio-border/80 bg-black/20 px-3 py-2 text-left transition hover:border-studio-accent/30"
    : "studio-card flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:border-studio-accent/30";

  const panelClass = compact
    ? "rounded-lg border border-studio-border/80 bg-black/20 p-4 text-sm text-studio-muted"
    : "studio-card p-4 text-sm text-studio-muted";

  const formClass = compact
    ? "space-y-4 rounded-lg border border-studio-border/80 bg-black/20 p-4"
    : "studio-card space-y-4 p-5";

  const toggle = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      aria-controls={`feedback-form-${projectSlug}`}
      className={toggleClass}
    >
      <span className={`font-medium text-studio-text ${compact ? "text-xs" : "text-sm"}`}>
        Feedback / Report a bug
      </span>
      <span
        className={`leading-none text-studio-accent ${compact ? "text-base" : "text-lg"}`}
        aria-hidden
      >
        {open ? "−" : "+"}
      </span>
    </button>
  );

  if (!endpoint) {
    return (
      <div className="space-y-2 opacity-80">
        {toggle}
        {open ? (
          <div className={panelClass}>
            Feedback coming soon for {projectTitle}.
          </div>
        ) : null}
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDone(false);

    const form = e.currentTarget;
    const fd = new FormData(form);
    // Ensure type matches controlled select (Formspree reads name="type")
    fd.set("type", type);
    fd.set("_subject", `[${projectTitle}] ${type}`);
    fd.set("project", projectTitle);
    fd.set("project_slug", projectSlug);
    fd.set("page_path", pathname || `/i/${projectSlug}`);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        errors?: { message?: string }[];
      };
      if (!res.ok) {
        const msg =
          json.error ||
          json.errors?.map((x) => x.message).filter(Boolean).join(", ") ||
          "Could not send. Try again in a moment.";
        throw new Error(msg);
      }
      form.reset();
      setType("Feedback");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {toggle}
      {open ? (
        <form id={`feedback-form-${projectSlug}`} onSubmit={onSubmit} className={formClass}>
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight text-studio-text">
          Feedback / Report a bug
        </h2>
        <p className="text-sm text-studio-muted">
          For <span className="text-studio-text">{projectTitle}</span>. Optional contact fields
          are only used if you want a reply — your message is never posted publicly.
        </p>
      </div>

      {/* Hidden metadata for Formspree / email routing */}
      <input type="hidden" name="project" value={projectTitle} />
      <input type="hidden" name="project_slug" value={projectSlug} />
      <input type="hidden" name="page_path" value={pathname || `/i/${projectSlug}`} />
      <input type="hidden" name="_subject" value={`[${projectTitle}] ${type}`} />

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Type</span>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          className="studio-input"
          required
        >
          <option value="Feedback">Feedback</option>
          <option value="Bug report">Bug report</option>
        </select>
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Name (optional)</span>
        <input name="name" className="studio-input" placeholder="What should we call you?" autoComplete="name" />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Reply email (optional)</span>
        <input
          name="email"
          type="email"
          className="studio-input"
          placeholder="Only if you want a follow-up"
          autoComplete="email"
        />
      </label>

      <label className="block space-y-1.5 text-sm">
        <span className="text-studio-muted">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="studio-input resize-y"
          placeholder="What worked, what didn’t, or steps to reproduce a bug…"
        />
      </label>

      {error ? (
        <p className="text-sm text-studio-danger" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-sm text-studio-accent" role="status">
          Thanks — your message was sent for {projectTitle}.
        </p>
      ) : null}

      <button type="submit" disabled={busy} className="studio-btn-primary">
        {busy ? "Sending…" : "Send"}
      </button>
        </form>
      ) : null}
    </div>
  );
}
