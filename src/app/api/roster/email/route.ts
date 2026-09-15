import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayoutWide } from "@/lib/email";
import { resolveWeek, getISOWeekNumber } from "@/lib/week";

const ROSTER_FROM = "Shiftje Rooster <rooster@shiftje.nl>";

type GridMember = {
  membershipId: string;
  name: string;
  email: string | null;
  role: string;
  departmentId: string | null;
  departmentName: string | null;
};
type GridShift = { date: Date; startTime: string; endTime: string; membershipId: string | null };

function dayLabel(day: Date) {
  const label = day.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Bouwt dezelfde teams-als-rijen/dagen-als-kolommen tabel als de PDF-export. */
function buildRosterTableHtml(week: Date[], members: GridMember[], shifts: GridShift[]) {
  const groups = new Map<string, { membershipId: string | null; name: string }[]>();
  for (const m of members) {
    const key = m.departmentName ?? "Geen team";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ membershipId: m.membershipId, name: m.name });
  }
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
        (s) => s.membershipId === membershipId && s.date.toDateString() === day.toDateString()
      )
      .map((s) => `${s.startTime}-${s.endTime}`)
      .join("; ");
  }

  const headerCells = week
    .map(
      (d) =>
        `<th style="text-align:left; padding:6px 10px; border-bottom:1px solid #DDD5C7; font-size:11px; color:#1B1B1899; white-space:nowrap;">${dayLabel(
          d
        )}</th>`
    )
    .join("");

  const bodyRows = sortedGroups
    .map(([departmentName, rows]) => {
      const teamRow = `<tr>
        <td colspan="${week.length + 1}" style="padding:14px 10px 4px; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:#3F6E5B; font-weight:700;">
          ${escapeHtml(departmentName)}
        </td>
      </tr>`;
      const memberRows = rows
        .map((row) => {
          const cells = week
            .map(
              (d) =>
                `<td style="padding:6px 10px; border-bottom:1px solid #DDD5C7; font-size:12px; white-space:nowrap;">${escapeHtml(
                  cellFor(row.membershipId, d)
                )}</td>`
            )
            .join("");
          return `<tr>
            <td style="padding:6px 10px; border-bottom:1px solid #DDD5C7; font-size:12px; font-weight:600; white-space:nowrap;">${escapeHtml(
              row.name
            )}</td>
            ${cells}
          </tr>`;
        })
        .join("");
      return teamRow + memberRows;
    })
    .join("");

  return `<table style="width:100%; border-collapse:collapse;">
    <thead><tr><th></th>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const week = resolveWeek(body?.weekStart);

  const [membersRaw, shiftsRaw, company] = await Promise.all([
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true, department: true },
    }),
    prisma.shift.findMany({
      where: { companyId: membership.companyId, date: { gte: week[0], lte: week[6] } },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { showCompanyRosterToEmployees: true },
    }),
  ]);

  const allMembers: GridMember[] = membersRaw.map((m) => ({
    membershipId: m.id,
    name: m.user.name ?? m.user.email ?? "Onbekend",
    email: m.user.email,
    role: m.role,
    departmentId: m.departmentId,
    departmentName: m.department?.name ?? null,
  }));
  const allShifts: GridShift[] = shiftsRaw.map((s) => ({
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    membershipId: s.membershipId,
  }));

  if (allMembers.length === 0) {
    return NextResponse.json({ error: "Geen teamleden om naar te mailen" }, { status: 400 });
  }

  const weekLabel = `week ${getISOWeekNumber(week[0])}`;
  const subject = `Rooster ${weekLabel} bij ${membership.companyName}`;
  const showFullToEmployees = company?.showCompanyRosterToEmployees ?? true;

  let sentCount = 0;
  let anySent = false;

  // Verstuurt één mail per groep, met de geadresseerden in BCC zodat ze
  // elkaars e-mailadres niet zien.
  async function sendGroup(recipients: GridMember[], members: GridMember[], shifts: GridShift[]) {
    const emails = recipients.map((m) => m.email).filter((e): e is string => Boolean(e));
    if (emails.length === 0) return;

    const html = emailLayoutWide(
      `Rooster ${weekLabel} bij ${membership.companyName}`,
      buildRosterTableHtml(week, members, shifts)
    );

    const result = await sendEmail({
      from: ROSTER_FROM,
      bcc: emails,
      subject,
      html,
    });
    if (!("skipped" in result)) anySent = true;
    sentCount += emails.length;
  }

  const managersAndOwners = allMembers.filter((m) => m.role === "OWNER" || m.role === "MANAGER");
  const employees = allMembers.filter((m) => m.role === "EMPLOYEE");

  // Managers/eigenaren zien altijd het volledige rooster, ook als
  // medewerkers beperkt zicht hebben.
  await sendGroup(managersAndOwners, allMembers, allShifts);

  if (showFullToEmployees) {
    await sendGroup(employees, allMembers, allShifts);
  } else {
    // Zelfde beperking als in de app: alleen het eigen team te zien, of
    // (zonder team) alleen de eigen shifts.
    const byDepartment = new Map<string, GridMember[]>();
    const withoutDepartment: GridMember[] = [];
    for (const e of employees) {
      if (e.departmentId) {
        if (!byDepartment.has(e.departmentId)) byDepartment.set(e.departmentId, []);
        byDepartment.get(e.departmentId)!.push(e);
      } else {
        withoutDepartment.push(e);
      }
    }

    for (const [departmentId, recipients] of byDepartment) {
      const teamMembers = allMembers.filter((m) => m.departmentId === departmentId);
      const teamMembershipIds = new Set(teamMembers.map((m) => m.membershipId));
      const teamShifts = allShifts.filter(
        (s) => s.membershipId && teamMembershipIds.has(s.membershipId)
      );
      await sendGroup(recipients, teamMembers, teamShifts);
    }

    for (const e of withoutDepartment) {
      const ownShifts = allShifts.filter((s) => s.membershipId === e.membershipId);
      await sendGroup([e], [e], ownShifts);
    }
  }

  return NextResponse.json({
    ok: true,
    recipientCount: sentCount,
    emailSent: anySent,
  });
}
