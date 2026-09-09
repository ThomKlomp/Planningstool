"use client";

import { useState } from "react";

type ClosedDay = { id: string; date: string; reason: string | null };

export default function ClosedDaysManager({
  initialClosedDays,
}: {
  initialClosedDays: ClosedDay[];
}) {
  const [closedDays, setClosedDays] = useState(initialClosedDays);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function addClosedDay(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/closed-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      setSaving(false);
      return;
    }

    setClosedDays((prev) =>
      [...prev.filter((d) => d.id !== data.closedDay.id), data.closedDay]
        .map((d) => ({ id: d.id, date: d.date.slice(0, 10), reason: d.reason }))
        .sort((a, b) => a.date.localeCompare(b.date))
    );
    setDate("");
    setReason("");
    setSaving(false);
  }

  async function removeClosedDay(id: string) {
    setBusyId(id);
    setClosedDays((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/closed-days/${id}`, { method: "DELETE" });
    setBusyId(null);
  }

  return (
    <div className="space-y-4">
      {closedDays.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {closedDays.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <span className="font-medium">
                  {new Date(`${d.date}T00:00:00`).toLocaleDateString("nl-NL", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                {d.reason && <span className="ml-2 text-ink/50">· {d.reason}</span>}
              </div>
              <button
                onClick={() => removeClosedDay(d.id)}
                disabled={busyId === d.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={addClosedDay}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4"
      >
        <div>
          <label className="block text-xs text-ink/60">Datum</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-ink/60">Reden (optioneel)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bv. Eerste kerstdag"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {saving ? "Bezig..." : "Toevoegen"}
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
