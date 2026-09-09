"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Template = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  weekdays: number[];
};

const WEEKDAYS = [
  { value: 1, label: "Ma" },
  { value: 2, label: "Di" },
  { value: 3, label: "Wo" },
  { value: 4, label: "Do" },
  { value: 5, label: "Vr" },
  { value: 6, label: "Za" },
  { value: 0, label: "Zo" },
];

export default function ShiftTemplatesManager({
  initialTemplates,
}: {
  initialTemplates: Template[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("18:00");
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleWeekday(day: number) {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/shift-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, startTime, endTime, weekdays }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Er ging iets mis.");
      setSaving(false);
      return;
    }

    setTemplates((prev) => [...prev, data.shiftTemplate]);
    setName("");
    setSaving(false);
    router.refresh();
  }

  async function removeTemplate(id: string) {
    if (!confirm("Deze standaard shift verwijderen?")) return;
    setBusyId(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));

    const res = await fetch(`/api/shift-templates/${id}`, { method: "DELETE" });
    setBusyId(null);

    if (!res.ok) {
      setTemplates(initialTemplates);
    }
    router.refresh();
  }

  function weekdayLabel(days: number[]) {
    if (days.length === 7) return "Elke dag";
    if (
      days.length === 5 &&
      [1, 2, 3, 4, 5].every((d) => days.includes(d))
    ) {
      return "Ma–vr";
    }
    return WEEKDAYS.filter((w) => days.includes(w.value))
      .map((w) => w.label)
      .join(", ");
  }

  return (
    <div className="space-y-4">
      {templates.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-ink/50">
                  {t.startTime}–{t.endTime} · {weekdayLabel(t.weekdays)}
                </p>
              </div>
              <button
                onClick={() => removeTemplate(t.id)}
                disabled={busyId === t.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={addTemplate}
        className="space-y-3 rounded-xl border border-line bg-white p-4"
      >
        <div>
          <label className="block text-xs text-ink/60">Naam</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bv. Middagshift"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-ink/60">Van</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-ink/60">Tot</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink/60">Dagen</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {WEEKDAYS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => toggleWeekday(w.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  weekdays.includes(w.value)
                    ? "bg-ink text-paper"
                    : "bg-paper text-ink/50 hover:text-ink"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving || weekdays.length === 0}
          className="w-full rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning transition-colors disabled:opacity-50"
        >
          {saving ? "Bezig..." : "Standaard shift toevoegen"}
        </button>
      </form>
    </div>
  );
}
