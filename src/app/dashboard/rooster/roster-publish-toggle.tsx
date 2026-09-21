"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Concept/gepubliceerd-schakelaar voor het rooster van één week. Alleen voor
// eigenaar/manager. Zolang een week op concept staat, zien medewerkers het
// rooster niet.
export default function RosterPublishToggle({
  weekStart,
  initialPublished,
}: {
  weekStart: string;
  initialPublished: boolean;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(next: boolean) {
    if (
      !next &&
      !confirm("Rooster terugzetten naar concept? Medewerkers kunnen het dan niet meer zien.")
    ) {
      return;
    }
    setSaving(true);
    setError(null);

    const res = await fetch("/api/roster/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart, published: next }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    setPublished(next);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
          published ? "bg-awning/10 text-awning" : "bg-amber/20 text-amber-dark"
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-awning" : "bg-amber-dark"}`} />
        {published ? "Gepubliceerd, zichtbaar voor medewerkers" : "Concept, nog niet zichtbaar voor medewerkers"}
      </span>
      {published ? (
        <button
          onClick={() => set(false)}
          disabled={saving}
          className="text-xs text-ink/40 hover:text-ink hover:underline disabled:opacity-50"
        >
          Terugzetten naar concept
        </button>
      ) : (
        <button
          onClick={() => set(true)}
          disabled={saving}
          className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {saving ? "Bezig..." : "Rooster publiceren"}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
