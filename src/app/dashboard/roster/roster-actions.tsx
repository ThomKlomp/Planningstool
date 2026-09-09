"use client";

import { useState } from "react";

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string | null;
  memberName: string | null;
};

export default function RosterActions({
  weekStart,
  weekLabel,
  shifts,
}: {
  weekStart: string;
  weekLabel: string;
  shifts: Shift[];
}) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function emailTeam() {
    setSending(true);
    setMessage(null);

    const res = await fetch("/api/roster/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekStart }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error ?? "Versturen mislukt.");
    } else if (data.emailSent) {
      setMessage(`Verstuurd naar ${data.recipientCount} teamleden.`);
    } else {
      setMessage("E-mail kon niet verstuurd worden.");
    }
    setSending(false);
  }

  function downloadCsv() {
    const header = "Datum,Tijd,Medewerker,Functie\n";
    const rows = shifts
      .map((s) => {
        const date = new Date(s.date).toLocaleDateString("nl-NL");
        const who = s.memberName ?? "Nog niet toegewezen";
        return [date, `${s.startTime}-${s.endTime}`, who, s.role ?? ""]
          .map((field) => `"${field.replace(/"/g, '""')}"`)
          .join(",");
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooster-${weekLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={emailTeam}
        disabled={sending}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
      >
        {sending ? "Bezig..." : "Rooster mailen naar team"}
      </button>
      <button
        onClick={downloadCsv}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink"
      >
        Downloaden (CSV)
      </button>
      {message && <span className="text-xs text-ink/50">{message}</span>}
    </div>
  );
}
