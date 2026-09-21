import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import AvailabilityGrid from "./availability-grid";
import WeekStatusToggle from "../week-status-toggle";
import WeekNav from "../week-nav";
import { resolveWeek, isWeekOpenByDefault } from "@/lib/week";
import { isDateClosed } from "@/lib/closed-days";

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = resolveWeek(searchParams?.week);
  const weekStartIso = week[0].toISOString();

  const [ownEntries, teamEntries, members, weekStatus, shiftTemplates, company, closedDays] =
    await Promise.all([
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

  // Reden per gesloten dag, zodat medewerkers zien waarom de zaak dicht is.
  const closedReasons: Record<string, string> = {};
  for (const d of week) {
    if (closedWeekdays.includes(d.getDay())) {
      closedReasons[d.toDateString()] = "Vaste sluitingsdag";
    }
  }
  for (const c of closedDays) {
    if (c.reason) closedReasons[c.date.toDateString()] = c.reason;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Beschikbaarheid</h1>
          <p className="mt-1 text-sm text-ink/60">
            Geef per dag aan of je kunt werken.
          </p>
        </div>
        <WeekStatusToggle
          key={weekStartIso}
          weekStart={weekStartIso}
          initialIsOpen={isWeekOpen}
          hasOverride={Boolean(weekStatus)}
          canManage={canManage}
        />
      </div>

      <div className="mt-4">
        <WeekNav basePath="/dashboard/availability" weekStart={week[0]} />
      </div>

      {!isWeekOpen && !canManage && (
        <p className="mt-4 rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Deze week is gesloten. Je kunt je beschikbaarheid niet meer
          aanpassen. Neem contact op met je manager als er iets moet
          wijzigen.
        </p>
      )}

      {canManage && shiftTemplates.length === 0 && (
        <p className="mt-4 rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Nog geen standaard shifts ingesteld. Medewerkers geven nu
          beschikbaarheid per hele dag door.{" "}
          <a href="/dashboard/settings" className="text-awning hover:underline">
            Shifts instellen →
          </a>
        </p>
      )}

      <div className="mt-6">
        <AvailabilityGrid
          key={weekStartIso}
          week={week.map((d) => d.toISOString())}
          shiftTemplates={shiftTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            startTime: t.startTime,
            endTime: t.endTime,
            weekdays: t.weekdays,
          }))}
          ownEntries={ownEntries.map((e) => ({
            date: e.date.toISOString(),
            daypart: e.daypart,
            status: e.status,
            note: e.note,
          }))}
          closedDates={closedDates}
          closedReasons={closedReasons}
          locked={!isWeekOpen && !canManage}
        />
      </div>

      {canManage && (
        <section className="mt-12">
          <h2 className="font-display text-xl">Team-beschikbaarheid</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink/40">
                  <th className="w-32 px-4 py-3 text-left">Naam</th>
                  {week.map((d) => (
                    <th key={d.toISOString()} className="px-2 py-3 text-center">
                      {d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="truncate px-4 py-3 font-medium">
                      {m.user.name ?? m.user.email}
                    </td>
                    {week.map((d) => {
                      const dayEntries = teamEntries.filter(
                        (e) =>
                          e.membershipId === m.id &&
                          e.date.toDateString() === d.toDateString()
                      );
                      return (
                        <td key={d.toISOString()} className="px-2 py-3">
                          {closedDates.includes(d.toDateString()) ? (
                            <p className="text-center text-[10px] text-ink/30">Dicht</p>
                          ) : dayEntries.length === 0 ? (
                            <div className="flex justify-center">
                              <StatusDot />
                            </div>
                          ) : (
                            <div className="flex flex-wrap justify-center gap-1">
                              {dayEntries.map((e) => (
                                <StatusDot key={e.id} status={e.status} note={e.note} />
                              ))}
                            </div>
                          )}
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
      ? "bg-red-500"
      : "bg-transparent border border-line";
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full ${color}`}
      title={note ?? undefined}
    />
  );
}
