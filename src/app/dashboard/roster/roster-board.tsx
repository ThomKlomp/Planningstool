"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DayPanel from "./day-panel";
import ShiftEditPanel from "./shift-edit-panel";

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

/** Groepeert de shifts van een dag per team, alfabetisch, met "Geen team" altijd als laatste. */
function groupShiftsByDepartment(
  shifts: Shift[]
): { name: string; color: string | null; shifts: Shift[] }[] {
  const groups = new Map<string, { color: string | null; shifts: Shift[] }>();
  for (const shift of shifts) {
    const key = shift.departmentName ?? "Geen team";
    if (!groups.has(key)) groups.set(key, { color: shift.departmentColor, shifts: [] });
    groups.get(key)!.shifts.push(shift);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "Geen team") return 1;
      if (b === "Geen team") return -1;
      return a.localeCompare(b);
    })
    .map(([name, data]) => ({ name, color: data.color, shifts: data.shifts }));
}

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
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

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

            <div className="mt-2 space-y-3">
              {groupShiftsByDepartment(dayShifts).map((group) => (
                <div key={group.name}>
                  <p
                    className={`mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${
                      group.color ? "" : "text-ink/40"
                    }`}
                    style={group.color ? { color: group.color } : undefined}
                  >
                    {group.color && (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    {group.name}
                  </p>
                  <div className="space-y-2">
                    {group.shifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        canManage={canManage}
                        viewerMembershipId={viewerMembershipId}
                        swapRequest={swapRequests.find((r) => r.shiftId === shift.id)}
                        onChanged={() => router.refresh()}
                        onEdit={() => setEditingShift(shift)}
                      />
                    ))}
                  </div>
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
                Week gesloten, zet 'm open om shifts toe te voegen
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

      {editingShift && (
        <ShiftEditPanel
          shift={editingShift}
          members={members}
          onClose={() => setEditingShift(null)}
          onDone={() => {
            setEditingShift(null);
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
  onEdit,
}: {
  shift: Shift;
  canManage: boolean;
  viewerMembershipId?: string;
  swapRequest?: SwapRequest;
  onChanged: () => void;
  onEdit?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showNotified, setShowNotified] = useState(false);
  const [showSwapNote, setShowSwapNote] = useState(false);
  const [swapNote, setSwapNote] = useState("");
  const isOwnShift = !canManage && viewerMembershipId && shift.membershipId === viewerMembershipId;
  // Iedereen behalve de aanbieder zelf mag een openstaande dienst overnemen,
  // dus ook een manager/eigenaar (die zag voorheen zelfs het label niet).
  const canClaimOpenOffer =
    swapRequest?.status === "OPEN" && viewerMembershipId && swapRequest.offeredById !== viewerMembershipId;

  async function offer(e: React.MouseEvent) {
    e.stopPropagation();
    setBusy(true);
    await fetch(`/api/shifts/${shift.id}/offer`, { method: "POST" });
    setBusy(false);
    onChanged();
  }

  async function cancelOffer(e: React.MouseEvent) {
    e.stopPropagation();
    if (!swapRequest) return;
    setBusy(true);
    await fetch(`/api/shifts/${shift.id}/offer`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  }

  async function claim(asSwap: boolean, note?: string) {
    if (!swapRequest) return;
    setBusy(true);
    await fetch(`/api/shift-swaps/${swapRequest.id}/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asSwap, note: note || undefined }),
    });
    setBusy(false);
    setShowSwapNote(false);
    setSwapNote("");
    onChanged();
  }

  return (
    <div
      onClick={canManage ? onEdit : undefined}
      className={`rounded-lg bg-paper px-2 py-2 text-xs ${
        canManage && onEdit ? "cursor-pointer hover:bg-ink/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="font-medium">
            {shift.startTime}–{shift.endTime}
          </p>
          <p className="flex flex-wrap items-center gap-1 text-ink/60">
            <span>{shift.memberName ?? "Nog niet toegewezen"}</span>
            {shift.role ? <span>· {shift.role}</span> : null}
          </p>
        </div>
        {canManage && onEdit && (
          <span className="shrink-0 text-[10px] text-ink/30">Bewerken</span>
        )}
      </div>

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
            onClick={(e) => {
              e.stopPropagation();
              setShowNotified((v) => !v);
            }}
            className="w-full text-center text-[11px] text-ink/50 hover:underline"
          >
            {swapRequest.notifiedNames.length === 0
              ? "Niemand geïnformeerd"
              : `${swapRequest.notifiedNames.length} ${
                  swapRequest.notifiedNames.length === 1 ? "collega" : "collega's"
                } geïnformeerd`}
          </button>
          {showNotified && swapRequest.notifiedNames.length > 0 && (
            <>
              <ul className="rounded-lg bg-white px-2 py-1.5 text-[11px] text-ink/60">
                {swapRequest.notifiedNames.map((name, i) => (
                  <li key={i}>{name}</li>
                ))}
              </ul>
              <p className="rounded-lg bg-white px-2 py-1.5 text-[11px] text-ink/50">
                Staat iemand er niet bij? Die kun je natuurlijk gewoon zelf
                appen of bellen.
              </p>
            </>
          )}
          {showNotified && swapRequest.notifiedNames.length === 0 && (
            <p className="rounded-lg bg-white px-2 py-1.5 text-[11px] text-ink/50">
              Niemand had zich beschikbaar gemeld voor deze dag, app of bel
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

      {canClaimOpenOffer && !showSwapNote && (
        <div className="mt-1.5 space-y-1">
          <p className="rounded-full bg-awning/10 px-2 py-1 text-center text-[11px] font-medium text-awning">
            Beschikbaar voor overname
          </p>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                claim(false);
              }}
              disabled={busy}
              className="flex-1 rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-paper hover:bg-awning disabled:opacity-50"
            >
              {busy ? "Bezig..." : "Overnemen"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSwapNote(true);
              }}
              disabled={busy}
              className="flex-1 rounded-full border border-line px-2 py-1 text-[11px] font-medium hover:border-ink disabled:opacity-50"
              title="Al je eigen diensten worden meegemaild, de aanbieder kiest zelf wat 'm uitkomt"
            >
              Ruilen
            </button>
          </div>
        </div>
      )}

      {canClaimOpenOffer && showSwapNote && (
        <div className="mt-1.5 space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <p className="text-[11px] text-ink/50">
            Al je eigen diensten gaan automatisch mee in de mail, de
            aanbieder zoekt er zelf iets uit. Wil je specifiek iets
            voorstellen, kan dat hieronder (optioneel):
          </p>
          <input
            type="text"
            value={swapNote}
            onChange={(e) => setSwapNote(e.target.value)}
            placeholder="Bv. het liefst mijn dienst van vrijdag"
            className="w-full rounded-lg border border-line px-2 py-1 text-[11px] focus:border-awning focus:outline-none"
          />
          <div className="flex gap-1">
            <button
              onClick={() => claim(true, swapNote)}
              disabled={busy}
              className="flex-1 rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-paper hover:bg-awning disabled:opacity-50"
            >
              {busy ? "Bezig..." : "Ruilverzoek versturen"}
            </button>
            <button
              onClick={() => setShowSwapNote(false)}
              disabled={busy}
              className="rounded-full border border-line px-2 py-1 text-[11px] font-medium hover:border-ink disabled:opacity-50"
            >
              Terug
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
