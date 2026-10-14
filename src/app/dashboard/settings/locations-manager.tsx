"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LOCATION_PALETTE } from "@/lib/locations";

type Location = { id: string; name: string; color: string; order: number };

export default function LocationsManager({ initialLocations }: { initialLocations: Location[] }) {
  const router = useRouter();
  const [locations, setLocations] = useState(
    [...initialLocations].sort((a, b) => a.order - b.order)
  );
  const [name, setName] = useState("");
  const [color, setColor] = useState(LOCATION_PALETTE[locations.length % LOCATION_PALETTE.length]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setLocations((prev) => [...prev, data.location]);
      setName("");
      setColor(LOCATION_PALETTE[(locations.length + 1) % LOCATION_PALETTE.length]);
      router.refresh();
    } else {
      setError(data.error ?? "Toevoegen mislukt.");
    }
    setSaving(false);
  }

  async function rename(l: Location) {
    const next = prompt("Nieuwe naam van de locatie", l.name)?.trim();
    if (!next || next === l.name) return;
    setBusyId(l.id);
    setError(null);
    const res = await fetch(`/api/locations/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next }),
    });
    if (res.ok) {
      setLocations((prev) => prev.map((x) => (x.id === l.id ? { ...x, name: next } : x)));
      router.refresh();
    } else {
      setError("Hernoemen mislukt.");
    }
    setBusyId(null);
  }

  async function remove(l: Location) {
    if (
      !confirm(
        `Locatie "${l.name}" verwijderen? Diensten en uren op deze locatie blijven staan, maar zonder locatie. Medewerkers verliezen hun koppeling met deze locatie.`
      )
    )
      return;
    setBusyId(l.id);
    setLocations((prev) => prev.filter((x) => x.id !== l.id));
    await fetch(`/api/locations/${l.id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= locations.length) return;
    const reordered = [...locations];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setLocations(reordered);
    await Promise.all(
      reordered.map((l, i) =>
        fetch(`/api/locations/${l.id}`, {
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
      {locations.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {locations.map((l, i) => (
            <li key={l.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 font-medium">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                {l.name}
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
                    disabled={i === locations.length - 1}
                    className="rounded border border-line px-1.5 py-0.5 text-xs text-ink/50 hover:text-ink disabled:opacity-30"
                    aria-label="Omlaag"
                  >
                    ↓
                  </button>
                </div>
                <button
                  onClick={() => rename(l)}
                  disabled={busyId === l.id}
                  className="text-xs text-ink/60 hover:underline disabled:opacity-50"
                >
                  Hernoemen
                </button>
                <button
                  onClick={() => remove(l)}
                  disabled={busyId === l.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  Verwijderen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="space-y-3 rounded-xl border border-line bg-white p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-ink/60">Nieuwe locatie</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bv. Centrum"
              maxLength={60}
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
            {LOCATION_PALETTE.map((c) => (
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
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
