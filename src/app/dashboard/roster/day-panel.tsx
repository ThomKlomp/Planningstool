"use client";

import { useState } from "react";

type Availability = {
  membershipId: string;
  date: string;
  daypart: string;
  status: string;
  note: string | null;
};
type Member = { membershipId: string; name: string };
type ShiftTemplate = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  weekdays: number[];
};

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Kan werken",
  UNSURE: "Weet nog niet",
  UNAVAILABLE: "Kan niet",
};

const STATUS_DOT: Record<string, string> = {
  AVAILABLE: "bg-awning",
  UNSURE: "bg-amber",
  UNAVAILABLE: "bg-red-500",
};

export default function DayPanel({
  dateIso,
  members,
  availabilities,
  shiftTemplates,
  onClose,
  onDone,
}: {
  dateIso: string;
  members: Member[];
  availabilities: Availability[];
  shiftTemplates: ShiftTemplate[];
  onClose: () => void;
  onDone: () => void;
}) {
  const date = new Date(dateIso);
  const dayTemplates = shiftTemplates.filter((t) => t.weekdays.includes(date.getDay()));

  function templateLabel(daypart: string) {
    if (!daypart) return null;
    const template = shiftTemplates.find((t) => t.id === daypart);
    return template ? `${template.name} (${template.startTime}–${template.endTime})` : null;
  }

  // Sorteer leden: eerst wie (deels) beschikbaar is, dan de rest.
  const sortedMembers = [...members].sort((a, b) => {
    const aAvailable = availabilities.some(
      (e) => e.membershipId === a.membershipId && e.status !== "UNAVAILABLE"
    );
    const bAvailable = availabilities.some(
      (e) => e.membershipId === b.membershipId && e.status !== "UNAVAILABLE"
    );
    return aAvailable === bAvailable ? 0 : aAvailable ? -1 : 1;
  });

  return (
    <div className="fixed inset-0 z-50 lg:col-span-7">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-xl">
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <div>
            <p className="font-display text-lg">
              {date.toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <p className="text-xs text-ink/50">Beschikbaarheid &amp; shift toevoegen</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-ink/50 hover:bg-paper hover:text-ink"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-ink/40">Team</p>
          <ul className="mt-2 space-y-2">
            {sortedMembers.map((m) => {
              const entries = availabilities.filter((e) => e.membershipId === m.membershipId);
              return (
                <li
                  key={m.membershipId}
                  className="rounded-lg border border-line bg-white px-3 py-2"
                >
                  <p className="text-sm font-medium">{m.name}</p>
                  {entries.length === 0 ? (
                    <p className="mt-1 text-xs text-ink/40">Nog niet doorgegeven</p>
                  ) : (
                    <div className="mt-1 space-y-1">
                      {entries.map((e, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-ink/60">
                          <span
                            className={`h-2 w-2 rounded-full ${STATUS_DOT[e.status] ?? "bg-ink/20"}`}
                          />
                          <span>{STATUS_LABEL[e.status] ?? e.status}</span>
                          {templateLabel(e.daypart) && (
                            <span className="text-ink/40">· {templateLabel(e.daypart)}</span>
                          )}
                          {e.note && <span className="text-ink/40">· “{e.note}”</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-xs uppercase tracking-wide text-ink/40">Shift toevoegen</p>
          <div className="mt-2">
            <AddShiftForm
              dateIso={dateIso}
              members={members}
              dayTemplates={dayTemplates}
              onDone={onDone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddShiftForm({
  dateIso,
  members,
  dayTemplates,
  onDone,
}: {
  dateIso: string;
  members: Member[];
  dayTemplates: ShiftTemplate[];
  onDone: () => void;
}) {
  const [startTime, setStartTime] = useState(dayTemplates[0]?.startTime ?? "17:00");
  const [endTime, setEndTime] = useState(dayTemplates[0]?.endTime ?? "23:00");
  const [membershipId, setMembershipId] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  function applyTemplate(t: ShiftTemplate) {
    setStartTime(t.startTime);
    setEndTime(t.endTime);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateIso,
        startTime,
        endTime,
        role: role || undefined,
        membershipId: membershipId || undefined,
      }),
    });
    setSaving(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-line bg-white p-3">
      {dayTemplates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dayTemplates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:bg-ink hover:text-paper"
            >
              {t.name} ({t.startTime}–{t.endTime})
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-1/2 rounded-lg border border-line px-2 py-1.5 text-sm"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-1/2 rounded-lg border border-line px-2 py-1.5 text-sm"
        />
      </div>
      <select
        value={membershipId}
        onChange={(e) => setMembershipId(e.target.value)}
        className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
      >
        <option value="">Nog niet toewijzen</option>
        {members.map((m) => (
          <option key={m.membershipId} value={m.membershipId}>
            {m.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Functie (optioneel)"
        className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-ink px-3 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
      >
        {saving ? "Bezig..." : "Shift toevoegen"}
      </button>
    </form>
  );
}
