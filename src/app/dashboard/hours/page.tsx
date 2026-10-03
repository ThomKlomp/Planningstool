import Link from "next/link";
import { requireMembership, requireActiveSubscription } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import TimeEntryForm from "./time-entry-form";
import HoursWeekBoard from "./hours-week-board";
import ExportHours from "./export-hours";
import MyHoursSummary from "./my-hours-summary";
import WeekNav from "../week-nav";
import { resolveWeek, getWeekDates, getISOWeekNumber, toDateParam } from "@/lib/week";
import { isDateClosed } from "@/lib/closed-days";
import { filterVisibleForEmployee } from "@/lib/roster-publish";

export default async function HoursPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const { membership } = await requireMembership();
  await requireActiveSubscription(membership);
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = resolveWeek(searchParams?.week);
  const weekRange = { gte: week[0], lte: week[6] };

  // Bereik voor het invulformulier van medewerkers (welke dagen dicht zijn).
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 14);
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 90);
  const closedFrom = rangeStart < week[0] ? rangeStart : week[0];
  const closedTo = rangeEnd > week[6] ? rangeEnd : week[6];

  const [allEntries, closedDays, company] = await Promise.all([
    prisma.timeEntry.findMany({
      where: canManage
        ? { companyId: membership.companyId, date: weekRange }
        : { membershipId: membership.membershipId, date: weekRange },
      include: {
        membership: { include: { user: true, department: true } },
        shift: { include: { department: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.closedDay.findMany({
      where: { companyId: membership.companyId, date: { gte: closedFrom, lte: closedTo } },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { closedWeekdays: true },
    }),
  ]);

  // Zie api/time-entries: conceptregels van nog niet gepubliceerde weken zijn
  // voor medewerkers verborgen.
  const entries = canManage
    ? allEntries
    : [
        ...(await filterVisibleForEmployee(
          membership.companyId,
          allEntries.filter((e) => e.status === "DRAFT")
        )),
        ...allEntries.filter((e) => e.status !== "DRAFT"),
      ].sort(
        (a, b) => a.date.getTime() - b.date.getTime() || a.startTime.localeCompare(b.startTime)
      );

  // Waarschuwing voor managers: uren ingediend op een dag waarop de medewerker
  // geen dienst had (per dag, niet per shift). Conceptregels vallen af: die
  // komen juist uit een dienst voort. Afgekeurde uren hoeven geen aandacht meer.
  const scheduledDays = new Set<string>();
  if (canManage) {
    const memberIds = Array.from(new Set(entries.map((e) => e.membershipId)));
    const shifts = await prisma.shift.findMany({
      where: { companyId: membership.companyId, membershipId: { in: memberIds }, date: weekRange },
      select: { membershipId: true, date: true },
    });
    for (const sh of shifts) {
      scheduledDays.add(`${sh.membershipId}|${sh.date.toISOString().slice(0, 10)}`);
    }
  }

  // Gesloten dagen van deze week (voor het bord).
  const closedWeekdays = company?.closedWeekdays ?? [];
  const specificClosed = closedDays.map((c) => c.date.toDateString());
  const boardClosedDates = week
    .filter((d) => isDateClosed(d, closedWeekdays, specificClosed))
    .map((d) => d.toDateString());
  const boardClosedReasons: Record<string, string> = {};
  for (const d of week) {
    if (closedWeekdays.includes(d.getDay())) boardClosedReasons[d.toDateString()] = "Vaste sluitingsdag";
  }
  for (const c of closedDays) {
    if (c.reason) boardClosedReasons[c.date.toDateString()] = c.reason;
  }

  // Invulformulier (medewerker): dagen waarop geen uren ingediend kunnen worden.
  const closedDates = closedDays.map((c) => c.date.toISOString().slice(0, 10));
  if (closedWeekdays.length > 0) {
    for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
      if (closedWeekdays.includes(d.getDay())) closedDates.push(d.toISOString().slice(0, 10));
    }
  }
  const closedReasons: Record<string, string> = {};
  for (const d of closedDates) closedReasons[d] = "vaste sluitingsdag";
  for (const c of closedDays) {
    if (c.reason) closedReasons[c.date.toISOString().slice(0, 10)] = c.reason;
  }

  // Uren in ándere weken die nog aandacht vragen. Nu de uren per week getoond
  // worden, zou je die anders makkelijk over het hoofd zien.
  const openStatuses = canManage ? ["SUBMITTED"] : ["DRAFT", "QUERIED"];
  const otherOpen = await prisma.timeEntry.findMany({
    where: {
      ...(canManage
        ? { companyId: membership.companyId }
        : { membershipId: membership.membershipId }),
      status: { in: openStatuses as ("SUBMITTED" | "DRAFT" | "QUERIED")[] },
      AND: [
        { NOT: { date: weekRange } },
        ...(canManage ? [] : [{ date: { lte: new Date() } }]),
      ],
    },
    select: { date: true },
  });
  const openByWeek = new Map<string, { weekNumber: number; count: number }>();
  for (const e of otherOpen) {
    const start = getWeekDates(e.date)[0];
    const key = toDateParam(start);
    const cur = openByWeek.get(key) ?? { weekNumber: getISOWeekNumber(start), count: 0 };
    cur.count += 1;
    openByWeek.set(key, cur);
  }
  const openWeeks = Array.from(openByWeek.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 8);

  return (
    <div>
      <h1 className="font-display text-3xl">Uren</h1>
      <p className="mt-1 text-sm text-ink/60">
        {canManage
          ? "Keur ingediende uren goed of stuur ze terug."
          : "Log je gewerkte uren, je manager keurt ze goed."}
      </p>

      {canManage && (
        <div className="mt-4 max-w-3xl">
          <ExportHours />
        </div>
      )}

      {!canManage && (
        <div className="mt-4 max-w-3xl">
          <MyHoursSummary />
        </div>
      )}

      {!canManage && (
        <div className="mt-6 max-w-3xl">
          <TimeEntryForm closedDates={closedDates} closedReasons={closedReasons} />
        </div>
      )}

      <div className="mt-6">
        <WeekNav basePath="/dashboard/hours" weekStart={week[0]} />
      </div>

      {openWeeks.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber-dark">
          <p className="font-medium">
            {canManage
              ? "In andere weken wachten nog uren op jouw beoordeling:"
              : "In andere weken moet je nog uren bevestigen of aanpassen:"}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {openWeeks.map(([weekStart, info]) => (
              <Link
                key={weekStart}
                href={`/dashboard/hours?week=${weekStart}`}
                className="rounded-full border border-amber/40 bg-white px-3 py-1 text-xs font-medium hover:border-amber-dark"
              >
                Week {info.weekNumber} ({info.count})
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <HoursWeekBoard
          canManage={canManage}
          week={week.map((d) => d.toISOString())}
          closedDates={boardClosedDates}
          closedReasons={boardClosedReasons}
          entries={entries.map((e) => {
            const dept = e.shift?.department ?? e.membership.department;
            return {
              id: e.id,
              date: e.date.toISOString(),
              startTime: e.startTime,
              endTime: e.endTime,
              breakMinutes: e.breakMinutes,
              status: e.status,
              note: e.note,
              managerComment: e.managerComment,
              memberName: e.membership.user.name ?? e.membership.user.email ?? "Onbekend",
              departmentName: dept?.name ?? null,
              departmentColor: dept?.color ?? null,
              departmentOrder: dept?.order ?? null,
              notScheduled:
                canManage &&
                (e.status === "SUBMITTED" || e.status === "QUERIED" || e.status === "APPROVED") &&
                !scheduledDays.has(`${e.membershipId}|${e.date.toISOString().slice(0, 10)}`),
            };
          })}
        />
      </div>
    </div>
  );
}
