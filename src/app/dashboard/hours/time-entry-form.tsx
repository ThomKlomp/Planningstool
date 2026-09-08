"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TimeEntryForm() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("23:00");
  const [breakMinutes, setBreakMinutes] = useState("0");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, endTime, breakMinutes, note }),
    });

    setSaving(false);
    setNote("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4"
    >
      <Field label="Datum">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Van">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Tot">
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Pauze (min)">
        <input
          type="number"
          min={0}
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(e.target.value)}
          className="w-24 rounded-lg border border-line px-3 py-2 text-sm"
        />
      </Field>
      <Field label="Notitie">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optioneel"
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </Field>
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
      >
        {saving ? "Bezig..." : "Uren indienen"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-ink/60">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
