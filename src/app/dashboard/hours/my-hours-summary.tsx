"use client";

import { useEffect, useState } from "react";
import { formatHours } from "@/lib/worked-hours";

type Summary = {
  memberName: string | null;
  companyName: string | null;
  approved: number;
  pending: number;
  approvedCount: number;
  pendingCount: number;
  perWeek: { weekStart: string; weekNumber: number; approved: number; pending: number }[];
};

function toDateParam(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Eerste en laatste dag van de maand die `monthsAgo` maanden terug ligt (0 = deze maand). */
function monthRange(monthsAgo: number) {
  const now = new Date();
  const from = new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthsAgo, 1));
  const to = new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0));
  return { from: toDateParam(from), to: toDateParam(to) };
}

/** Maandag t/m zondag van de huidige week. */
function thisWeekRange() {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1)));
  const to = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1) + 6));
  return { from: toDateParam(from), to: toDateParam(to) };
}

// "Mijn gewerkte uren": het totaal in een zelf gekozen periode, voor de
// medewerker zelf. Alleen ingediende en goedgekeurde uren tellen mee.
export default function MyHoursSummary() {
  const initial = monthRange(0);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validRange = Boolean(from) && Boolean(to) && from <= to;

  useEffect(() => {
    if (!validRange) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/hours/summary?from=${from}&to=${to}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return (await res.json()) as Summary;
      })
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setError("Kon je uren niet ophalen. Probeer het opnieuw.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to, validRange]);

  function preset(range: { from: string; to: string }) {
    setFrom(range.from);
    setTo(range.to);
  }

  const chip =
    "rounded-full border border-line px-2.5 py-1 text-xs text-ink/70 hover:border-ink hover:text-ink";

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-sm font-medium">Mijn gewerkte uren</p>
      {summary?.memberName && (
        <p className="text-xs text-ink/50">
          Alleen van {summary.memberName}
          {summary.companyName ? ` bij ${summary.companyName}` : ""}, niet van collega's.
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <span className="text-sm text-ink/40">t/m</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button onClick={() => preset(thisWeekRange())} className={chip}>
          Deze week
        </button>
        <button onClick={() => preset(monthRange(0))} className={chip}>
          Deze maand
        </button>
        <button onClick={() => preset(monthRange(1))} className={chip}>
          Vorige maand
        </button>
      </div>

      {!validRange && from && to && (
        <p className="mt-2 text-xs text-red-600">De einddatum moet na de begindatum liggen.</p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {summary && validRange && (
        <div className={`mt-4 ${loading ? "opacity-50" : ""}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-awning/10 px-4 py-3">
              <p className="text-xs text-awning">Goedgekeurd</p>
              <p className="font-display text-2xl">{formatHours(summary.approved)}</p>
              <p className="text-xs text-ink/50">
                {summary.approvedCount} {summary.approvedCount === 1 ? "dienst" : "diensten"}
              </p>
            </div>
            <div className="rounded-lg bg-amber/10 px-4 py-3">
              <p className="text-xs text-amber-dark">Nog in behandeling</p>
              <p className="font-display text-2xl">{formatHours(summary.pending)}</p>
              <p className="text-xs text-ink/50">
                {summary.pendingCount} {summary.pendingCount === 1 ? "dienst" : "diensten"}
              </p>
            </div>
          </div>

          {summary.perWeek.length > 1 && (
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line text-sm">
              {summary.perWeek.map((w) => (
                <li key={w.weekStart} className="flex items-center justify-between px-3 py-2">
                  <span className="text-ink/60">Week {w.weekNumber}</span>
                  <span className="font-medium">{formatHours(w.approved + w.pending)}</span>
                </li>
              ))}
            </ul>
          )}
          {summary.approvedCount + summary.pendingCount === 0 && (
            <p className="mt-3 text-sm text-ink/50">Geen ingediende uren in deze periode.</p>
          )}
        </div>
      )}
    </div>
  );
}
