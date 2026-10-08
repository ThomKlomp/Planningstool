"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WeekOpenEmailSetting({ initialValue }: { initialValue: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    const next = !value;
    // Uitzetten vraagt om bevestiging; aanzetten gaat direct.
    if (
      !next &&
      !confirm(
        "Weet je zeker dat je de mail wilt uitzetten? Medewerkers krijgen dan geen e-mail meer als een nieuwe week openstaat voor beschikbaarheid, waardoor er minder beschikbaarheid binnen kan komen."
      )
    ) {
      return;
    }
    setValue(next);
    setSaving(true);
    setFailed(false);

    const ok = await fetch("/api/company/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailWeekOpenToEmployees: next }),
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
        Medewerkers mailen als een nieuwe week openstaat
        <span className="block text-xs text-ink/50">
          Uitgezet? Dan krijgt niemand een e-mail als een week opengaat voor
          beschikbaarheid. Medewerkers kunnen de week nog steeds invullen in de app.
        </span>
        {failed && <span className="block text-xs text-red-600">Opslaan mislukt, probeer het opnieuw.</span>}
      </span>
    </label>
  );
}
