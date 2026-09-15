"use client";

import { useState } from "react";

type DiscountCode = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  duration: "FOREVER" | "LIMITED_MONTHS";
  durationMonths: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  expiresAt: string | null;
};

function describe(c: DiscountCode) {
  const amount = c.type === "PERCENTAGE" ? `${c.value}%` : `€${(c.value / 100).toFixed(2)}`;
  if (c.type === "PERCENTAGE" && c.value === 100 && c.duration === "LIMITED_MONTHS") {
    return `Eerste ${c.durationMonths} ${c.durationMonths === 1 ? "maand" : "maanden"} gratis`;
  }
  if (c.duration === "FOREVER") return `${amount} korting, altijd`;
  return `${amount} korting, eerste ${c.durationMonths} ${c.durationMonths === 1 ? "maand" : "maanden"}`;
}

export default function DiscountCodesManager({
  initialCodes,
}: {
  initialCodes: DiscountCode[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState<"FOREVER" | "LIMITED_MONTHS">("FOREVER");
  const [durationMonths, setDurationMonths] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    const res = await fetch("/api/admin/discount-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        type,
        value: Number(value),
        duration,
        durationMonths: duration === "LIMITED_MONTHS" ? Number(durationMonths) : undefined,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) {
      setError(data.error ?? "Aanmaken mislukt.");
      return;
    }

    setCodes((prev) => [
      {
        id: data.discountCode.id,
        code: data.discountCode.code,
        type: data.discountCode.type,
        value: data.discountCode.value,
        duration: data.discountCode.duration,
        durationMonths: data.discountCode.durationMonths,
        maxRedemptions: data.discountCode.maxRedemptions,
        timesRedeemed: 0,
        active: true,
        expiresAt: null,
      },
      ...prev,
    ]);
    setCode("");
    setValue("");
    setDurationMonths("");
    setMaxRedemptions("");
  }

  async function toggleActive(id: string, active: boolean) {
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, active } : c)));
    await fetch(`/api/admin/discount-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Deze code definitief verwijderen?")) return;
    const previous = codes;
    setCodes((prev) => prev.filter((c) => c.id !== id));
    const res = await fetch(`/api/admin/discount-codes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Verwijderen mislukt.");
      setCodes(previous);
    }
  }

  return (
    <div>
      <form onSubmit={create} className="rounded-xl border border-line bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-ink/60">Code</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="LAUNCH2026"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-ink/60">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Vast bedrag</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink/60">
              {type === "PERCENTAGE" ? "Percentage (1-100)" : "Bedrag (€)"}
            </label>
            <input
              type="number"
              required
              min={type === "PERCENTAGE" ? 1 : 0.01}
              max={type === "PERCENTAGE" ? 100 : undefined}
              step={type === "PERCENTAGE" ? 1 : 0.01}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "PERCENTAGE" ? "20" : "5.00"}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
            {type === "PERCENTAGE" && (
              <p className="mt-1 text-[11px] text-ink/40">
                100% + "eerste X maanden" = die maanden helemaal gratis.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-ink/60">Duur</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as "FOREVER" | "LIMITED_MONTHS")}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            >
              <option value="FOREVER">Altijd</option>
              <option value="LIMITED_MONTHS">Eerste X maanden</option>
            </select>
          </div>

          {duration === "LIMITED_MONTHS" && (
            <div>
              <label className="block text-xs text-ink/60">Aantal maanden</label>
              <input
                type="number"
                required
                min={1}
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                placeholder="3"
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-ink/60">
              Max. aantal keer bruikbaar (optioneel)
            </label>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Onbeperkt"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={creating}
          className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {creating ? "Aanmaken..." : "Code aanmaken"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Korting</th>
              <th className="px-4 py-3">Gebruikt</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3 text-ink/60">{describe(c)}</td>
                <td className="px-4 py-3 text-ink/60">
                  {c.timesRedeemed}
                  {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c.id, !c.active)}
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      c.active ? "bg-awning/10 text-awning" : "bg-ink/10 text-ink/50"
                    }`}
                  >
                    {c.active ? "Actief" : "Uit"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.timesRedeemed === 0 && (
                    <button
                      onClick={() => remove(c.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Verwijderen
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/40">
                  Nog geen kortingscodes aangemaakt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
