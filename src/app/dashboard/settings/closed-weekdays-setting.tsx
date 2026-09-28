"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const WEEKDAYS = [
  { value: 1, label: "Ma" },
  { value: 2, label: "Di" },
  { value: 3, label: "Wo" },
  { value: 4, label: "Do" },
  { value: 5, label: "Vr" },
  { value: 6, label: "Za" },
  { value: 0, label: "Zo" },
];

export default function ClosedWeekdaysSetting({
  initialWeekdays,
}: {
  initialWeekdays: number[];
}) {
  const router = useRouter();
  const [weekdays, setWeekdays] = useState(initialWeekdays);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle(day: number) {
    const next = weekdays.includes(day)
      ? weekdays.filter((d) => d !== day)
      : [...weekdays, day];
    const previous = weekdays;
    setWeekdays(next);
    setSaving(true);
    setSaved(false);
    setFailed(false);

    // Alleen "Opgeslagen" tonen als de server het echt heeft opgeslagen.
    const ok = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closedWeekdays: next }),
    })
      .then((res) => res.ok)
      .catch(() => false);

    setSaving(false);
    if (!ok) {
      setWeekdays(previous);
      setFailed(true);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap gap-1.5">
        {WEEKDAYS.map((w) => (
          <button
            key={w.value}
            type="button"
            disabled={saving}
            onClick={() => toggle(w.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
              weekdays.includes(w.value)
                ? "bg-ink text-paper"
                : "bg-paper text-ink/50 hover:text-ink"
            }`}
          >
            {w.label}
          </button>
        ))}
        {saved && <span className="self-center text-xs text-awning">Opgeslagen</span>}
        {failed && (
          <span className="self-center text-xs text-red-600">Opslaan mislukt, probeer het opnieuw</span>
        )}
      </div>
      <p className="mt-2 text-xs text-ink/40">
        Aangevinkte dagen zijn elke week automatisch dicht: geen
        beschikbaarheid nodig, geen shifts, geen uren.
      </p>
    </div>
  );
}
