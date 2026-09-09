import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import AvailabilityGrid from "./availability-grid";
import WeekStatusToggle from "../week-status-toggle";
import { getWeekDates, getISOWeekNumber } from "@/lib/week";

export default async function AvailabilityPage() {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = getWeekDates(new Date());
  const weekStartIso = week[0].toISOString();

  const [ownEntries, teamEntries, members, weekStatus] = await Promise.all([
    prisma.availability.findMany({
      where: {
        membershipId: membership.membershipId,
        date: { gte: week[0], lte: week[6] },
      },
    }),
    canManage
      ? prisma.availability.findMany({
          where: {
            membership: { companyId: membership.companyId },
            date: { gte: week[0], lte: week[6] },
          },
          include: { membership: { include: { user: true } } },
        })
      : Promise.resolve([]),
    canManage
      ? prisma.membership.findMany({
          where: { companyId: membership.companyId },
          include: { user: true },
        })
      : Promise.resolve([]),
    prisma.weekStatus.findUnique({
      where: {
        companyId_weekStart: { companyId: membership.companyId, weekStart: week[0] },
      },
    }),
  ]);

  const isWeekOpen = weekStatus?.isOpen ?? true;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Beschikbaarheid</h1>
          <p className="mt-1 text-sm text-ink/60">
            Week {getISOWeekNumber(week[0])} — geef per dag aan of je kunt werken.
          </p>
        </div>
        <WeekStatusToggle
          weekStart={weekStartIso}
          initialIsOpen={isWeekOpen}
          canManage={canManage}
        />
      </div>

      {!isWeekOpen && !canManage && (
        <p className="mt-4 rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Deze week is gesloten — je kunt je beschikbaarheid niet meer
          aanpassen. Neem contact op met je manager als er iets moet
          wijzigen.
        </p>
      )}

      <div className="mt-6">
        <AvailabilityGrid
          week={week.map((d) => d.toISOString())}
          ownEntries={ownEntries.map((e) => ({
            date: e.date.toISOString(),
            status: e.status,
            note: e.note,
          }))}
          locked={!isWeekOpen && !canManage}
        />
      </div>

      {canManage && (
        <section className="mt-12">
          <h2 className="font-display text-xl">Team-beschikbaarheid</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink/40">
                  <th className="px-4 py-3">Naam</th>
                  {week.map((d) => (
                    <th key={d.toISOString()} className="px-3 py-3">
                      {d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium">{m.user.name ?? m.user.email}</td>
                    {week.map((d) => {
                      const entry = teamEntries.find(
                        (e) =>
                          e.membershipId === m.id &&
                          e.date.toDateString() === d.toDateString()
                      );
                      return (
                        <td key={d.toISOString()} className="px-3 py-3">
                          <StatusDot status={entry?.status} note={entry?.note} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusDot({ status, note }: { status?: string; note?: string | null }) {
  const color =
    status === "AVAILABLE"
      ? "bg-awning"
      : status === "UNSURE"
      ? "bg-amber"
      : status === "UNAVAILABLE"
      ? "bg-ink/20"
      : "bg-transparent border border-line";
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${color}`}
      title={note ?? undefined}
    />
  );
}
