"use client";

import { useState } from "react";

export default function AutoApprovalSettings({
  initialShiftSwaps,
  initialHours,
}: {
  initialShiftSwaps: boolean;
  initialHours: boolean;
}) {
  const [shiftSwaps, setShiftSwaps] = useState(initialShiftSwaps);
  const [hours, setHours] = useState(initialHours);
  const [saving, setSaving] = useState(false);

  async function save(key: "autoApproveShiftSwaps" | "autoApproveHours", value: boolean) {
    setSaving(true);
    await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm">
        <input
          type="checkbox"
          checked={shiftSwaps}
          disabled={saving}
          onChange={(e) => {
            setShiftSwaps(e.target.checked);
            save("autoApproveShiftSwaps", e.target.checked);
          }}
          className="h-4 w-4 rounded border-line text-awning focus:ring-awning"
        />
        <span>
          Overnemen/ruilen mag zonder jouw goedkeuring
          <span className="block text-xs text-ink/50">
            Uitgezet? Dan moet jij elke overname of ruil eerst goedkeuren
            voordat 'm definitief is.
          </span>
        </span>
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm">
        <input
          type="checkbox"
          checked={hours}
          disabled={saving}
          onChange={(e) => {
            setHours(e.target.checked);
            save("autoApproveHours", e.target.checked);
          }}
          className="h-4 w-4 rounded border-line text-awning focus:ring-awning"
        />
        <span>
          Ingediende uren worden automatisch goedgekeurd
          <span className="block text-xs text-ink/50">
            Uitgezet? Dan blijft handmatige goedkeuring zoals je gewend bent.
          </span>
        </span>
      </label>
    </div>
  );
}
