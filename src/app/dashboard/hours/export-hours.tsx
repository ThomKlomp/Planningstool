"use client";

import { useState } from "react";

type OpenHours = { submitted: number; queried: number; draft: number; total: number };

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

// Download van goedgekeurde uren als Excel (3 tabbladen), voor een zelf
// gekozen periode (begin- en einddatum). Staan er in die periode nog uren
// open, dan krijgt de manager eerst een waarschuwing.
export default function ExportHours() {
  const thisMonth = monthRange(0);
  const [from, setFrom] = useState(thisMonth.from);
  const [to, setTo] = useState(thisMonth.to);
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState<OpenHours | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validRange = Boolean(from) && Boolean(to) && from <= to;
  const url = `/api/hours/export?from=${from}&to=${to}`;

  function applyPreset(monthsAgo: number) {
    const range = monthRange(monthsAgo);
    setFrom(range.from);
    setTo(range.to);
    setOpen(null);
    setError(null);
  }

  async function handleExport() {
    if (!validRange) return;
    setChecking(true);
    setError(null);
    setOpen(null);

    const res = await fetch(`/api/hours/export/check?from=${from}&to=${to}`);
    setChecking(false);

    if (!res.ok) {
      setError("Kon niet controleren of er nog uren open staan. Probeer het opnieuw.");
      return;
    }
    const data: OpenHours = await res.json();
    if (data.total > 0) {
      setOpen(data);
      return;
    }
    window.location.href = url;
  }

  function downloadAnyway() {
    setOpen(null);
    window.location.href = url;
  }

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <label className="block text-xs text-ink/60">Goedgekeurde uren exporteren</label>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setOpen(null);
          }}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <span className="text-sm text-ink/40">t/m</span>
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setOpen(null);
          }}
          className="rounded-lg border border-line px-3 py-2 text-sm"
        />
        <button
          onClick={handleExport}
          disabled={checking || !validRange}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {checking ? "Controleren..." : "Downloaden (Excel)"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          onClick={() => applyPreset(0)}
          className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/70 hover:border-ink hover:text-ink"
        >
          Deze maand
        </button>
        <button
          onClick={() => applyPreset(1)}
          className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/70 hover:border-ink hover:text-ink"
        >
          Vorige maand
        </button>
      </div>

      {!validRange && from && to && (
        <p className="mt-2 text-xs text-red-600">De einddatum moet na de begindatum liggen.</p>
      )}

      <p className="mt-3 text-xs text-ink/50">
        Bevat 3 tabbladen: maand-, week- en dagoverzicht per medewerker. Alleen goedgekeurde
        uren worden meegenomen.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {open && (
        <div className="mt-3 rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber-dark">
          <p className="font-medium">
            Let op: er staan nog uren open in deze periode. Die komen niet in de export.
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {open.submitted > 0 && <li>{open.submitted} wachten op jouw beoordeling</li>}
            {open.queried > 0 && <li>{open.queried} met een vraag, wachten op de medewerker</li>}
            {open.draft > 0 && <li>{open.draft} ingeroosterde diensten nog niet ingevuld</li>}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              onClick={downloadAnyway}
              className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper hover:bg-awning"
            >
              Toch downloaden
            </button>
            <button
              onClick={() => setOpen(null)}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:border-ink"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
