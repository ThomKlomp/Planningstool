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
  departmentColor: string | null;
};

type SwapRequest = {
  id: string;
  shiftId: string;
  status: string;
  offeredById: string;
  notifiedNames: string[];
};

type Availability = {
  membershipId: string;
  date: string;
  daypart: string;
  status: string;
  note: string | null;
};
type Member = {
  membershipId: string;
  name: string;
  departmentName: string | null;
  departmentColor: string | null;
};
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
  viewerMembershipId,
  swapRequests = [],
}: {
  canManage: boolean;
  week: string[];
  members: Member[];
  availabilities: Availability[];
  shifts: Shift[];
  shiftTemplates: ShiftTemplate[];
  closedDates?: string[];
  isWeekOpen?: boolean;
  viewerMembershipId?: string;
  swapRequests?: SwapRequest[];
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
                <ShiftCard
                  key={shift.id}
                  shift={shift}
                  canManage={canManage}
                  viewerMembershipId={viewerMembershipId}
                  swapRequest={swapRequests.find((r) => r.shiftId === shift.id)}
                  onChanged={() => router.refresh()}
                />
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

function ShiftCard({
  shift,
  canManage,
  viewerMembershipId,
  swapRequest,
  onChanged,
}: {
  shift: Shift;
  canManage: boolean;
  viewerMembershipId?: string;
  swapRequest?: SwapRequest;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showNotified, setShowNotified] = useState(false);
  const isOwnShift = !canManage && viewerMembershipId && shift.membershipId === viewerMembershipId;
  const isOthersOpenOffer =
    !canManage &&
    swapRequest?.status === "OPEN" &&
    viewerMembershipId &&
    swapRequest.offeredById !== viewerMembershipId;

  async function offer() {
    setBusy(true);
    await fetch(`/api/shifts/${shift.id}/offer`, { method: "POST" });
    setBusy(false);
    onChanged();
  }

  async function cancelOffer() {
    if (!swapRequest) return;
    setBusy(true);
    await fetch(`/api/shifts/${shift.id}/offer`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  }

  async function claim() {
    if (!swapRequest) return;
    if (!confirm("Deze dienst overnemen of ruilen?")) return;
    setBusy(true);
    await fetch(`/api/shift-swaps/${swapRequest.id}/claim`, { method: "POST" });
    setBusy(false);
    onChanged();
  }

  return (
    <div className="rounded-lg bg-paper px-2 py-2 text-xs">
      <p className="font-medium">
        {shift.startTime}–{shift.endTime}
      </p>
      <p className="flex flex-wrap items-center gap-1 text-ink/60">
        <span>{shift.memberName ?? "Nog niet toegewezen"}</span>
        {shift.departmentName && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: shift.departmentColor ?? "#1B1B18" }}
          >
            {shift.departmentName}
          </span>
        )}
        {shift.role ? <span>· {shift.role}</span> : null}
      </p>

      {isOwnShift && !swapRequest && (
        <button
          onClick={offer}
          disabled={busy}
          className="mt-1.5 w-full rounded-full border border-line bg-white px-2 py-1 text-[11px] font-medium hover:border-ink disabled:opacity-50"
        >
          Aanbieden ter overname/ruil
        </button>
      )}

      {isOwnShift && swapRequest?.status === "OPEN" && (
        <div className="mt-1.5 space-y-1">
          <p className="rounded-full bg-amber/20 px-2 py-1 text-center text-[11px] font-medium text-amber-dark">
            Aangeboden
          </p>
          <button
            onClick={() => setShowNotified((v) => !v)}
            className="w-full text-center text-[11px] text-ink/50 hover:underline"
          >
            {swapRequest.notifiedNames.length === 0
              ? "Niemand geïnformeerd"
              : `${swapRequest.notifiedNames.length} ${
                  swapRequest.notifiedNames.length === 1 ? "collega" : "collega's"
                } geïnformeerd`}
          </button>
          {showNotified && swapRequest.notifiedNames.length > 0 && (
            <ul className="rounded-lg bg-white px-2 py-1.5 text-[11px] text-ink/60">
              {swapRequest.notifiedNames.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          )}
          {showNotified && swapRequest.notifiedNames.length === 0 && (
            <p className="rounded-lg bg-white px-2 py-1.5 text-[11px] text-ink/50">
              Niemand had zich beschikbaar gemeld voor deze dag — app of bel
              gerust zelf een collega.
            </p>
          )}
          <button
            onClick={cancelOffer}
            disabled={busy}
            className="w-full text-center text-[11px] text-ink/50 hover:underline disabled:opacity-50"
          >
            Intrekken
          </button>
        </div>
      )}

      {isOwnShift && swapRequest?.status === "PENDING_APPROVAL" && (
        <p className="mt-1.5 rounded-full bg-amber/20 px-2 py-1 text-center text-[11px] font-medium text-amber-dark">
          Wacht op goedkeuring
        </p>
      )}

      {isOthersOpenOffer && (
        <div className="mt-1.5 space-y-1">
          <p className="rounded-full bg-awning/10 px-2 py-1 text-center text-[11px] font-medium text-awning">
            Beschikbaar voor overname
          </p>
          <button
            onClick={claim}
            disabled={busy}
            className="w-full rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-paper hover:bg-awning disabled:opacity-50"
          >
            {busy ? "Bezig..." : "Overnemen"}
          </button>
        </div>
      )}
    </div>
  );
}
