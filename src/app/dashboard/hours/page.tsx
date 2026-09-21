import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import TimeEntryForm from "./time-entry-form";
import TimeEntryList from "./time-entry-list";
import ExportHours from "./export-hours";
import WeekNav from "../week-nav";
import { resolveWeek } from "@/lib/week";
import { filterVisibleForEmployee } from "@/lib/roster-publish";

export default async function HoursPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = canManage ? resolveWeek(searchParams?.week) : null;

  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - 14);
  const rangeEnd = new Date();
  rangeEnd.setDate(rangeEnd.getDate() + 90);

  const [allTimeEntries, closedDays, company] = await Promise.all([
    prisma.timeEntry.findMany({
      where: canManage
        ? {
            companyId: membership.companyId,
            ...(week ? { date: { gte: week[0], lte: week[6] } } : {}),
          }
        : { membershipId: membership.membershipId },
      include: { membership: { include: { user: true } } },
      orderBy: { date: "desc" },
      take: canManage ? undefined : 100,
    }),
    canManage
      ? Promise.resolve([])
      : prisma.closedDay.findMany({
          where: {
            companyId: membership.companyId,
            date: { gte: rangeStart, lte: rangeEnd },
          },
        }),
    canManage
      ? Promise.resolve(null)
      : prisma.company.findUnique({
          where: { id: membership.companyId },
          select: { closedWeekdays: true },
        }),
  ]);

  // Zie api/time-entries: conceptregels van nog niet gepubliceerde weken zijn
  // voor medewerkers verborgen.
  const timeEntries = canManage
    ? allTimeEntries
    : [
        ...(await filterVisibleForEmployee(
          membership.companyId,
          allTimeEntries.filter((e) => e.status === "DRAFT")
        )),
        ...allTimeEntries.filter((e) => e.status !== "DRAFT"),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const closedDates = closedDays.map((c) => c.date.toISOString().slice(0, 10));
  if (company?.closedWeekdays && company.closedWeekdays.length > 0) {
    for (
      let d = new Date(rangeStart);
      d <= rangeEnd;
      d.setDate(d.getDate() + 1)
    ) {
      if (company.closedWeekdays.includes(d.getDay())) {
        closedDates.push(d.toISOString().slice(0, 10));
      }
    }
  }

  // Reden per gesloten dag, zodat de medewerker ziet waarom er niets
  // ingediend kan worden.
  const closedReasons: Record<string, string> = {};
  for (const d of closedDates) closedReasons[d] = "vaste sluitingsdag";
  for (const c of closedDays) {
    if (c.reason) closedReasons[c.date.toISOString().slice(0, 10)] = c.reason;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Uren</h1>
      <p className="mt-1 text-sm text-ink/60">
        {canManage
          ? "Keur ingediende uren goed of stuur ze terug."
          : "Log je gewerkte uren, je manager keurt ze goed."}
      </p>

      {canManage && (
        <div className="mt-4">
          <ExportHours />
        </div>
      )}

      {canManage && week && (
        <div className="mt-4">
          <WeekNav basePath="/dashboard/hours" weekStart={week[0]} />
        </div>
      )}

      {!canManage && (
        <div className="mt-6">
          <TimeEntryForm closedDates={closedDates} closedReasons={closedReasons} />
        </div>
      )}

      <div className="mt-8">
        <TimeEntryList
          canManage={canManage}
          entries={timeEntries.map((e) => ({
            id: e.id,
            date: e.date.toISOString(),
            startTime: e.startTime,
            endTime: e.endTime,
            breakMinutes: e.breakMinutes,
            status: e.status,
            note: e.note,
            managerComment: e.managerComment,
            memberName: e.membership.user.name ?? e.membership.user.email ?? "Onbekend",
          }))}
        />
      </div>
    </div>
  );
}
