"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DayPanel from "./day-panel";

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string | null;
  membershipId: string | null;
  memberName: string | null;
};

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

export default function RosterBoard({
  canManage,
  week,
  members,
  availabilities,
  shifts,
  shiftTemplates,
}: {
  canManage: boolean;
  week: string[];
  members: Member[];
  availabilities: Availability[];
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
}) {
  const router = useRouter();
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      {week.map((dateIso) => {
        const date = new Date(dateIso);
        const dayKey = date.toDateString();
        const dayShifts = shifts.filter((s) => new Date(s.date).toDateString() === dayKey);
        const availableCount = members.filter((m) =>
          availabilities.some(
            (a) =>
              a.membershipId === m.membershipId &&
              new Date(a.date).toDateString() === dayKey &&
              a.status !== "UNAVAILABLE"
          )
        ).length;

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
              <button
                onClick={() => setOpenDay(dateIso)}
                className="mt-3 w-full rounded-full border border-line px-2 py-1 text-xs hover:border-ink"
              >
                + Shift
              </button>
            )}

            <p className="mt-3 text-[11px] text-ink/40">{availableCount} beschikbaar</p>
          </div>
        );
      })}

      {openDay && (
        <DayPanel
          dateIso={openDay}
          members={members}
          availabilities={availabilities.filter(
            (a) => new Date(a.date).toDateString() === new Date(openDay).toDateString()
          )}
          shiftTemplates={shiftTemplates}
          onClose={() => setOpenDay(null)}
          onDone={() => {
            setOpenDay(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
