"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string | null;
  memberName: string | null;
  membershipId: string | null;
  departmentName: string | null;
};

type Member = {
  membershipId: string;
  name: string;
  departmentName: string | null;
};

type GridRow = { membershipId: string | null; name: string };

/** Bouwt de teams/medewerkers-rijen en de 7 dagdatums van de week. */
function buildGrid(members: Member[], shifts: Shift[], weekStart: string) {
  const start = new Date(`${weekStart.slice(0, 10)}T00:00:00`);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const groups = new Map<string, GridRow[]>();
  for (const m of members) {
    const key = m.departmentName ?? "Geen team";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ membershipId: m.membershipId, name: m.name });
  }

  // Openstaande (nog niet toegewezen) shifts krijgen een eigen rij onder "Geen team".
  if (shifts.some((s) => !s.membershipId)) {
    const key = "Geen team";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ membershipId: null, name: "Nog niet toegewezen" });
  }

  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === "Geen team") return 1;
    if (b === "Geen team") return -1;
    return a.localeCompare(b);
  });

  function cellFor(membershipId: string | null, day: Date) {
    return shifts
      .filter(
        (s) =>
          s.membershipId === membershipId &&
          new Date(s.date).toDateString() === day.toDateString()
      )
      .map((s) => `${s.startTime}-${s.endTime}`)
      .join("; ");
  }

  return { days, sortedGroups, cellFor };
}

function dayLabel(day: Date) {
  const label = day.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function RosterActions({
  isPublished,
  emailedAt,
  emailedCount,
  weekStart,
  weekLabel,
  members,
  shifts,
}: {
  isPublished: boolean;
  emailedAt: string | null;
  emailedCount: number | null;
  weekStart: string;
  weekLabel: string;
  members: Member[];
  shifts: Shift[];
}) {
  const router = useRouter();
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
    router.refresh(); // toont de bijgewerkte "Laatst gemaild"-regel
  }

  function downloadCsv() {
    const { days, sortedGroups, cellFor } = buildGrid(members, shifts, weekStart);
    const csvField = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const lines = [["", ...days.map(dayLabel)].map(csvField).join(",")];

    sortedGroups.forEach(([departmentName, rows], i) => {
      if (i > 0) lines.push(""); // witregel tussen teams
      lines.push([departmentName].map(csvField).join(","));
      for (const row of rows) {
        const cells = days.map((d) => cellFor(row.membershipId, d));
        lines.push([row.name, ...cells].map(csvField).join(","));
      }
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rooster-${weekLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    const { days, sortedGroups, cellFor } = buildGrid(members, shifts, weekStart);

    const headerCells = days.map((d) => `<th>${escapeHtml(dayLabel(d))}</th>`).join("");
    const bodyRows = sortedGroups
      .map(([departmentName, rows]) => {
        const teamRow = `<tr class="team"><td colspan="${days.length + 1}">${escapeHtml(
          departmentName
        )}</td></tr>`;
        const memberRows = rows
          .map((row) => {
            const cells = days
              .map((d) => `<td>${escapeHtml(cellFor(row.membershipId, d))}</td>`)
              .join("");
            return `<tr><td class="name">${escapeHtml(row.name)}</td>${cells}</tr>`;
          })
          .join("");
        return teamRow + memberRows;
      })
      .join("");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
      <html lang="nl">
        <head>
          <meta charset="utf-8" />
          <title>Rooster ${escapeHtml(weekLabel)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1B1B18; padding: 32px; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #DDD5C7; white-space: nowrap; }
            th { color: #1B1B1899; font-weight: 600; }
            td.name { font-weight: 600; }
            tr.team td { padding-top: 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #3F6E5B; font-weight: 700; border-bottom: none; }
            @media print { @page { margin: 14mm; } }
          </style>
        </head>
        <body>
          <h1>Rooster, ${escapeHtml(weekLabel)}</h1>
          <table>
            <thead><tr><th></th>${headerCells}</tr></thead>
            <tbody>${bodyRows || `<tr><td colspan="${days.length + 1}">Geen medewerkers om te tonen.</td></tr>`}</tbody>
          </table>
        </body>
      </html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={emailTeam}
        disabled={sending || !isPublished}
        title={isPublished ? undefined : "Publiceer het rooster eerst, dan kun je het mailen"}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
      >
        {sending ? "Bezig..." : "Rooster mailen naar team"}
      </button>
      <button
        onClick={downloadCsv}
        disabled={!isPublished}
        title={isPublished ? undefined : "Publiceer het rooster eerst, dan kun je het downloaden"}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
      >
        Downloaden (CSV)
      </button>
      <button
        onClick={downloadPdf}
        disabled={!isPublished}
        title={isPublished ? undefined : "Publiceer het rooster eerst, dan kun je het downloaden"}
        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
      >
        Downloaden (PDF)
      </button>
      {message && <span className="text-xs text-ink/50">{message}</span>}
      {!isPublished && (
        <span className="text-xs text-ink/50">
          Mailen en downloaden kan pas nadat je het rooster hebt gepubliceerd.
        </span>
      )}
      {emailedAt && (
        <span className="w-full text-xs text-awning">
          ✓ Laatst gemaild op{" "}
          {new Date(emailedAt).toLocaleDateString("nl-NL", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {emailedCount ? ` naar ${emailedCount} ${emailedCount === 1 ? "teamlid" : "teamleden"}` : ""}
        </span>
      )}
    </div>
  );
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
