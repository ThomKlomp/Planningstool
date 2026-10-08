"use client";

import { useState } from "react";
import { VENUES, type Venue } from "./marketing/venue";

// Zelfde teams, mensen en standaarddiensten als de echte demo-zaak
// (api/admin/demo-company/reset), zodat dit precies aanvoelt als de tool
// zelf, geen verzonnen namen of afwijkende flow.
type Team = string;

type Person = { id: string; name: string; team: Team };

function makePeople(teamA: string, teamB: string, teamC?: string): Person[] {
  return [
    { id: "julia", name: "Julia Bakker", team: teamA },
    { id: "tom", name: "Tom Visser", team: teamA },
    { id: "nina", name: "Nina de Boer", team: teamA },
    { id: "mark", name: "Mark Jansen", team: teamA },
    { id: "ahmed", name: "Ahmed El Idrissi", team: teamB },
    { id: "lotte", name: "Lotte Smit", team: teamB },
    { id: "elif", name: "Elif Yildiz", team: teamB },
    ...(teamC ? [{ id: "daan", name: "Daan Mulder", team: teamC }] : []),
  ];
}

const TEAM_STYLE = {
  first: { color: "text-awning", dot: "bg-awning" },
  second: { color: "text-amber-dark", dot: "bg-amber" },
  third: { color: "text-[#6B4B9A]", dot: "bg-[#A58BCB]" },
};

type Shift = { id: string; personId: string; startTime: string; endTime: string; role: string };
type Day = { label: string; shifts: Shift[] };

let nextId = 100; // startpunt ruim boven de meegeleverde voorbeeld-ID's

function makeInitialDays(venue: Venue): Day[] {
  const v = VENUES[venue];
  const [eveStart, eveEnd] = v.eve;
  const [lateStart, lateEnd] = v.late;
  return [
    {
      label: "Wo 7",
      shifts: [
        { id: "1", personId: "julia", startTime: "12:00", endTime: "18:00", role: "" },
        { id: "2", personId: "tom", startTime: eveStart, endTime: eveEnd, role: "" },
        { id: "3", personId: "ahmed", startTime: eveStart, endTime: eveEnd, role: v.kok },
        ...(v.teamC ? [{ id: "7", personId: "daan", startTime: eveStart, endTime: eveEnd, role: "" }] : []),
      ],
    },
    {
      label: "Do 8",
      shifts: [
        { id: "4", personId: "nina", startTime: "12:00", endTime: "18:00", role: "" },
        { id: "5", personId: "lotte", startTime: eveStart, endTime: eveEnd, role: v.kok },
        ...(v.teamC ? [{ id: "8", personId: "daan", startTime: eveStart, endTime: eveEnd, role: "" }] : []),
      ],
    },
    {
      label: "Vr 9",
      shifts: [
        { id: "6", personId: "mark", startTime: lateStart, endTime: lateEnd, role: "" },
        ...(v.teamC ? [{ id: "9", personId: "daan", startTime: lateStart, endTime: lateEnd, role: "" }] : []),
      ],
    },
  ];
}


/** "12:00" → "12", "12:30" → "12:30" (net als in de echte tool, compact waar het kan). */
function shortTime(t: string) {
  const [h, m] = t.split(":");
  const hh = String(Number(h));
  return m === "00" ? hh : `${hh}:${m}`;
}

/** "17:00","01:00" → "17–01". Loopt de dienst door na middernacht, dan blijft de eindtijd tweecijferig ("17–1" leest als een tikfout). */
function timeRange(start: string, end: string) {
  if (end > start) return `${shortTime(start)}–${shortTime(end)}`;
  const [h, m] = end.split(":");
  const endLabel = `${h.padStart(2, "0")}${m && m !== "00" ? `:${m}` : ""}`;
  return `${shortTime(start)}–${endLabel}`;
}

type Editing = { dayIndex: number; shiftId?: string };

