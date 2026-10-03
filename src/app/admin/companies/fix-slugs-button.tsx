"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Fix = { id: string; name: string; from: string; to: string };

export default function FixSlugsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    const preview = await fetch("/api/admin/fix-slugs");
    if (!preview.ok) {
      setBusy(false);
      setMessage("Controleren mislukt.");
      return;
    }
    const { fixes } = (await preview.json()) as { fixes: Fix[] };
    if (fixes.length === 0) {
      setBusy(false);
      setMessage("Alle slugs zijn al in orde.");
      return;
    }
    const list = fixes.map((f) => `${f.name}: /${f.from} → /${f.to}`).join("\n");
    if (
      !confirm(
        `Deze slugs worden aangepast:\n\n${list}\n\nLet op: join-links met de oude slug werken daarna niet meer. Doorgaan?`
      )
    ) {
      setBusy(false);
      return;
    }
    const res = await fetch("/api/admin/fix-slugs", { method: "POST" });
    setBusy(false);
    setMessage(res.ok ? `${fixes.length} slug(s) aangepast.` : "Aanpassen mislukt.");
    if (res.ok) router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        onClick={run}
        disabled={busy}
        className="rounded-full border border-line px-4 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
      >
        {busy ? "Bezig..." : "Slugs met afgekapte accenten herstellen"}
      </button>
      {message && <span className="text-xs text-ink/60">{message}</span>}
    </div>
  );
}
