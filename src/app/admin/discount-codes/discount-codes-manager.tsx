"use client";

import { useState } from "react";

type Interval = "MONTHLY" | "YEARLY" | "BOTH";

type DiscountCode = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  duration: "FOREVER" | "LIMITED_MONTHS";
  durationMonths: number | null;
  applicableInterval: Interval;
  maxRedemptions: number | null;
  timesRedeemed: number;
  active: boolean;
  expiresAt: string | null;
};

const intervalLabel: Record<Interval, string> = {
  MONTHLY: "Alleen maandelijks",
  YEARLY: "Alleen jaarlijks",
  BOTH: "Beide",
};

function describe(c: DiscountCode) {
  const amount = c.type === "PERCENTAGE" ? `${c.value}%` : `€${(c.value / 100).toFixed(2)}`;
  const suffix = c.applicableInterval !== "BOTH" ? ` · ${intervalLabel[c.applicableInterval]}` : "";
  if (c.type === "PERCENTAGE" && c.value === 100 && c.duration === "LIMITED_MONTHS") {
    return `Eerste ${c.durationMonths} ${c.durationMonths === 1 ? "maand" : "maanden"} gratis${suffix}`;
  }
  if (c.duration === "FOREVER") return `${amount} korting, altijd${suffix}`;
  return `${amount} korting, eerste ${c.durationMonths} ${c.durationMonths === 1 ? "maand" : "maanden"}${suffix}`;
}

export default function DiscountCodesManager({
  initialCodes,
}: {
  initialCodes: DiscountCode[];
}) {
  const [codes, setCodes] = useState(initialCodes);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ---------- Aanmaakformulier ----------
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [duration, setDuration] = useState<"FOREVER" | "LIMITED_MONTHS">("FOREVER");
  const [durationMonths, setDurationMonths] = useState("");
  const [applicableInterval, setApplicableInterval] = useState<Interval>("BOTH");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
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
        applicableInterval,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
        expiresAt: expiresAt || undefined,
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
        applicableInterval: data.discountCode.applicableInterval,
        maxRedemptions: data.discountCode.maxRedemptions,
        timesRedeemed: 0,
        active: true,
        expiresAt: data.discountCode.expiresAt,
      },
      ...prev,
    ]);
    setCode("");
    setValue("");
    setDurationMonths("");
    setMaxRedemptions("");
    setExpiresAt("");
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
            <label className="block text-xs text-ink/60">Geldig voor</label>
            <select
              value={applicableInterval}
              onChange={(e) => setApplicableInterval(e.target.value as Interval)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            >
              <option value="BOTH">Maandelijks en jaarlijks</option>
              <option value="MONTHLY">Alleen maandelijks</option>
              <option value="YEARLY">Alleen jaarlijks</option>
            </select>
          </div>

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

          <div>
            <label className="block text-xs text-ink/60">Einddatum (optioneel)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-ink/40">
              Na deze datum is de code niet meer in te wisselen.
            </p>
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
              <th className="px-4 py-3">Einddatum</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) =>
              editingId === c.id ? (
                <EditRow
                  key={c.id}
                  discountCode={c}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setCodes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                    setEditingId(null);
                  }}
                />
              ) : (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3 text-ink/60">{describe(c)}</td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.timesRedeemed}
                    {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {c.expiresAt
                      ? new Date(c.expiresAt).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
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
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingId(c.id)}
                      className="mr-3 text-xs text-ink/50 hover:text-ink hover:underline"
                    >
                      Bewerken
                    </button>
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
              )
            )}
            {codes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/40">
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

function EditRow({
  discountCode,
  onCancel,
  onSaved,
}: {
  discountCode: DiscountCode;
  onCancel: () => void;
  onSaved: (updated: DiscountCode) => void;
}) {
  const [type, setType] = useState(discountCode.type);
  const [value, setValue] = useState(String(discountCode.value));
  const [duration, setDuration] = useState(discountCode.duration);
  const [durationMonths, setDurationMonths] = useState(
    discountCode.durationMonths ? String(discountCode.durationMonths) : ""
  );
  const [applicableInterval, setApplicableInterval] = useState<Interval>(
    discountCode.applicableInterval
  );
  const [maxRedemptions, setMaxRedemptions] = useState(
    discountCode.maxRedemptions ? String(discountCode.maxRedemptions) : ""
  );
  const [expiresAt, setExpiresAt] = useState(
    discountCode.expiresAt ? discountCode.expiresAt.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/discount-codes/${discountCode.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        value: Number(value),
        duration,
        durationMonths: duration === "LIMITED_MONTHS" ? Number(durationMonths) : null,
        applicableInterval,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt: expiresAt || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }

    onSaved({
      ...discountCode,
      type: data.discountCode.type,
      value: data.discountCode.value,
      duration: data.discountCode.duration,
      durationMonths: data.discountCode.durationMonths,
      applicableInterval: data.discountCode.applicableInterval,
      maxRedemptions: data.discountCode.maxRedemptions,
      expiresAt: data.discountCode.expiresAt,
    });
  }

  return (
    <tr className="border-b border-line bg-paper/60 last:border-0">
      <td className="px-4 py-3 font-mono font-medium align-top">{discountCode.code}</td>
      <td colSpan={5} className="px-4 py-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED_AMOUNT")}
            className="rounded-lg border border-line px-2 py-1.5 text-xs"
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED_AMOUNT">Vast bedrag</option>
          </select>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "PERCENTAGE" ? "Percentage" : "Bedrag (€)"}
            className="rounded-lg border border-line px-2 py-1.5 text-xs"
          />
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as "FOREVER" | "LIMITED_MONTHS")}
            className="rounded-lg border border-line px-2 py-1.5 text-xs"
          >
            <option value="FOREVER">Altijd</option>
            <option value="LIMITED_MONTHS">Eerste X maanden</option>
          </select>
          {duration === "LIMITED_MONTHS" && (
            <input
              type="number"
              min={1}
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              placeholder="Aantal maanden"
              className="rounded-lg border border-line px-2 py-1.5 text-xs"
            />
          )}
          <select
            value={applicableInterval}
            onChange={(e) => setApplicableInterval(e.target.value as Interval)}
            className="rounded-lg border border-line px-2 py-1.5 text-xs"
          >
            <option value="BOTH">Maandelijks en jaarlijks</option>
            <option value="MONTHLY">Alleen maandelijks</option>
            <option value="YEARLY">Alleen jaarlijks</option>
          </select>
          <input
            type="number"
            min={1}
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="Max. keer bruikbaar"
            className="rounded-lg border border-line px-2 py-1.5 text-xs"
          />
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="rounded-lg border border-line px-2 py-1.5 text-xs"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-2 flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-awning disabled:opacity-50"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
          >
            Annuleren
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink/40">
          Wijzigingen gelden alleen voor nieuwe inwisselingen, al ingewisselde kortingen bij
          bestaande zaken blijven op hun oorspronkelijke voorwaarden staan.
        </p>
      </td>
    </tr>
  );
}