export default function ScheduleMock({ venue = "horeca" }: { venue?: Venue }) {
  const v = VENUES[venue];
  const TEAMS: Team[] = [v.teamA, v.teamB, ...(v.teamC ? [v.teamC] : [])];
  const PEOPLE = makePeople(v.teamA, v.teamB, v.teamC);
  const TEMPLATES = v.templates;
  const personById = (id: string) => PEOPLE.find((p) => p.id === id);
  const [eveStart, eveEnd] = v.eve;
  const [days, setDays] = useState<Day[]>(() => makeInitialDays(venue));
  const [editing, setEditing] = useState<Editing | null>(null);
  const [personId, setPersonId] = useState("");
  const [startTime, setStartTime] = useState(eveStart);
  const [endTime, setEndTime] = useState(eveEnd);
  const [role, setRole] = useState("");

  function openCreate(dayIndex: number) {
    setEditing({ dayIndex });
    setPersonId("");
    setStartTime(eveStart);
    setEndTime(eveEnd);
    setRole("");
  }

  function openEdit(dayIndex: number, shift: Shift) {
    setEditing({ dayIndex, shiftId: shift.id });
    setPersonId(shift.personId);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setRole(shift.role);
  }

  function close() {
    setEditing(null);
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setStartTime(t.startTime);
    setEndTime(t.endTime);
  }

  function save() {
    if (!editing || !personId) return;
    setDays((prev) =>
      prev.map((day, di) => {
        if (di !== editing.dayIndex) return day;
        if (editing.shiftId) {
          return {
            ...day,
            shifts: day.shifts.map((s) =>
              s.id === editing.shiftId ? { ...s, personId, startTime, endTime, role } : s
            ),
          };
        }
        return {
          ...day,
          shifts: [...day.shifts, { id: String(nextId++), personId, startTime, endTime, role }],
        };
      })
    );
    close();
  }

  function remove() {
    if (!editing?.shiftId) return;
    setDays((prev) =>
      prev.map((day, di) =>
        di !== editing.dayIndex
          ? day
          : { ...day, shifts: day.shifts.filter((s) => s.id !== editing.shiftId) }
      )
    );
    close();
  }

  // Telt hoeveel diensten er al gerenderd zijn tijdens deze render-pas, puur
  // om ze bij het laden van de pagina na elkaar (gestaffeld) te laten
  // "landen" i.p.v. allemaal tegelijk. Lokale, wegwerp-teller per render,
  // hoort niet in state/een ref.
  let shiftLandIndex = 0;

  return (
    <div>
      <div className="relative rounded-2xl border border-line bg-white p-4 shadow-[0_2px_0_0_#DDD5C7] md:p-5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs uppercase tracking-wide text-ink/40">Week 41</p>
          <span className="rounded-full bg-awning/10 px-2 py-0.5 text-[11px] font-medium text-awning">
            Open
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {days.map((day, dayIndex) => {
            return (
              <div key={day.label}>
                <p className="text-center text-[10px] text-ink/40">{day.label}</p>
                <div className="mt-1.5 space-y-2">
                  {TEAMS.map((team) => {
                    const style =
                      team === v.teamA ? TEAM_STYLE.first : team === v.teamB ? TEAM_STYLE.second : TEAM_STYLE.third;
                    const shiftsForTeam = day.shifts.filter((s) => personById(s.personId)?.team === team);
                    return (
                      <div key={team}>
                        <p
                          className={`flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide ${style.color}`}
                        >
                          <span className={`h-1 w-1 rounded-full ${style.dot}`} />
                          {team}
                        </p>
                        <div className="mt-1 space-y-1">
                          {shiftsForTeam.map((s) => {
                            const person = personById(s.personId);
                            const delayMs = 2700 + Math.min(shiftLandIndex * 55, 480);
                            shiftLandIndex += 1;
                            return (
                              <button
                                key={s.id}
                                onClick={() => openEdit(dayIndex, s)}
                                className="hero-shift-land block w-full rounded-md bg-mist px-1.5 py-1 text-left transition-colors hover:bg-line/60"
                                style={{ animationDelay: `${delayMs}ms` }}
                              >
                                <p className="truncate text-[9px] font-medium leading-tight">
                                  {person?.name}
                                  {s.role ? ` · ${s.role}` : ""}
                                </p>
                                <p className="text-[8px] leading-tight text-ink/50">
                                  {timeRange(s.startTime, s.endTime)}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => openCreate(dayIndex)}
                  className="mt-1.5 flex w-full items-center justify-center rounded-md border border-dashed border-line py-1 text-[10px] text-ink/30 transition-colors hover:border-awning hover:text-awning"
                  aria-label={`Dienst toevoegen op ${day.label}`}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>

        {/* Overlay blijft binnen de kaart, geen paginavullende modal */}
        {editing && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 p-3 backdrop-blur-sm"
            onClick={close}
          >
            <div
              className="w-full max-w-[260px] rounded-xl border border-line bg-white p-3 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-medium text-ink/70">
                {editing.shiftId ? "Dienst aanpassen" : "Dienst toevoegen"}
              </p>
              <p className="mt-0.5 text-[10px] text-ink/40">{days[editing.dayIndex].label}</p>

              <div className="mt-2 space-y-1.5">
                {!editing.shiftId && (
                  <div className="flex flex-wrap gap-1">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => applyTemplate(t)}
                        className="rounded-full bg-mist px-2 py-0.5 text-[9px] font-medium text-ink/70 hover:bg-ink hover:text-paper"
                      >
                        {t.name} ({timeRange(t.startTime, t.endTime)})
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-1/2 rounded-md border border-line px-1.5 py-1 text-[11px] focus:border-awning focus:outline-none"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-1/2 rounded-md border border-line px-1.5 py-1 text-[11px] focus:border-awning focus:outline-none"
                  />
                </div>

                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full rounded-md border border-line px-1.5 py-1 text-[11px] focus:border-awning focus:outline-none"
                >
                  <option value="">Kies een medewerker</option>
                  {TEAMS.map((team) => (
                    <optgroup key={team} label={team}>
                      {PEOPLE.filter((p) => p.team === team).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Functie (optioneel)"
                  className="w-full rounded-md border border-line px-1.5 py-1 text-[11px] focus:border-awning focus:outline-none"
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                {editing.shiftId ? (
                  <button onClick={remove} className="text-[10px] text-red-600 hover:underline">
                    Verwijderen
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-1.5">
                  <button
                    onClick={close}
                    className="rounded-full border border-line px-2.5 py-1 text-[10px] font-medium hover:border-ink"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={save}
                    disabled={!personId}
                    className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-medium text-paper hover:bg-awning disabled:opacity-40"
                  >
                    Opslaan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-ink/40">
        Probeer het: klik op een dienst, of op + om er zelf een toe te voegen.
      </p>
    </div>
  );
}
