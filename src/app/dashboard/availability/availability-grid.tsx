"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "AVAILABLE" | "UNAVAILABLE" | "PREFERRED";

const STATUS_OPTIONS: { value: Status; label: string; classes: string }[] = [
  { value: "AVAILABLE", label: "Kan werken", classes: "bg-awning text-white" },
  { value: "PREFERRED", label: "Liever wel", classes: "bg-amber text-ink" },
  { value: "UNAVAILABLE", label: "Kan niet", classes: "bg-ink/10 text-ink" },
];

export default function AvailabilityGrid({
  week,
  ownEntries,
}: {
  week: string[];
  ownEntries: { date: string; status: Status }[];
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Record<string, Status | undefined>>(() => {
    const map: Record<string, Status | undefined> = {};
    for (const e of ownEntries) {
      map[new Date(e.date).toDateString()] = e.status;
    }
    return map;
  });
  const [saving, setSaving] = useState<string | null>(null);

  async function setStatus(dateIso: string, status: Status) {
    const key = new Date(dateIso).toDateString();
    setSaving(key);
    setEntries((prev) => ({ ...prev, [key]: status }));

    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateIso, status }),
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
                  onClick={() => setStatus(dateIso, opt.value)}
                  disabled={saving === key}
                  className={`w-full rounded-full px-2 py-1 text-xs font-medium transition-opacity ${
                    current === opt.value ? opt.classes : "bg-paper text-ink/50"
                  } ${saving === key ? "opacity-50" : "hover:opacity-80"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
