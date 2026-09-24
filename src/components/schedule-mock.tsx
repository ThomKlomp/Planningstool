"use client";

import { useState } from "react";

type Shift = { id: string; name: string; time: string };
type TeamGroup = { team: string; color: string; dot: string; shifts: Shift[] };
type Day = { label: string; groups: TeamGroup[] };

let nextId = 100; // startpunt ruim boven de meegeleverde voorbeeld-ID's

const initialDays: Day[] = [
  {
    label: "Wo 16",
    groups: [
      {
        team: "Bediening",
        color: "text-awning",
        dot: "bg-awning",
        shifts: [
          { id: "1", name: "Julia Bakker", time: "12–18" },
          { id: "2", name: "Tom Visser", time: "17–23" },
        ],
      },
      {
        team: "Keuken",
        color: "text-amber-dark",
        dot: "bg-amber",
        shifts: [{ id: "3", name: "Ahmed · Kok", time: "17–23" }],
      },
    ],
  },
  {
    label: "Do 17",
    groups: [
      {
        team: "Bediening",
        color: "text-awning",
        dot: "bg-awning",
        shifts: [{ id: "4", name: "Nina de Boer", time: "12–18" }],
      },
      {
        team: "Keuken",
        color: "text-amber-dark",
        dot: "bg-amber",
        shifts: [{ id: "5", name: "Lotte · Kok", time: "17–23" }],
      },
    ],
  },
  {
    label: "Vr 18",
    groups: [
      {
        team: "Bediening",
        color: "text-awning",
        dot: "bg-awning",
        shifts: [{ id: "6", name: "Mark Jansen", time: "17–23" }],
      },
      {
        team: "Keuken",
        color: "text-amber-dark",
        dot: "bg-amber",
        shifts: [],
      },
    ],
  },
];

/** Locatie van een dienst (of een lege plek waar je er een kunt toevoegen). */
type Target = { dayIndex: number; teamIndex: number; shiftId?: string };

export default function ScheduleMock() {
  const [days, setDays] = useState<Day[]>(initialDays);
  const [editing, setEditing] = useState<Target | null>(null);
  const [name, setName] = useState("");
  const [time, setTime] = useState("");

  function openCreate(dayIndex: number, teamIndex: number) {
    setEditing({ dayIndex, teamIndex });
    setName("");
    setTime("");
  }

  function openEdit(dayIndex: number, teamIndex: number, shift: Shift) {
    setEditing({ dayIndex, teamIndex, shiftId: shift.id });
    setName(shift.name);
    setTime(shift.time);
  }

  function close() {
    setEditing(null);
  }

  function save() {
    if (!editing || !name.trim() || !time.trim()) return;
    setDays((prev) =>
      prev.map((day, di) => {
        if (di !== editing.dayIndex) return day;
        return {
          ...day,
          groups: day.groups.map((group, ti) => {
            if (ti !== editing.teamIndex) return group;
            if (editing.shiftId) {
              return {
                ...group,
                shifts: group.shifts.map((s) =>
                  s.id === editing.shiftId ? { ...s, name: name.trim(), time: time.trim() } : s
                ),
              };
            }
            return {
              ...group,
              shifts: [...group.shifts, { id: String(nextId++), name: name.trim(), time: time.trim() }],
            };
          }),
        };
      })
    );
    close();
  }

  function remove() {
    if (!editing?.shiftId) return;
    setDays((prev) =>
      prev.map((day, di) => {
        if (di !== editing.dayIndex) return day;
        return {
          ...day,
          groups: day.groups.map((group, ti) => {
            if (ti !== editing.teamIndex) return group;
            return { ...group, shifts: group.shifts.filter((s) => s.id !== editing.shiftId) };
          }),
        };
      })
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
          {days.map((d, dayIndex) => (
            <div key={d.label}>
              <p className="text-center text-[10px] text-ink/40">{d.label}</p>
              <div className="mt-1.5 space-y-2">
                {d.groups.map((g, teamIndex) => (
                  <div key={g.team}>
                    <p
                      className={`flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide ${g.color}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${g.dot}`} />
                      {g.team}
                    </p>
                    <div className="mt-1 space-y-1">
                      {g.shifts.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => openEdit(dayIndex, teamIndex, s)}
                          className="block w-full rounded-md bg-paper px-1.5 py-1 text-left transition-colors hover:bg-line/60"
                        >
                          <p className="truncate text-[9px] font-medium leading-tight">{s.name}</p>
                          <p className="text-[8px] leading-tight text-ink/50">{s.time}</p>
                        </button>
                      ))}
                      <button
                        onClick={() => openCreate(dayIndex, teamIndex)}
                        className="flex w-full items-center justify-center rounded-md border border-dashed border-line py-1 text-[10px] text-ink/30 transition-colors hover:border-awning hover:text-awning"
                        aria-label={`Dienst toevoegen bij ${g.team} op ${d.label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Overlay blijft binnen de kaart, geen paginavullende modal */}
        {editing && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/95 p-4 backdrop-blur-sm"
            onClick={close}
          >
            <div
              className="w-full max-w-[240px] rounded-xl border border-line bg-white p-3 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs font-medium text-ink/70">
                {editing.shiftId ? "Dienst aanpassen" : "Dienst toevoegen"}
              </p>
              <p className="mt-0.5 text-[10px] text-ink/40">
                {days[editing.dayIndex].label} · {days[editing.dayIndex].groups[editing.teamIndex].team}
              </p>
              <div className="mt-2 space-y-1.5">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Naam"
                  className="w-full rounded-md border border-line px-2 py-1 text-[11px] focus:border-awning focus:outline-none"
                />
                <input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Tijd, bv. 17–23"
                  className="w-full rounded-md border border-line px-2 py-1 text-[11px] focus:border-awning focus:outline-none"
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
                    disabled={!name.trim() || !time.trim()}
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
        Probeer het: klik op een dienst of op + om er zelf een toe te voegen.
      </p>
    </div>
  );
}
