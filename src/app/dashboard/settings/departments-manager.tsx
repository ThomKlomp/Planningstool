"use client";

import { useState } from "react";

type Department = { id: string; name: string };
type Member = { membershipId: string; name: string; departmentId: string | null };

export default function DepartmentsManager({
  initialDepartments,
  members,
}: {
  initialDepartments: Department[];
  members: Member[];
}) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [assignments, setAssignments] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {};
    for (const m of members) map[m.membershipId] = m.departmentId;
    return map;
  });
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setDepartments((prev) => [...prev, data.department]);
      setName("");
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
    await fetch(`/api/departments/${id}`, { method: "DELETE" });
    setBusyId(null);
  }

  async function assignMember(membershipId: string, departmentId: string) {
    setAssignments((prev) => ({ ...prev, [membershipId]: departmentId || null }));
    await fetch(`/api/team-members/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: departmentId || null }),
    });
  }

  return (
    <div className="space-y-4">
      {departments.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {departments.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="font-medium">{d.name}</span>
              <button
                onClick={() => removeDepartment(d.id)}
                disabled={busyId === d.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Verwijderen
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addDepartment} className="flex items-end gap-3">
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
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          Toevoegen
        </button>
      </form>

      {departments.length > 0 && members.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-ink/40">Medewerkers indelen</p>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {members.map((m) => (
              <li key={m.membershipId} className="flex items-center justify-between px-4 py-2.5">
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
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
