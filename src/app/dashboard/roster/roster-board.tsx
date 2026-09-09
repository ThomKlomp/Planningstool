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
  departmentName: string | null;
};

type Availability = {
  membershipId: string;
  date: string;
  daypart: string;
  status: string;
  note: string | null;
};
type Member = { membershipId: string; name: string; departmentName: string | null };
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
  closedDates = [],
  isWeekOpen = true,
}: {
  canManage: boolean;
  week: string[];
  members: Member[];
  availabilities: Availability[];
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  closedDates?: string[];
  isWeekOpen?: boolean;
}) {
  const router = useRouter();
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
      {week.map((dateIso) => {
        const date = new Date(dateIso);
        const dayKey = date.toDateString();

        if (closedDates.includes(dayKey)) {
          return (
            <div
              key={dateIso}
              className="rounded-xl border border-line bg-ink/5 p-3 text-center"
            >
              <p className="text-xs uppercase tracking-wide text-ink/40">
                {date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}
              </p>
              <p className="mt-6 text-xs font-medium text-ink/40">Gesloten</p>
            </div>
          );
        }

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
                  <p className="flex items-center gap-1 text-ink/60">
                    <span>{shift.memberName ?? "Nog niet toegewezen"}</span>
                    {shift.departmentName && (
                      <span className="rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-medium text-ink/60">
                        {shift.departmentName}
                      </span>
                    )}
                    {shift.role ? <span>· {shift.role}</span> : null}
                  </p>
                </div>
              ))}
              {dayShifts.length === 0 && (
                <p className="text-xs text-ink/40">Geen shifts</p>
              )}
            </div>

            {canManage && isWeekOpen && (
              <button
                onClick={() => setOpenDay(dateIso)}
                className="mt-3 w-full rounded-full border border-line px-2 py-1 text-xs hover:border-ink"
              >
                + Shift
              </button>
            )}
            {canManage && !isWeekOpen && (
              <p className="mt-3 text-[11px] text-ink/30">
                Week gesloten — zet 'm open om shifts toe te voegen
              </p>
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
