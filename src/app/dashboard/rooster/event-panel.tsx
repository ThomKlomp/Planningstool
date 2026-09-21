"use client";

import { useState } from "react";

export type RosterEventData = {
  id: string;
  date: string | null; // ISO, alleen bij een dag-evenement
  weekStart: string | null; // ISO, alleen bij een week-evenement
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
};

// Paneel om een evenement toe te voegen (aan een dag of week) of aan te
// passen/te verwijderen.
export default function EventPanel({
  target,
  event,
  onClose,
  onDone,
}: {
  // Waar het nieuwe evenement aan hangt (genegeerd bij aanpassen).
  target: { kind: "day"; dateIso: string } | { kind: "week"; weekStart: string };
  event?: RosterEventData;
  onClose: () => void;
  onDone: () => void;
}) {
  const isDay = event ? Boolean(event.date) : target.kind === "day";
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [startTime, setStartTime] = useState(event?.startTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const whenLabel = (() => {
    if (event?.date) return new Date(event.date);
    if (!event && target.kind === "day") return new Date(target.dateIso);
    return null;
  })();

  async function save() {
    if (!title.trim()) {
      setError("Geef het evenement een titel.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title,
      description,
      startTime: isDay ? startTime || null : null,
      endTime: isDay ? endTime || null : null,
    };

    const res = event
      ? await fetch(`/api/roster-events/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/roster-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            ...(target.kind === "day"
              ? { date: target.dateIso.slice(0, 10) }
              : { weekStart: target.weekStart }),
          }),
        });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    onDone();
  }

  async function remove() {
    if (!event || !confirm("Dit evenement verwijderen?")) return;
    setSaving(true);
    const res = await fetch(`/api/roster-events/${event.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      setError("Verwijderen mislukt.");
      return;
    }
    onDone();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg">
            {event ? "Evenement aanpassen" : isDay ? "Evenement toevoegen" : "Weekevenement toevoegen"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full px-1.5 text-ink/40 hover:text-ink"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          {whenLabel
            ? whenLabel.toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "Geldt voor de hele week"}
          . Medewerkers zien dit op het rooster.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs text-ink/60">Titel</label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bv. Feestje van Bas"
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
            />
          </div>

          {isDay && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-ink/60">Van (optioneel)</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-ink/60">Tot (optioneel)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs text-ink/60">Wat kunnen medewerkers verwachten? (optioneel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Bv. Besloten feest met 60 gasten, we verwachten een drukke avond."
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-1">
            {event ? (
              <button
                onClick={remove}
                disabled={saving}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Verwijderen
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-awning disabled:opacity-50"
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
