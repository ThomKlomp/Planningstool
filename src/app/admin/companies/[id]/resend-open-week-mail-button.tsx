"use client";

import { useState } from "react";

export default function ResendOpenWeekMailButton({
  companyId,
  memberCount,
}: {
  companyId: string;
  memberCount: number;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function resend() {
    if (
      !confirm(
        `De "week staat open"-mail opnieuw versturen aan alle ${memberCount} leden van deze zaak? Wie hem al kreeg, krijgt hem dan nog een keer.`
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const res = await fetch(`/api/admin/companies/${companyId}/resend-open-week-mail`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setMessage(
      res.ok
        ? { ok: true, text: `Verstuurd naar ${data.recipients} ${data.recipients === 1 ? "lid" : "leden"}.` }
        : { ok: false, text: data.error ?? "Versturen mislukt." }
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={resend}
        disabled={busy}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink disabled:opacity-50"
      >
        {busy ? "Bezig..." : "Beschikbaarheidsmail opnieuw versturen"}
      </button>
      {message && (
        <span className={`text-sm ${message.ok ? "text-awning" : "text-red-600"}`}>{message.text}</span>
      )}
    </div>
  );
}
