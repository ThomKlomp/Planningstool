"use client";

import { useState } from "react";

// Gedeelde onderdelen van de urenweergave (zie hours-week-board.tsx).

export type Entry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  status: string;
  note: string | null;
  managerComment: string | null;
  memberName: string;
  departmentName: string | null;
  departmentColor: string | null;
  departmentOrder: number | null;
  notScheduled?: boolean; // alleen voor managers: ingediend op een dag waarop deze medewerker niet op het rooster staat
};

export function EditableEntryPanel({
  entry,
  editing,
  busy,
  onStartEdit,
  onCancel,
  onSubmit,
}: {
  entry: Entry;
  editing: boolean;
  busy: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSubmit: (fields: {
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    note: string;
  }) => void;
}) {
  const [date, setDate] = useState(entry.date.slice(0, 10));
  const [startTime, setStartTime] = useState(entry.startTime);
  const [endTime, setEndTime] = useState(entry.endTime);
  const [breakMinutes, setBreakMinutes] = useState(String(entry.breakMinutes));
  const [note, setNote] = useState(entry.note ?? "");

  const isDraft = entry.status === "DRAFT";
  const isQueried = entry.status === "QUERIED";
  const isSubmitted = entry.status === "SUBMITTED";

  return (
    <div
      className={`mt-3 rounded-lg p-3 ${
        isDraft ? "bg-awning/10" : isQueried ? "bg-amber/10" : "bg-ink/5"
      }`}
    >
      {isDraft && (
        <p className="text-xs font-medium text-awning">
          Vooraf ingevuld op basis van je shift, check de tijden en bevestig.
        </p>
      )}
      {isQueried && (
        <>
          <p className="text-xs font-medium text-amber-dark">Vraag van je manager:</p>
          <p className="mt-1 text-sm text-ink/80">{entry.managerComment}</p>
        </>
      )}
      {isSubmitted && (
        <p className="text-xs font-medium text-ink/50">
          In behandeling, je kunt dit nog aanpassen zolang je manager het
          niet heeft goedgekeurd.
        </p>
      )}

      {!editing ? (
        <button
          onClick={onStartEdit}
          className="mt-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium hover:border-ink"
        >
          {isSubmitted ? "Aanpassen" : "Aanpassen & opnieuw indienen"}
        </button>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[11px] text-ink/60">Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 rounded-lg border border-line px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-ink/60">Van</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 rounded-lg border border-line px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-ink/60">
              Tot{isDraft && <span className="text-awning"> · vul in</span>}
            </label>
            <input
              type="time"
              required={isDraft}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={`mt-1 rounded-lg border px-2 py-1 text-xs ${
                isDraft && !endTime ? "border-awning" : "border-line"
              }`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-ink/60">Pauze (min)</label>
            <input
              type="number"
              min={0}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              className="mt-1 w-20 rounded-lg border border-line px-2 py-1 text-xs"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[11px] text-ink/60">Notitie</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-2 py-1 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                onSubmit({
                  date,
                  startTime,
                  endTime,
                  breakMinutes: Number(breakMinutes) || 0,
                  note,
                })
              }
              disabled={busy || (isDraft && !endTime)}
              className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper disabled:opacity-50"
            >
              {isDraft ? "Bevestigen & indienen" : isSubmitted ? "Wijzigingen opslaan" : "Opnieuw indienen"}
            </button>
            {!isDraft && (
              <button
                onClick={onCancel}
                disabled={busy}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                Annuleren
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status, small = false }: { status: string; small?: boolean }) {
  const label =
    status === "APPROVED"
      ? "Goedgekeurd"
      : status === "REJECTED"
      ? "Afgekeurd"
      : status === "QUERIED"
      ? "Vraag gesteld"
      : status === "DRAFT"
      ? "Concept, nog te bevestigen"
      : "In behandeling";
  const classes =
    status === "APPROVED"
      ? "bg-awning/10 text-awning"
      : status === "REJECTED"
      ? "bg-red-50 text-red-600"
      : status === "QUERIED"
      ? "bg-amber/20 text-amber-dark"
      : status === "DRAFT"
      ? "bg-awning/10 text-awning"
      : "bg-amber/10 text-amber-dark";
  return (
    <span
      className={`inline-block max-w-full shrink-0 rounded-2xl font-medium leading-snug ${
        small ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${classes}`}
    >
      {label}
    </span>
  );
}
