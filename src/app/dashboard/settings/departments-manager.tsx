"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PALETTE = [
  "#3F6E5B",
  "#C9821F",
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#0D9488",
  "#92400E",
  "#475569",
];

type Department = { id: string; name: string; color: string; order: number };
type Member = {
  membershipId: string;
  name: string;
  departmentId: string | null;
  extraDepartmentIds: string[];
};

export default function DepartmentsManager({
  initialDepartments,
  members,
}: {
  initialDepartments: Department[];
  members: Member[];
}) {
  const [departments, setDepartments] = useState(
    [...initialDepartments].sort((a, b) => a.order - b.order)
  );
  const [assignments, setAssignments] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const m of members) map[m.membershipId] = m.departmentId;
    return map;
  });
  // Extra teams per medewerker (naast het hoofdteam): een uitzondering, dus
  // standaard ingeklapt en alleen te openen via een klein tekstlinkje.
  const [extras, setExtras] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    for (const m of members) map[m.membershipId] = m.extraDepartmentIds;
    return map;
  });
  const [openExtrasId, setOpenExtrasId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setDepartments((prev) => [...prev, data.department]);
      setName("");
      setColor(PALETTE[(departments.length + 1) % PALETTE.length]);
      router.refresh();
    }
    setSaving(false);
  }

  async function removeDepartment(id: string) {
    if (!confirm("Dit team verwijderen? Leden verliezen hun team-koppeling.")) return;
    setBusyId(id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setAssignments((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === id) next[key] = null;
      }
      return next;
    });
    setExtras((prev) => {
      const next: Record<string, string[]> = {};
      for (const key of Object.keys(prev)) next[key] = prev[key].filter((d) => d !== id);
      return next;
    });
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= departments.length) return;

    const reordered = [...departments];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setDepartments(reordered);

    // Volgorde-waardes gelijktrekken met de nieuwe positie in de lijst.
    await Promise.all(
      reordered.map((d, i) =>
        fetch(`/api/departments/${d.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: i }),
        })
      )
    );
    router.refresh();
  }

  async function assignMember(membershipId: string, departmentId: string) {
    setAssignments((prev) => ({ ...prev, [membershipId]: departmentId || null }));
    // Het nieuwe hoofdteam hoort niet ook nog als extra team te staan.
    setExtras((prev) => ({
      ...prev,
      [membershipId]: (prev[membershipId] ?? []).filter((id) => id !== departmentId),
    }));
    await fetch(`/api/team-members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: departmentId || null }),
    });
    router.refresh();
  }

  async function toggleExtra(membershipId: string, departmentId: string) {
    const current = extras[membershipId] ?? [];
    const next = current.includes(departmentId)
      ? current.filter((id) => id !== departmentId)
      : [...current, departmentId];
    setExtras((prev) => ({ ...prev, [membershipId]: next }));
    await fetch(`/api/team-members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extraDepartmentIds: next }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {departments.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {departments.map((d, i) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 font-medium">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                {d.name}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded border border-line px-1.5 py-0.5 text-xs text-ink/50 hover:text-ink disabled:opacity-30"
                    aria-label="Omhoog"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === departments.length - 1}
                    className="rounded border border-line px-1.5 py-0.5 text-xs text-ink/50 hover:text-ink disabled:opacity-30"
                    aria-label="Omlaag"
                  >
                    ↓
                  </button>
                </div>
                <button
                  onClick={() => removeDepartment(d.id)}
                  disabled={busyId === d.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  Verwijderen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addDepartment} className="space-y-3 rounded-xl border border-line bg-white p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-ink/60">Nieuw team</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bv. Bediening"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-full bg-orange px-4 py-2 text-sm font-medium text-ink hover:bg-orange-dark disabled:opacity-50"
          >
            Toevoegen
          </button>
        </div>
        <div>
          <label className="block text-xs text-ink/60">Kleur</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full ring-offset-2"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : undefined,
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </form>

      {departments.length > 0 && members.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-ink/40">Medewerkers indelen</p>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {members.map((m) => (
              <li key={m.membershipId} className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span>{m.name}</span>
                  <select
                    value={assignments[m.membershipId] ?? ""}
                    onChange={(e) => assignMember(m.membershipId, e.target.value)}
                    className="rounded-lg border border-line px-2 py-1 text-xs focus:border-awning focus:outline-none"
                  >
                    <option value="">Geen team</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Extra teams: bewust klein en ingeklapt, dit is een uitzondering. */}
                {departments.length > 1 && (
                  <div className="mt-1 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenExtrasId(openExtrasId === m.membershipId ? null : m.membershipId)
                      }
                      className="text-[11px] text-ink/40 hover:text-ink hover:underline"
                    >
                      {(extras[m.membershipId] ?? []).length > 0
                        ? `Extra teams (${(extras[m.membershipId] ?? []).length})`
                        : "+ Extra team"}
                    </button>
                    {openExtrasId === m.membershipId && (
                      <div className="mt-1.5 flex flex-wrap justify-end gap-1.5">
                        {departments
                          .filter((d) => d.id !== assignments[m.membershipId])
                          .map((d) => {
                            const active = (extras[m.membershipId] ?? []).includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => toggleExtra(m.membershipId, d.id)}
                                className={`rounded-full border px-2.5 py-1 text-xs ${
                                  active
                                    ? "border-ink bg-ink text-paper"
                                    : "border-line text-ink/60 hover:border-ink"
                                }`}
                              >
                                {d.name}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
