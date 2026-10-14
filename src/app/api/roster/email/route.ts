import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayoutWide } from "@/lib/email";
import { resolveWeek, getISOWeekNumber, toDateParam } from "@/lib/week";
import { isRosterPublished } from "@/lib/roster-publish";
import { shiftVisibleTo } from "@/lib/locations";

type GridMember = {
  membershipId: string;
  name: string;
  email: string | null;
  role: string;
  departmentId: string | null;
  departmentName: string | null;
  locationIds: string[]; // leeg = alle locaties
};
type GridShift = {
  date: Date;
  startTime: string;
  endTime: string;
  membershipId: string | null;
  departmentId: string | null;
  role: string | null;
  locationId: string | null;
  locationName: string | null;
};

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
    groups.get(key)!.push({ membershipId: null, name: "Open dienst" });
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
      .map((s) => `${s.startTime}-${s.endTime}${s.locationName ? ` (${s.locationName})` : ""}`)
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

type MailEvent = {
  date: Date | null;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
};

/** Evenementen van de week, als korte lijst boven het rooster. */
function buildEventsHtml(events: MailEvent[]) {
  if (events.length === 0) return "";
  const items = events
    .map((e) => {
      const when = e.date
        ? e.date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })
        : "Hele week";
      const time =
        e.startTime && e.endTime
          ? ` (${e.startTime}–${e.endTime})`
          : e.startTime
          ? ` (vanaf ${e.startTime})`
          : "";
      return `<li style="margin-bottom:6px;"><strong>${escapeHtml(e.title)}</strong>, ${escapeHtml(
        when
      )}${time}${
        e.description
          ? `<br /><span style="color:#555;">${escapeHtml(e.description)}</span>`
          : ""
      }</li>`;
    })
    .join("");
  return `<div style="margin-bottom:16px; padding:12px 14px; background:#F4EFE6; border-radius:8px;">
    <p style="margin:0 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; font-weight:700; color:#8A6A1F;">Evenementen</p>
    <ul style="margin:0; padding-left:18px;">${items}</ul>
  </div>`;
}

/** Apart blokje bovenaan: open diensten die nog ingevuld moeten worden. */
function buildOpenShiftsHtml(shifts: GridShift[]) {
  const open = shifts
    .filter((s) => !s.membershipId)
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime));
  if (open.length === 0) return "";
  const items = open
    .map((s) => {
      const when = s.date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
      return `<li style="margin-bottom:4px;"><strong>${escapeHtml(when)}</strong>, ${s.startTime}–${s.endTime}${
        s.role ? ` · ${escapeHtml(s.role)}` : ""
      }</li>`;
    })
    .join("");
  return `<div style="margin-bottom:16px; padding:12px 14px; background:#FDF3E1; border-left:4px solid #C9821F; border-radius:8px;">
    <p style="margin:0 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; font-weight:700; color:#8A6A1F;">Nog in te vullen: open diensten</p>
    <p style="margin:0 0 6px; font-size:13px;">Deze ${open.length === 1 ? "dienst heeft" : "diensten hebben"} nog niemand. Kun jij? Pak ${
      open.length === 1 ? "'m" : "ze"
    } op in het rooster.</p>
    <ul style="margin:0; padding-left:18px;">${items}</ul>
  </div>`;
}

