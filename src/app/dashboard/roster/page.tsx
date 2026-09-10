import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { resolveWeek, getISOWeekNumber, isWeekOpenByDefault } from "@/lib/week";
import { isDateClosed } from "@/lib/closed-days";
import RosterBoard from "./roster-board";
import RosterActions from "./roster-actions";
import WeekStatusToggle from "../week-status-toggle";
import WeekNav from "../week-nav";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = resolveWeek(searchParams?.week);

  const [members, availabilities, shifts, weekStatus, shiftTemplates, company, closedDays] =
    await Promise.all([
      prisma.membership.findMany({
        where: { companyId: membership.companyId },
        include: { user: true, department: true },
      }),
      prisma.availability.findMany({
        where: {
          membership: { companyId: membership.companyId },
          date: { gte: week[0], lte: week[6] },
        },
      }),
      prisma.shift.findMany({
        where: { companyId: membership.companyId, date: { gte: week[0], lte: week[6] } },
        include: { membership: { include: { user: true, department: true } } },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),
      prisma.weekStatus.findUnique({
        where: {
          companyId_weekStart: { companyId: membership.companyId, weekStart: week[0] },
        },
      }),
      prisma.shiftTemplate.findMany({
        where: { companyId: membership.companyId },
        orderBy: { startTime: "asc" },
      }),
      prisma.company.findUnique({
        where: { id: membership.companyId },
        select: { autoOpenWeeks: true, closedWeekdays: true },
      }),
      prisma.closedDay.findMany({
        where: {
          companyId: membership.companyId,
          date: { gte: week[0], lte: week[6] },
        },
      }),
    ]);

  const isWeekOpen =
    weekStatus?.isOpen ?? isWeekOpenByDefault(week[0], company?.autoOpenWeeks ?? 2);
  const specificClosedDates = closedDays.map((c) => c.date.toDateString());
  const closedWeekdays = company?.closedWeekdays ?? [];
  const closedDates = week
    .filter((d) => isDateClosed(d, closedWeekdays, specificClosedDates))
    .map((d) => d.toDateString());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Rooster</h1>
          <p className="mt-1 text-sm text-ink/60">
            {canManage
              ? "Beschikbaarheid van je team zie je direct terug, zo weet je bij het inplannen meteen wie kan."
              : "Bekijk hier wie er wanneer werkt."}
          </p>
        </div>
        <WeekStatusToggle
          weekStart={week[0].toISOString()}
          initialIsOpen={isWeekOpen}
          hasOverride={Boolean(weekStatus)}
          canManage={canManage}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <WeekNav basePath="/dashboard/roster" weekStart={week[0]} />
        {canManage && (
          <RosterActions
            weekStart={week[0].toISOString()}
            weekLabel={`week ${getISOWeekNumber(week[0])}`}
            shifts={shifts.map((s) => ({
              id: s.id,
              date: s.date.toISOString(),
              startTime: s.startTime,
              endTime: s.endTime,
              role: s.role,
              memberName: s.membership?.user.name ?? s.membership?.user.email ?? null,
            }))}
          />
        )}
      </div>

      <div className="mt-6">
        <RosterBoard
          canManage={canManage}
          week={week.map((d) => d.toISOString())}
          members={members.map((m) => ({
            membershipId: m.id,
            name: m.user.name ?? m.user.email ?? "Onbekend",
            departmentName: m.department?.name ?? null,
            departmentColor: m.department?.color ?? null,
          }))}
          shiftTemplates={shiftTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            startTime: t.startTime,
            endTime: t.endTime,
            weekdays: t.weekdays,
          }))}
          availabilities={availabilities.map((a) => ({
            membershipId: a.membershipId,
            date: a.date.toISOString(),
            daypart: a.daypart,
            status: a.status,
            note: a.note,
          }))}
          shifts={shifts.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            startTime: s.startTime,
            endTime: s.endTime,
            role: s.role,
            membershipId: s.membershipId,
            memberName: s.membership?.user.name ?? s.membership?.user.email ?? null,
            departmentName: s.membership?.department?.name ?? null,
            departmentColor: s.membership?.department?.color ?? null,
          }))}
          closedDates={closedDates}
          isWeekOpen={isWeekOpen}
        />
      </div>
    </div>
  );
}
