"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Entry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  status: string;
  note: string | null;
  managerComment: string | null;
  memberName: string;
};

export default function TimeEntryList({
  canManage,
  entries,
}: {
  canManage: boolean;
  entries: Entry[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [queryingId, setQueryingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    await fetch(`/api/time-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function submitQuery(id: string) {
    if (!comment.trim()) return;
    setBusyId(id);
    await fetch(`/api/time-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "QUERIED", comment }),
    });
    setBusyId(null);
    setQueryingId(null);
    setComment("");
    router.refresh();
  }

  if (entries.length === 0) {
    return <p className="text-sm text-ink/50">Nog geen uren ingediend.</p>;
  }

  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-white">
      {entries.map((entry) => (
        <li key={entry.id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                {canManage ? `${entry.memberName} · ` : ""}
                {new Date(entry.date).toLocaleDateString("nl-NL", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <p className="text-xs text-ink/50">
                {entry.startTime}–{entry.endTime}
                {entry.breakMinutes > 0 ? ` · ${entry.breakMinutes} min pauze` : ""}
                {entry.note ? ` · ${entry.note}` : ""}
              </p>
            </div>

            {canManage && entry.status === "SUBMITTED" ? (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => review(entry.id, "APPROVED")}
                  disabled={busyId === entry.id}
                  className="rounded-full bg-awning px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  Goedkeuren
                </button>
                <button
                  onClick={() => setQueryingId(queryingId === entry.id ? null : entry.id)}
                  disabled={busyId === entry.id}
                  className="rounded-full border border-line px-3 py-1 text-xs font-medium disabled:opacity-50"
                >
                  Vraag stellen
                </button>
                <button
                  onClick={() => review(entry.id, "REJECTED")}
                  disabled={busyId === entry.id}
                  className="rounded-full border border-line px-3 py-1 text-xs font-medium disabled:opacity-50"
                >
                  Afkeuren
                </button>
              </div>
            ) : !canManage && (entry.status === "QUERIED" || entry.status === "DRAFT") ? null : (
              <StatusBadge status={entry.status} />
            )}
          </div>

          {canManage && queryingId === entry.id && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                autoFocus
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bv. Klopt de eindtijd wel?"
                className="flex-1 rounded-lg border border-line px-3 py-1.5 text-sm focus:border-awning focus:outline-none"
              />
              <button
                onClick={() => submitQuery(entry.id)}
                disabled={busyId === entry.id || !comment.trim()}
                className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper disabled:opacity-50"
              >
                Versturen
              </button>
            </div>
          )}

          {!canManage && (entry.status === "QUERIED" || entry.status === "DRAFT") && (
            <EditableEntryPanel
              entry={entry}
              editing={editingId === entry.id || entry.status === "DRAFT"}
              busy={busyId === entry.id}
              onStartEdit={() => setEditingId(entry.id)}
              onCancel={() => setEditingId(null)}
              onSubmit={async (fields) => {
                setBusyId(entry.id);
                await fetch(`/api/time-entries/${entry.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(fields),
                });
                setBusyId(null);
                setEditingId(null);
                router.refresh();
              }}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function EditableEntryPanel({
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

  return (
    <div className={`mt-3 rounded-lg p-3 ${isDraft ? "bg-awning/10" : "bg-amber/10"}`}>
      {isDraft ? (
        <p className="text-xs font-medium text-awning">
          Vooraf ingevuld op basis van je shift — check de tijden en bevestig.
        </p>
      ) : (
        <>
          <p className="text-xs font-medium text-amber-dark">Vraag van je manager:</p>
          <p className="mt-1 text-sm text-ink/80">{entry.managerComment}</p>
        </>
      )}

      {!editing ? (
        <button
          onClick={onStartEdit}
          className="mt-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium hover:border-ink"
        >
          Aanpassen &amp; opnieuw indienen
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
            <label className="block text-[11px] text-ink/60">Tot</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 rounded-lg border border-line px-2 py-1 text-xs"
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
              disabled={busy}
              className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper disabled:opacity-50"
            >
              {isDraft ? "Bevestigen & indienen" : "Opnieuw indienen"}
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

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "APPROVED"
      ? "Goedgekeurd"
      : status === "REJECTED"
      ? "Afgekeurd"
      : status === "QUERIED"
      ? "Vraag gesteld"
      : status === "DRAFT"
      ? "Concept — nog te bevestigen"
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
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