function buildRosterButtonHtml(url: string) {
  return `<p style="margin-top:24px;">
    <a href="${url}" style="display:inline-block; background:#1B1B18; color:#FAF7F2; padding:12px 20px; border-radius:999px; text-decoration:none; font-weight:500;">
      Bekijk het rooster online
    </a>
  </p>`;
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

  // Een concept-rooster mag niet gemaild worden: medewerkers zouden dan een
  // link krijgen naar een rooster dat ze nog niet mogen zien.
  if (!(await isRosterPublished(membership.companyId, week[0]))) {
    return NextResponse.json(
      { error: "Publiceer het rooster eerst, daarna kun je het mailen." },
      { status: 409 }
    );
  }

  const [membersRaw, shiftsRaw, company, events] = await Promise.all([
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true, department: true, locations: true },
    }),
    prisma.shift.findMany({
      where: { companyId: membership.companyId, date: { gte: week[0], lte: week[6] } },
      include: { location: { select: { name: true } } },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { showCompanyRosterToEmployees: true, showAllLocationsToEmployees: true },
    }),
    prisma.rosterEvent.findMany({
      where: {
        companyId: membership.companyId,
        OR: [{ date: { gte: week[0], lte: week[6] } }, { weekStart: week[0] }],
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const allMembers: GridMember[] = membersRaw.map((m) => ({
    membershipId: m.id,
    name: m.user.name ?? m.user.email ?? "Onbekend",
    email: m.user.email,
    role: m.role,
    departmentId: m.departmentId,
    departmentName: m.department?.name ?? null,
    locationIds: m.locations.map((l) => l.locationId),
  }));
  const allShifts: GridShift[] = shiftsRaw.map((s) => ({
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    membershipId: s.membershipId,
    departmentId: s.departmentId,
    role: s.role,
    locationId: s.locationId,
    locationName: s.location?.name ?? null,
  }));

  if (allMembers.length === 0) {
    return NextResponse.json({ error: "Geen teamleden om naar te mailen" }, { status: 400 });
  }

  const weekLabel = `week ${getISOWeekNumber(week[0])}`;
  const subject = `Rooster ${weekLabel} bij ${membership.companyName}`;
  const showFullToEmployees = company?.showCompanyRosterToEmployees ?? true;
  const rosterUrl = `${process.env.NEXTAUTH_URL ?? ""}/dashboard/rooster?week=${toDateParam(week[0])}`;
  const eventsHtml = buildEventsHtml(events);

  let sentCount = 0;
  let anySent = false;

  // Verstuurt één mail per groep, met de geadresseerden in BCC zodat ze
  // elkaars e-mailadres niet zien.
  async function sendGroup(
    recipients: GridMember[],
    members: GridMember[],
    shifts: GridShift[],
    openShifts: GridShift[]
  ) {
    const emails = recipients.map((m) => m.email).filter((e): e is string => Boolean(e));
    if (emails.length === 0) return;

    const html = emailLayoutWide(
      `Rooster ${weekLabel} bij ${membership.companyName}`,
      eventsHtml +
        buildOpenShiftsHtml(openShifts) +
        buildRosterTableHtml(week, members, shifts) +
        buildRosterButtonHtml(rosterUrl)
    );

    const ownerEmail = allMembers.find((m) => m.role === "OWNER")?.email;

    const result = await sendEmail({
      to: ownerEmail || `${membership.companySlug}@shiftje.nl`,
      bcc: emails,
      subject,
      html,
    });
    if (!("skipped" in result)) anySent = true;
    sentCount += emails.length;
  }

  const managersAndOwners = allMembers.filter((m) => m.role === "OWNER" || m.role === "MANAGER");
  const employees = allMembers.filter((m) => m.role === "EMPLOYEE");
  const restrictByLocation = !(company?.showAllLocationsToEmployees ?? true);

  // Managers/eigenaren zien altijd het volledige rooster, ook als
  // medewerkers beperkt zicht hebben.
  await sendGroup(managersAndOwners, allMembers, allShifts, allShifts.filter((s) => !s.membershipId));

  // Medewerkers: standaard het hele rooster (of alleen hun team, zie hieronder). Staat
  // "medewerkers zien alleen de eigen locatie" aan, dan krijgt iedereen alleen het deel van
  // zijn eigen locatie(s); medewerkers zonder locatie krijgen alles.
  async function sendToEmployees(emps: GridMember[], baseMembers: GridMember[], baseShifts: GridShift[]) {
    const baseOpen = baseShifts.filter((s) => !s.membershipId);
    if (showFullToEmployees) {
      await sendGroup(emps, baseMembers, baseShifts, baseOpen);
      return;
    }
    // Zelfde beperking als in de app: alleen het eigen team te zien, of
    // (zonder team) alleen de eigen shifts.
    const byDepartment = new Map<string, GridMember[]>();
    const withoutDepartment: GridMember[] = [];
    for (const e of emps) {
      if (e.departmentId) {
        if (!byDepartment.has(e.departmentId)) byDepartment.set(e.departmentId, []);
        byDepartment.get(e.departmentId)!.push(e);
      } else {
        withoutDepartment.push(e);
      }
    }

    for (const [departmentId, recipients] of byDepartment) {
      const teamMembers = baseMembers.filter((m) => m.departmentId === departmentId);
      const teamMembershipIds = new Set(teamMembers.map((m) => m.membershipId));
      const teamShifts = baseShifts.filter(
        (s) => s.membershipId && teamMembershipIds.has(s.membershipId)
      );
      // Open diensten van het eigen team (of zonder team) horen er ook bij.
      const teamOpen = baseShifts.filter(
        (s) => !s.membershipId && (!s.departmentId || s.departmentId === departmentId)
      );
      await sendGroup(recipients, teamMembers, teamShifts, teamOpen);
    }

    for (const e of withoutDepartment) {
      const ownShifts = baseShifts.filter((s) => s.membershipId === e.membershipId);
      await sendGroup(
        [e],
        [e],
        ownShifts,
        baseShifts.filter((s) => !s.membershipId && !s.departmentId)
      );
    }
  }

  if (restrictByLocation) {
    const groups = new Map<string, { ids: string[]; emps: GridMember[] }>();
    for (const e of employees) {
      const key = [...e.locationIds].sort().join(",");
      if (!groups.has(key)) groups.set(key, { ids: e.locationIds, emps: [] });
      groups.get(key)!.emps.push(e);
    }
    for (const { ids, emps } of groups.values()) {
      if (ids.length === 0) {
        await sendToEmployees(emps, allMembers, allShifts);
        continue;
      }
      const shifts = shiftsRaw.filter((raw) =>
        shiftVisibleTo(
          { locationId: raw.locationId, membership: raw.membershipId ? { locations: membersRaw.find((m) => m.id === raw.membershipId)?.locations } : null },
          ids
        )
      );
      const shiftKeys = new Set(shifts.map((x) => x.id));
      const groupShifts = allShifts.filter((_, idx) => shiftKeys.has(shiftsRaw[idx].id));
      const withShift = new Set(groupShifts.map((s) => s.membershipId));
      const groupMembers = allMembers.filter(
        (m) =>
          m.locationIds.length === 0 ||
          m.locationIds.some((id) => ids.includes(id)) ||
          withShift.has(m.membershipId)
      );
      await sendToEmployees(emps, groupMembers, groupShifts);
    }
  } else {
    await sendToEmployees(employees, allMembers, allShifts);
  }

  // Onthouden dat (en wanneer) het rooster gemaild is, zodat de manager dat
  // ook later nog op de roosterpagina terugziet.
  if (anySent) {
    await prisma.rosterWeek.upsert({
      where: { companyId_weekStart: { companyId: membership.companyId, weekStart: week[0] } },
      update: { emailedAt: new Date(), emailedCount: sentCount },
      create: {
        companyId: membership.companyId,
        weekStart: week[0],
        emailedAt: new Date(),
        emailedCount: sentCount,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    recipientCount: sentCount,
    emailSent: anySent,
  });
}
