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
export default function DepartmentsManager({
  initialDepartments,
}: {
  initialDepartments: Department[];
}) {
  const [departments, setDepartments] = useState(
    [...initialDepartments].sort((a, b) => a.order - b.order)
  );
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
    </div>
  );
}
