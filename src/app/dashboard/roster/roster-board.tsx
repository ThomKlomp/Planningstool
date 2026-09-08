"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string | null;
  membershipId: string | null;
  memberName: string | null;
};

type Availability = { membershipId: string; date: string; status: string };
type Member = { membershipId: string; name: string };

export default function RosterBoard({
  canManage,
  week,
  members,
  availabilities,
  shifts,
}: {
  canManage: boolean;
  week: string[];
  members: Member[];
  availabilities: Availability[];
  shifts: Shift[];
}) {
  const router = useRouter();
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      {week.map((dateIso) => {
        const date = new Date(dateIso);
        const dayKey = date.toDateString();
        const dayShifts = shifts.filter((s) => new Date(s.date).toDateString() === dayKey);
        const availableToday = members.filter((m) =>
          availabilities.some(
            (a) =>
              a.membershipId === m.membershipId &&
              new Date(a.date).toDateString() === dayKey &&
              a.status !== "UNAVAILABLE"
          )
        );

        return (
          <div key={dateIso} className="rounded-xl border border-line bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-ink/40">
              {date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}
            </p>

            <div className="mt-2 space-y-2">
              {dayShifts.map((shift) => (
                <div key={shift.id} className="rounded-lg bg-paper px-2 py-2 text-xs">
                  <p className="font-medium">
                    {shift.startTime}–{shift.endTime}
                  </p>
                  <p className="text-ink/60">
                    {shift.memberName ?? "Nog niet toegewezen"}
                    {shift.role ? ` · ${shift.role}` : ""}
                  </p>
                </div>
              ))}
              {dayShifts.length === 0 && (
                <p className="text-xs text-ink/40">Geen shifts</p>
              )}
            </div>

            {canManage && (
              <>
                <button
                  onClick={() => setOpenDay(openDay === dateIso ? null : dateIso)}
                  className="mt-3 w-full rounded-full border border-line px-2 py-1 text-xs hover:border-ink"
                >
                  + Shift
                </button>
                {openDay === dateIso && (
                  <AddShiftForm
                    dateIso={dateIso}
                    members={availableToday.length > 0 ? availableToday : members}
                    onDone={() => {
                      setOpenDay(null);
                      router.refresh();
                    }}
                  />
                )}
              </>
            )}

            <p className="mt-3 text-[11px] text-ink/40">
              {availableToday.length} beschikbaar
            </p>
          </div>
        );
      })}
    </div>
  );
}

function AddShiftForm({
  dateIso,
  members,
  onDone,
}: {
  dateIso: string;
  members: Member[];
  onDone: () => void;
}) {
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("23:00");
  const [membershipId, setMembershipId] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

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
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 rounded-lg border border-line p-2">
      <div className="flex gap-1">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-1/2 rounded border border-line px-1 py-1 text-xs"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-1/2 rounded border border-line px-1 py-1 text-xs"
        />
      </div>
      <select
        value={membershipId}
        onChange={(e) => setMembershipId(e.target.value)}
        className="w-full rounded border border-line px-1 py-1 text-xs"
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
        className="w-full rounded border border-line px-1 py-1 text-xs"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-ink px-2 py-1 text-xs font-medium text-paper hover:bg-awning disabled:opacity-50"
      >
        {saving ? "Bezig..." : "Toevoegen"}
      </button>
    </form>
  );
}
