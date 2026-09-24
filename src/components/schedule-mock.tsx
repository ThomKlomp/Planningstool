"use client";

import { useState } from "react";

// Zelfde teams, mensen en standaarddiensten als de echte demo-zaak
// (api/admin/demo-company/reset), zodat dit precies aanvoelt als de tool
// zelf, geen verzonnen namen of afwijkende flow.
type Team = "Bediening" | "Keuken";

type Person = { id: string; name: string; team: Team };

const PEOPLE: Person[] = [
  { id: "julia", name: "Julia Bakker", team: "Bediening" },
  { id: "tom", name: "Tom Visser", team: "Bediening" },
  { id: "nina", name: "Nina de Boer", team: "Bediening" },
  { id: "mark", name: "Mark Jansen", team: "Bediening" },
  { id: "ahmed", name: "Ahmed El Idrissi", team: "Keuken" },
  { id: "lotte", name: "Lotte Smit", team: "Keuken" },
  { id: "elif", name: "Elif Yildiz", team: "Keuken" },
];

const TEAM_STYLE: Record<Team, { color: string; dot: string }> = {
  Bediening: { color: "text-awning", dot: "bg-awning" },
  Keuken: { color: "text-amber-dark", dot: "bg-amber" },
};

const TEMPLATES = [
  { id: "middag", name: "Middagshift", startTime: "12:00", endTime: "18:00" },
  { id: "avond", name: "Avondshift", startTime: "17:00", endTime: "23:00" },
];

type Shift = { id: string; personId: string; startTime: string; endTime: string; role: string };
type Day = { label: string; shifts: Shift[] };

let nextId = 100; // startpunt ruim boven de meegeleverde voorbeeld-ID's

const initialDays: Day[] = [
  {
    label: "Wo 16",
    shifts: [
      { id: "1", personId: "julia", startTime: "12:00", endTime: "18:00", role: "" },
      { id: "2", personId: "tom", startTime: "17:00", endTime: "23:00", role: "" },
      { id: "3", personId: "ahmed", startTime: "17:00", endTime: "23:00", role: "Kok" },
    ],
  },
  {
    label: "Do 17",
    shifts: [
      { id: "4", personId: "nina", startTime: "12:00", endTime: "18:00", role: "" },
      { id: "5", personId: "lotte", startTime: "17:00", endTime: "23:00", role: "Kok" },
    ],
  },
  {
    label: "Vr 18",
    shifts: [{ id: "6", personId: "mark", startTime: "17:00", endTime: "23:00", role: "" }],
  },
];

function personById(id: string) {
  return PEOPLE.find((p) => p.id === id);
}

/** "12:00" → "12", "12:30" → "12:30" (net als in de echte tool, compact waar het kan). */
function shortTime(t: string) {
  const [h, m] = t.split(":");
  const hh = String(Number(h));
  return m === "00" ? hh : `${hh}:${m}`;
}

type Editing = { dayIndex: number; shiftId?: string };

export default function ScheduleMock() {
  const [days, setDays] = useState<Day[]>(initialDays);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [personId, setPersonId] = useState("");
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("23:00");
  const [role, setRole] = useState("");

  function openCreate(dayIndex: number) {
    setEditing({ dayIndex });
    setPersonId("");
    setStartTime("17:00");
    setEndTime("23:00");
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

  return (
    <div>
      <div className="relative rounded-2xl border border-line bg-white p-4 shadow-[0_2px_0_0_#DDD5C7] md:p-5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs uppercase tracking-wide text-ink/40">Week 38</p>
          <span className="rounded-full bg-awning/10 px-2 py-0.5 text-[11px] font-medium text-awning">
            Open
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {days.map((day, dayIndex) => {
            const teams: Team[] = ["Bediening", "Keuken"];
            return (
              <div key={day.label}>
                <p className="text-center text-[10px] text-ink/40">{day.label}</p>
                <div className="mt-1.5 space-y-2">
                  {teams.map((team) => {
                    const style = TEAM_STYLE[team];
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
                            return (
                              <button
                                key={s.id}
                                onClick={() => openEdit(dayIndex, s)}
                                className="block w-full rounded-md bg-paper px-1.5 py-1 text-left transition-colors hover:bg-line/60"
                              >
                                <p className="truncate text-[9px] font-medium leading-tight">
                                  {person?.name}
                                  {s.role ? ` · ${s.role}` : ""}
                                </p>
                                <p className="text-[8px] leading-tight text-ink/50">
                                  {shortTime(s.startTime)}–{shortTime(s.endTime)}
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
                        className="rounded-full bg-paper px-2 py-0.5 text-[9px] font-medium text-ink/70 hover:bg-ink hover:text-paper"
                      >
                        {t.name} ({shortTime(t.startTime)}–{shortTime(t.endTime)})
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
                  {(["Bediening", "Keuken"] as Team[]).map((team) => (
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
