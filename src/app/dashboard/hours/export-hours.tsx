"use client";

import { useState } from "react";

type OpenHours = { submitted: number; queried: number; draft: number; total: number };

// Download van goedgekeurde uren als Excel (3 tabbladen), per maand. Staan er
// in die maand nog uren open, dan krijgt de manager eerst een waarschuwing.
export default function ExportHours() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [checking, setChecking] = useState(false);
  const [open, setOpen] = useState<OpenHours | null>(null);
  const [error, setError] = useState<string | null>(null);

  const url = `/api/hours/export?month=${month}`;

  async function handleExport() {
    setChecking(true);
    setError(null);
    setOpen(null);

    const res = await fetch(`/api/hours/export/check?month=${month}`);
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
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-ink/60">Goedgekeurde uren exporteren</label>
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setOpen(null);
            }}
            className="mt-1 rounded-lg border border-line px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={checking || !month}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          {checking ? "Controleren..." : "Downloaden (Excel)"}
        </button>
      </div>
      <p className="mt-3 text-xs text-ink/50">
        Bevat 3 tabbladen: maand-, week- en dagoverzicht per medewerker. Alleen goedgekeurde
        uren worden meegenomen.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {open && (
        <div className="mt-3 rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber-dark">
          <p className="font-medium">
            Let op: er staan nog uren open in deze maand. Die komen niet in de export.
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
