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

  if (entries.length === 0) {
    return <p className="text-sm text-ink/50">Nog geen uren ingediend.</p>;
  }

  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-white">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3">
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
            <div className="flex gap-2">
              <button
                onClick={() => review(entry.id, "APPROVED")}
                disabled={busyId === entry.id}
                className="rounded-full bg-awning px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                Goedkeuren
              </button>
              <button
                onClick={() => review(entry.id, "REJECTED")}
                disabled={busyId === entry.id}
                className="rounded-full border border-line px-3 py-1 text-xs font-medium disabled:opacity-50"
              >
                Afkeuren
              </button>
            </div>
          ) : (
            <StatusBadge status={entry.status} />
          )}
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "APPROVED" ? "Goedgekeurd" : status === "REJECTED" ? "Afgekeurd" : "In behandeling";
  const classes =
    status === "APPROVED"
      ? "bg-awning/10 text-awning"
      : status === "REJECTED"
      ? "bg-red-50 text-red-600"
      : "bg-amber/10 text-amber-dark";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${classes}`}>{label}</span>
  );
}
