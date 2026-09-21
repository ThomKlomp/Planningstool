"use client";

import { useState } from "react";

type Member = { membershipId: string; name: string; departmentName: string | null };

export default function ShiftEditPanel({
  shift,
  members,
  onClose,
  onDone,
}: {
  shift: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string | null;
    membershipId: string | null;
  };
  members: Member[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);
  const [role, setRole] = useState(shift.role ?? "");
  const [membershipId, setMembershipId] = useState(shift.membershipId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/shifts/${shift.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime,
        endTime,
        role: role || null,
        membershipId: membershipId || null,
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
    if (!confirm("Deze shift verwijderen? Dit kan niet ongedaan gemaakt worden.")) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/shifts/${shift.id}`, { method: "DELETE" });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Verwijderen mislukt.");
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
          <h3 className="font-display text-lg">Shift aanpassen</h3>
          <button
            onClick={onClose}
            className="rounded-full px-1.5 text-ink/40 hover:text-ink"
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          {new Date(shift.date).toLocaleDateString("nl-NL", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-ink/60">Van</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-ink/60">Tot</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-ink/60">Medewerker</label>
            <select
              value={membershipId}
              onChange={(e) => setMembershipId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
            >
              <option value="">Nog niet toegewezen</option>
              {members.map((m) => (
                <option key={m.membershipId} value={m.membershipId}>
                  {m.name}
                  {m.departmentName ? ` · ${m.departmentName}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink/60">Functie/rol (optioneel)</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Bv. bediening"
              className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-sm focus:border-awning focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={remove}
              disabled={saving}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Shift verwijderen
            </button>
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
