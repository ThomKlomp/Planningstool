"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "AVAILABLE" | "UNAVAILABLE" | "UNSURE";

const STATUS_OPTIONS: { value: Status; label: string; classes: string }[] = [
  { value: "AVAILABLE", label: "Ik kan", classes: "bg-awning text-white" },
  { value: "UNSURE", label: "Weet ik nog niet", classes: "bg-amber text-ink" },
  { value: "UNAVAILABLE", label: "Ik kan niet", classes: "bg-ink/10 text-ink" },
];

export default function AvailabilityGrid({
  week,
  ownEntries,
  locked = false,
}: {
  week: string[];
  ownEntries: { date: string; status: Status; note?: string | null }[];
  locked?: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Record<string, Status | undefined>>(() => {
    const map: Record<string, Status | undefined> = {};
    for (const e of ownEntries) {
      map[new Date(e.date).toDateString()] = e.status;
    }
    return map;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const e of ownEntries) {
      if (e.note) map[new Date(e.date).toDateString()] = e.note;
    }
    return map;
  });
  const [saving, setSaving] = useState<string | null>(null);

  async function save(dateIso: string, status: Status, note: string) {
    const key = new Date(dateIso).toDateString();
    setSaving(key);
    setEntries((prev) => ({ ...prev, [key]: status }));

    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateIso, status, note: note || undefined }),
    });

    setSaving(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {week.map((dateIso) => {
        const date = new Date(dateIso);
        const key = date.toDateString();
        const current = entries[key];
        const note = notes[key] ?? "";
        return (
          <div
            key={dateIso}
            className="rounded-xl border border-line bg-white px-3 py-3 text-center"
          >
            <p className="text-xs uppercase tracking-wide text-ink/40">
              {date.toLocaleDateString("nl-NL", { weekday: "short" })}
            </p>
            <p className="font-display text-lg">{date.getDate()}</p>
            <div className="mt-3 space-y-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => save(dateIso, opt.value, note)}
                  disabled={locked || saving === key}
                  className={`w-full rounded-full px-2 py-1 text-xs font-medium transition-opacity ${
                    current === opt.value ? opt.classes : "bg-paper text-ink/50"
                  } ${locked ? "opacity-40" : saving === key ? "opacity-50" : "hover:opacity-80"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={note}
              disabled={locked}
              onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
              onBlur={() => current && save(dateIso, current, note)}
              placeholder="Opmerking, bv. tijd"
              className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-center text-[11px] text-ink placeholder:text-ink/30 focus:border-awning focus:outline-none disabled:opacity-40"
            />
          </div>
        );
      })}
    </div>
  );
}
