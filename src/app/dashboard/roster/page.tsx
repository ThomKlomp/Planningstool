import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { getWeekDates } from "@/lib/week";
import RosterBoard from "./roster-board";

export default async function RosterPage() {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = getWeekDates(new Date());

  const [members, availabilities, shifts] = await Promise.all([
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
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl">Rooster</h1>
      <p className="mt-1 text-sm text-ink/60">
        Beschikbaarheid van je team zie je direct terug — zo weet je bij het
        inplannen meteen wie kan.
      </p>

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
