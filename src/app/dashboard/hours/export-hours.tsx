"use client";

import { useState } from "react";

// Download van goedgekeurde uren als Excel (3 tabbladen), per maand.
export default function ExportHours() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
      <div>
        <label className="block text-xs text-ink/60">Goedgekeurde uren exporteren</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mt-1 rounded-lg border border-line px-3 py-2 text-sm"
        />
      </div>
      <a
        href={`/api/hours/export?month=${month}`}
        className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning"
      >
        Downloaden (Excel)
      </a>
      <p className="w-full text-xs text-ink/50">
        Bevat 3 tabbladen: maand-, week- en dagoverzicht per medewerker.
      </p>
    </div>
  );
}
