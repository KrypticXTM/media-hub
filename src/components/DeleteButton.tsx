"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Delete failed");
      }
      router.push("/library");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={onDelete} disabled={busy} className="studio-btn-danger">
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
