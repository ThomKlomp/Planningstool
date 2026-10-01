"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dayName, dayNamePlural } from "@/lib/recurring-shifts-labels";

type Team = { id: string; name: string };
type Member = { id: string; name: string; teams: Team[] }; // teams: hoofdteam eerst
type Template = { id: string; name: string; startTime: string; endTime: string };
type Pattern = {
  id: string;
  membershipId: string;
  memberName: string;
  weekday: number;
  startTime: string;
  endTime: string;
  role: string | null;
  departmentName: string | null;
};

// Volgorde in de keuzelijst: maandag eerst (zoals in het rooster).
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function RecurringShiftsManager({
  members,
  templates,
  initialPatterns,
}: {
  members: Member[];
  templates: Template[];
  initialPatterns: Pattern[];
}) {
  const router = useRouter();
  const [patterns, setPatterns] = useState(initialPatterns);
  const [membershipId, setMembershipId] = useState("");
  const [weekday, setWeekday] = useState(6);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("18:00");
  const [role, setRole] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedTeams = members.find((m) => m.id === membershipId)?.teams ?? [];

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!membershipId) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/recurring-shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        membershipId,
        weekday,
        startTime,
        endTime,
        role: role || undefined,
        departmentId: departmentId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Toevoegen mislukt.");
      return;
    }

    const member = members.find((m) => m.id === membershipId);
    const team = member?.teams.find((t) => t.id === departmentId);
    setPatterns((prev) => [
      ...prev,
      {
        id: data.pattern.id,
        membershipId,
        memberName: member?.name ?? "",
        weekday,
        startTime,
        endTime,
        role: role || null,
        departmentName: team?.name ?? null,
      },
    ]);
    setMessage(
      `Toegevoegd. Er staan nu ${data.created} diensten in het rooster voor de komende ${data.weeksAhead} weken, daarna vult het zichzelf aan.`
    );
    setRole("");
    setDepartmentId("");
    router.refresh();
  }

  async function remove(pattern: Pattern) {
    if (
      !confirm(
        `Deze vaste dienst van ${pattern.memberName} stoppen? Nog niet gewerkte diensten die je niet zelf hebt aangepast verdwijnen uit het rooster.`
      )
    )
      return;
    setBusyId(pattern.id);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/recurring-shifts/${pattern.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) {
      setError(data.error ?? "Stoppen mislukt.");
      return;
    }
    setPatterns((prev) => prev.filter((p) => p.id !== pattern.id));
    setMessage(`Gestopt. ${data.removedShifts} nog niet gewerkte diensten zijn uit het rooster gehaald.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {patterns.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {patterns.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span>
                <span className="font-medium">{p.memberName}</span>
                <span className="text-ink/60">
                  {" "}
                  · elke {dayName(p.weekday)} {p.startTime}–{p.endTime}
                  {p.role ? ` · ${p.role}` : ""}
                  {p.departmentName ? ` · ${p.departmentName}` : ""}
                </span>
              </span>
              <button
                onClick={() => remove(p)}
                disabled={busyId === p.id}
                className="shrink-0 text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Stoppen
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-3 rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-ink/60">Medewerker</label>
            <select
              value={membershipId}
              onChange={(e) => {
                setMembershipId(e.target.value);
                setDepartmentId("");
              }}
              className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            >
              <option value="">Kies een medewerker</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/60">Elke</label>
            <select
              value={weekday}
              onChange={(e) => setWeekday(Number(e.target.value))}
              className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            >
              {WEEKDAY_ORDER.map((d) => (
                <option key={d} value={d}>
                  {dayName(d)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/60">Van</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-ink/60">Tot</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
        </div>

        {templates.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setStartTime(t.startTime);
                  setEndTime(t.endTime);
                }}
                className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-medium text-ink/70 hover:bg-ink hover:text-paper"
              >
                {t.name} ({t.startTime}–{t.endTime})
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-ink/60">Functie (optioneel)</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
          {selectedTeams.length > 1 && (
            <div>
              <label className="block text-xs text-ink/60">Voor welk team?</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="mt-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
              >
                <option value="">{selectedTeams[0].name} (hoofdteam)</option>
                {selectedTeams.slice(1).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            disabled={saving || !membershipId}
            className="rounded-full bg-orange px-4 py-2 text-sm font-medium text-ink hover:bg-orange-dark disabled:opacity-50"
          >
            {saving ? "Bezig..." : `Elke ${dayName(weekday)} toevoegen`}
          </button>
        </div>
        <p className="text-xs text-ink/50">
          De diensten worden 8 weken vooruit in het rooster gezet en vullen zichzelf daarna elke
          dag aan. Op gesloten dagen komt er geen dienst. Losse {dayNamePlural(weekday)} kun je
          gewoon aanpassen of verwijderen in het rooster; die komen niet terug.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-awning">{message}</p>}
      </form>
    </div>
  );
}
