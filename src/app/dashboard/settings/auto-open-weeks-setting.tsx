"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AutoOpenWeeksSetting({ initialValue }: { initialValue: number }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(newValue: number) {
    setValue(newValue);
    setSaving(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autoOpenWeeks: newValue }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    setSaved(true);
    // Zonder dit blijven andere pagina's (bv. Beschikbaarheid, Rooster) de
    // oude waarde tonen totdat er een volledige page refresh gebeurt, want
    // Next.js cachet de server-rendered data van al bezochte routes.
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4">
      <label className="text-sm text-ink/70">Aantal weken vooruit open:</label>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => save(Number(e.target.value))}
        className="rounded-lg border border-line px-3 py-1.5 text-sm focus:border-awning focus:outline-none"
      >
        {Array.from({ length: 9 }, (_, i) => i).map((n) => (
          <option key={n} value={n}>
            {n === 0 ? "Alleen huidige week" : `${n} ${n === 1 ? "week" : "weken"}`}
          </option>
        ))}
      </select>
      {saved && <span className="text-xs text-awning">Opgeslagen</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
