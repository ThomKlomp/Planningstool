"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Eén aan/uit-vinkje voor een boolean-instelling van het bedrijf. */
export default function CompanyFlagSetting({
  field,
  initialValue,
  label,
  hint,
  confirmOn,
  confirmOff,
}: {
  field: string;
  initialValue: boolean;
  label: string;
  hint: string;
  confirmOn?: string;
  confirmOff?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    const next = !value;
    const question = next ? confirmOn : confirmOff;
    if (question && !confirm(question)) return;
    setValue(next);
    setSaving(true);
    setFailed(false);

    const ok = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    })
      .then((res) => res.ok)
      .catch(() => false);

    setSaving(false);
    if (!ok) {
      setValue(!next);
      setFailed(true);
      return;
    }
    router.refresh();
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
        {label}
        <span className="block text-xs text-ink/50">{hint}</span>
        {failed && <span className="block text-xs text-red-600">Opslaan mislukt, probeer het opnieuw.</span>}
      </span>
    </label>
  );
}
