import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { resolveWeek, getISOWeekNumber } from "@/lib/week";
import RosterBoard from "./roster-board";
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

  const [members, availabilities, shifts, weekStatus] = await Promise.all([
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true },
    }),
    prisma.availability.findMany({
      where: {
        membership: { companyId: membership.companyId },
        date: { gte: week[0], lte: week[6] },
      },
    }),
    prisma.shift.findMany({
      where: { companyId: membership.companyId, date: { gte: week[0], lte: week[6] } },
      include: { membership: { include: { user: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.weekStatus.findUnique({
      where: {
        companyId_weekStart: { companyId: membership.companyId, weekStart: week[0] },
      },
    }),
  ]);

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
          initialIsOpen={weekStatus?.isOpen ?? true}
          canManage={canManage}
        />
      </div>

      <div className="mt-4">
        <WeekNav basePath="/dashboard/roster" weekStart={week[0]} />
      </div>

      <div className="mt-6">
        <RosterBoard
          canManage={canManage}
          week={week.map((d) => d.toISOString())}
          members={members.map((m) => ({
            membershipId: m.id,
            name: m.user.name ?? m.user.email ?? "Onbekend",
          }))}
          availabilities={availabilities.map((a) => ({
            membershipId: a.membershipId,
            date: a.date.toISOString(),
            status: a.status,
          }))}
          shifts={shifts.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            startTime: s.startTime,
            endTime: s.endTime,
            role: s.role,
            membershipId: s.membershipId,
            memberName: s.membership?.user.name ?? s.membership?.user.email ?? null,
          }))}
        />
      </div>
    </div>
  );
}
