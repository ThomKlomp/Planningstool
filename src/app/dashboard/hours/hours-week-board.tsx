"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTodayKey } from "@/lib/use-today-key";
import { workedHours, formatHours } from "@/lib/worked-hours";
import { EditableEntryPanel, StatusBadge, type Entry } from "./entry-parts";

// Uren op dezelfde manier getoond als het rooster: per dag een kaart, daarin
// per team de urenregels. Managers zien iedereen (en kunnen direct goedkeuren),
// medewerkers alleen hun eigen uren (en kunnen concept/teruggestuurde uren
// openen om te bevestigen of aan te passen).

type TeamGroup = { name: string; color: string | null; entries: Entry[] };

/** Zelfde volgorde als het rooster: alfabetisch, "Geen team" altijd als laatste. */
function groupByTeam(entries: Entry[]): TeamGroup[] {
  const groups = new Map<string, TeamGroup>();
  for (const e of entries) {
    const key = e.departmentName ?? "Geen team";
    if (!groups.has(key)) groups.set(key, { name: key, color: e.departmentColor, entries: [] });
    groups.get(key)!.entries.push(e);
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.name === "Geen team") return 1;
    if (b.name === "Geen team") return -1;
    return a.name.localeCompare(b.name);
  });
}

export default function HoursWeekBoard({
  canManage,
  week,
  entries,
  closedDates = [],
  closedReasons = {},
}: {
  canManage: boolean;
  week: string[]; // ISO-datums ma t/m zo
  entries: Entry[];
  closedDates?: string[]; // Date.toDateString()
  closedReasons?: Record<string, string>;
}) {
  const router = useRouter();
  const todayKey = useTodayKey();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [queryingId, setQueryingId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
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

  const openEntry = entries.find((e) => e.id === openEntryId) ?? null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {week.map((dateIso) => {
          const date = new Date(dateIso);
          const dayKey = date.toDateString();
          const isToday = todayKey === dayKey;

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
                {closedReasons[dayKey] && (
                  <p className="mt-1 text-[11px] text-ink/50">{closedReasons[dayKey]}</p>
                )}
              </div>
            );
          }

          const dayEntries = entries.filter((e) => new Date(e.date).toDateString() === dayKey);
          const dayHours = dayEntries
            .filter((e) => e.status !== "REJECTED")
            .reduce((sum, e) => sum + workedHours(e), 0);

          return (
            <div
              key={dateIso}
              className={
                isToday
                  ? "rounded-xl border border-ink bg-white p-3 shadow-[0_2px_0_0_#1B1B18]"
                  : "rounded-xl border border-line bg-white p-3"
              }
            >
              <p
                className={
                  isToday
                    ? "inline-block rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-paper"
                    : "text-xs uppercase tracking-wide text-ink/40"
                }
              >
                {date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}
              </p>

              <div className="mt-2 space-y-3">
                {groupByTeam(dayEntries).map((group) => (
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
                      {group.entries.map((entry) => {
                        const needsAction =
                          !canManage &&
                          (entry.status === "DRAFT" ||
                            entry.status === "QUERIED" ||
                            entry.status === "SUBMITTED");
                        const hours = workedHours(entry);
                        const tone =
                          !canManage && entry.status === "DRAFT"
                            ? "bg-awning/10"
                            : !canManage && entry.status === "QUERIED"
                            ? "bg-amber/15"
                            : "bg-mist";

                        return (
                          <div
                            key={entry.id}
                            onClick={needsAction ? () => setOpenEntryId(entry.id) : undefined}
                            className={`rounded-lg px-2 py-1.5 text-xs ${tone} ${
                              needsAction ? "cursor-pointer hover:opacity-80" : ""
                            }`}
                          >
                            {canManage && <p className="truncate font-medium">{entry.memberName}</p>}
                            <p className={canManage ? "text-ink/60" : "font-medium"}>
                              {entry.startTime}–{entry.endTime || "?"}
                              {entry.endTime && (
                                <span className="text-ink/40"> · {formatHours(hours)}</span>
                              )}
                            </p>
                            {entry.breakMinutes > 0 && (
                              <p className="text-[11px] text-ink/40">{entry.breakMinutes} min pauze</p>
                            )}
                            {entry.note && (
                              <p className="truncate text-[11px] text-ink/40">{entry.note}</p>
                            )}

                            <div className="mt-1">
                              {!canManage && entry.status === "DRAFT" ? (
                                <span className="text-[11px] font-medium text-awning">
                                  Bevestig je uren
                                </span>
                              ) : !canManage && entry.status === "QUERIED" ? (
                                <span className="text-[11px] font-medium text-amber-dark">
                                  Vraag van je manager
                                </span>
                              ) : (
                                <StatusBadge status={entry.status} small />
                              )}
                            </div>

                            {canManage && entry.status === "SUBMITTED" && (
                              <div className="mt-1.5 space-y-1">
                                <button
                                  onClick={() => review(entry.id, "APPROVED")}
                                  disabled={busyId === entry.id}
                                  className="w-full rounded-full bg-awning px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                                >
                                  Goedkeuren
                                </button>
                                <div className="flex justify-between text-[11px] text-ink/50">
                                  <button
                                    onClick={() =>
                                      setQueryingId(queryingId === entry.id ? null : entry.id)
                                    }
                                    disabled={busyId === entry.id}
                                    className="hover:text-ink hover:underline disabled:opacity-50"
                                  >
                                    Vraag stellen
                                  </button>
                                  <button
                                    onClick={() => review(entry.id, "REJECTED")}
                                    disabled={busyId === entry.id}
                                    className="hover:text-red-600 hover:underline disabled:opacity-50"
                                  >
                                    Afkeuren
                                  </button>
                                </div>
                              </div>
                            )}

                            {canManage && queryingId === entry.id && (
                              <div className="mt-1.5 space-y-1">
                                <input
                                  type="text"
                                  autoFocus
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  placeholder="Bv. Klopt de eindtijd?"
                                  className="w-full rounded-md border border-line bg-white px-2 py-1 text-[11px] focus:border-awning focus:outline-none"
                                />
                                <button
                                  onClick={() => submitQuery(entry.id)}
                                  disabled={busyId === entry.id || !comment.trim()}
                                  className="w-full rounded-full bg-ink px-2 py-1 text-[11px] font-medium text-paper disabled:opacity-50"
                                >
                                  Versturen
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {dayEntries.length === 0 && <p className="text-xs text-ink/40">Geen uren</p>}
              </div>

              {dayHours > 0 && (
                <p className="mt-3 border-t border-line pt-2 text-[11px] text-ink/50">
                  Totaal {formatHours(dayHours)}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Medewerker: uren bevestigen/aanpassen in een paneel (het formulier past niet in één dagkolom). */}
      {!canManage && openEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          onClick={() => setOpenEntryId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">
                {new Date(openEntry.date).toLocaleDateString("nl-NL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h3>
              <button
                onClick={() => setOpenEntryId(null)}
                className="rounded-full px-1.5 text-ink/40 hover:text-ink"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-ink/60">
              {openEntry.startTime}–{openEntry.endTime || "?"}
            </p>
            <EditableEntryPanel
              entry={openEntry}
              editing={editingId === openEntry.id || openEntry.status === "DRAFT"}
              busy={busyId === openEntry.id}
              onStartEdit={() => setEditingId(openEntry.id)}
              onCancel={() => {
                setEditingId(null);
                setOpenEntryId(null);
              }}
              onSubmit={async (fields) => {
                setBusyId(openEntry.id);
                await fetch(`/api/time-entries/${openEntry.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(fields),
                });
                setBusyId(null);
                setEditingId(null);
                setOpenEntryId(null);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
