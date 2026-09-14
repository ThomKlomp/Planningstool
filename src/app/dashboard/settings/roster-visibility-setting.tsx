"use client";

import { useState } from "react";

export default function RosterVisibilitySetting({
  initialValue,
}: {
  initialValue: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !value;
    setValue(next);
    setSaving(true);

    await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showCompanyRosterToEmployees: next }),
    });

    setSaving(false);
  }

  return (
    <label className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm">
      <input
        type="checkbox"
        checked={value}
        disabled={saving}
        onChange={toggle}
        className="h-4 w-4 rounded border-line text-awning focus:ring-awning"
      />
      <span>
        Medewerkers mogen het hele bedrijfsrooster inzien
        <span className="block text-xs text-ink/50">
          Uitgezet? Dan zien medewerkers alleen het rooster van hun eigen
          team en hun eigen diensten.
        </span>
      </span>
    </label>
  );
}
