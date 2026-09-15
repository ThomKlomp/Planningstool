"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "AVAILABLE" | "UNAVAILABLE" | "UNSURE";

type ShiftTemplate = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  weekdays: number[];
};

type OwnEntry = { date: string; daypart: string; status: Status; note?: string | null };

const STATUS_OPTIONS: { value: Status; label: string; classes: string }[] = [
  { value: "AVAILABLE", label: "Beschikbaar", classes: "bg-awning text-white" },
  { value: "UNSURE", label: "Weet ik nog niet", classes: "bg-amber text-ink" },
  { value: "UNAVAILABLE", label: "Niet beschikbaar", classes: "bg-red-500 text-white" },
];

export default function AvailabilityGrid({
  week,
  ownEntries,
  shiftTemplates,
  closedDates = [],
  locked = false,
}: {
  week: string[];
  ownEntries: OwnEntry[];
  shiftTemplates: ShiftTemplate[];
  closedDates?: string[];
  locked?: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Record<string, Status | undefined>>(() => {
    const map: Record<string, Status | undefined> = {};
    for (const e of ownEntries) {
      map[`${new Date(e.date).toDateString()}::${e.daypart}`] = e.status;
    }
    return map;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const e of ownEntries) {
      if (e.note) map[`${new Date(e.date).toDateString()}::${e.daypart}`] = e.note;
    }
    return map;
  });
  const [saving, setSaving] = useState<string | null>(null);

  async function save(dateIso: string, daypart: string, status: Status, note: string) {
    const key = `${new Date(dateIso).toDateString()}::${daypart}`;
    setSaving(key);
    setEntries((prev) => ({ ...prev, [key]: status }));

    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateIso, daypart, status, note: note || undefined }),
    });

    setSaving(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {week.map((dateIso) => {
        const date = new Date(dateIso);

        if (closedDates.includes(date.toDateString())) {
          return (
            <div
              key={dateIso}
              className="rounded-xl border border-line bg-ink/5 px-3 py-3 text-center"
            >
              <p className="text-xs uppercase tracking-wide text-ink/40">
                {date.toLocaleDateString("nl-NL", { weekday: "short" })}
              </p>
              <p className="font-display text-lg text-ink/50">{date.getDate()}</p>
              <p className="mt-4 text-xs font-medium text-ink/40">Gesloten</p>
            </div>
          );
        }

        const dayTemplates = shiftTemplates.filter((t) => t.weekdays.includes(date.getDay()));
        const shifts =
          dayTemplates.length > 0
            ? dayTemplates.map((t) => ({
                daypart: t.id,
                label: t.name,
                sublabel: `${t.startTime}–${t.endTime}`,
              }))
            : [{ daypart: "", label: "Hele dag", sublabel: null as string | null }];

        return (
          <div
            key={dateIso}
            className="rounded-xl border border-line bg-white px-3 py-3 text-center"
          >
            <p className="text-xs uppercase tracking-wide text-ink/40">
              {date.toLocaleDateString("nl-NL", { weekday: "short" })}
            </p>
            <p className="font-display text-lg">{date.getDate()}</p>

            <div className="mt-3 space-y-3">
              {shifts.map((shift) => {
                const key = `${date.toDateString()}::${shift.daypart}`;
                const current = entries[key];
                const note = notes[key] ?? "";

                return (
                  <div key={shift.daypart} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
                    {dayTemplates.length > 0 && (
                      <p className="mb-1 text-[11px] font-medium text-ink/60">
                        {shift.label}
                        <span className="block text-[10px] font-normal text-ink/40">
                          {shift.sublabel}
                        </span>
                      </p>
                    )}
                    <div className="space-y-1">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => save(dateIso, shift.daypart, opt.value, note)}
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
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      onBlur={() => current && save(dateIso, shift.daypart, current, note)}
                      placeholder="Opmerking"
                      className="mt-2 w-full rounded-lg border border-line px-2 py-1 text-center text-[11px] text-ink placeholder:text-ink/30 focus:border-awning focus:outline-none disabled:opacity-40"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
