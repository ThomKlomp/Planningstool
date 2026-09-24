import Link from "next/link";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { resolveWeek, getISOWeekNumber, isWeekOpenByDefault, toDateParam } from "@/lib/week";
import { isDateClosed } from "@/lib/closed-days";
import RosterBoard from "./roster-board";
import RosterActions from "./roster-actions";
import PendingSwapApprovals from "./pending-swap-approvals";
import RosterPublishToggle from "./roster-publish-toggle";
import { isPastWeek } from "@/lib/roster-publish";
import WeekStatusToggle from "../week-status-toggle";
import WeekNav from "../week-nav";

type View = "company" | "team" | "personal";

export default async function RosterPage({
  searchParams,
}: {
  searchParams: { week?: string; view?: string };
}) {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = resolveWeek(searchParams?.week);

  const [membersRaw, availabilities, shiftsRaw, weekStatus, shiftTemplates, company, closedDays, swapRequestsThisWeek, pendingApprovals, rosterWeek, rosterEvents] =
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
        select: {
          autoOpenWeeks: true,
          closedWeekdays: true,
          showCompanyRosterToEmployees: true,
        },
      }),
      prisma.closedDay.findMany({
        where: {
          companyId: membership.companyId,
          date: { gte: week[0], lte: week[6] },
        },
      }),
      prisma.shiftSwapRequest.findMany({
        where: {
          companyId: membership.companyId,
          // APPROVED erbij, zodat de nieuwe eigenaar van een overgenomen
          // dienst ziet dat hij/zij die heeft overgenomen.
          status: { in: ["OPEN", "PENDING_APPROVAL", "APPROVED"] },
          shift: { date: { gte: week[0], lte: week[6] } },
        },
        include: { proposals: { orderBy: { createdAt: "asc" } } },
      }),
      canManage
        ? prisma.shiftSwapRequest.findMany({
            where: { companyId: membership.companyId, status: "PENDING_APPROVAL" },
            include: {
              shift: true,
            },
            orderBy: { claimedAt: "asc" },
          })
        : Promise.resolve([]),
      prisma.rosterWeek.findUnique({
        where: {
          companyId_weekStart: { companyId: membership.companyId, weekStart: week[0] },
        },
      }),
      prisma.rosterEvent.findMany({
        where: {
          companyId: membership.companyId,
          OR: [
            { date: { gte: week[0], lte: week[6] } },
            { weekStart: week[0] },
          ],
        },
        orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
      }),
    ]);

  // membershipId -> naam, handig om in de goedkeuringslijst te tonen.
  const memberNameById = new Map(
    membersRaw.map((m) => [m.id, m.user.name ?? m.user.email ?? "Onbekend"])
  );

  // Sorteer op team-volgorde (zoals ingesteld bij Instellingen), leden zonder
  // team achteraan, daarbinnen op naam.
  const members = [...membersRaw].sort((a, b) => {
    const orderA = a.department?.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.department?.order ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    const nameA = a.user.name ?? a.user.email ?? "";
    const nameB = b.user.name ?? b.user.email ?? "";
    return nameA.localeCompare(nameB);
  });

  const isWeekOpen =
    weekStatus?.isOpen ?? isWeekOpenByDefault(week[0], company?.autoOpenWeeks ?? 2);
  const specificClosedDates = closedDays.map((c) => c.date.toDateString());
  const closedWeekdays = company?.closedWeekdays ?? [];
  const closedDates = week
    .filter((d) => isDateClosed(d, closedWeekdays, specificClosedDates))
    .map((d) => d.toDateString());

  // Vaste sluitingsdagen krijgen een standaardreden; een losse gesloten dag
  // toont de reden die de manager heeft ingevuld (indien aanwezig).
  const closedReasons: Record<string, string> = {};
  for (const d of week) {
    if (closedWeekdays.includes(d.getDay())) {
      closedReasons[d.toDateString()] = "Vaste sluitingsdag";
    }
  }
  for (const c of closedDays) {
    if (c.reason) closedReasons[c.date.toDateString()] = c.reason;
  }

  const rosterPublished = isPastWeek(week[0]) || (rosterWeek?.published ?? false);
  const hideRosterFromViewer = !canManage && !rosterPublished;

  const showCompanyRoster = company?.showCompanyRosterToEmployees ?? true;
  const ownDepartmentId =
    members.find((m) => m.id === membership.membershipId)?.departmentId ?? null;

  const requestedView = searchParams?.view;
  const view: View = canManage
    ? "company"
    : requestedView === "team" || requestedView === "personal"
    ? requestedView
    : showCompanyRoster
    ? "company"
    : "team";

  let visibleMembers = members;
  let visibleShifts = shiftsRaw;

  if (view === "team") {
    visibleMembers = members.filter((m) => m.departmentId && m.departmentId === ownDepartmentId);
    visibleShifts = shiftsRaw.filter(
      (s) => s.membership?.departmentId && s.membership.departmentId === ownDepartmentId
    );
  } else if (view === "personal") {
    visibleMembers = members.filter((m) => m.id === membership.membershipId);
    visibleShifts = shiftsRaw.filter((s) => s.membershipId === membership.membershipId);
  }

  const weekParam = toDateParam(week[0]);

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
          key={week[0].toISOString()}
          weekStart={week[0].toISOString()}
          initialIsOpen={isWeekOpen}
          hasOverride={Boolean(weekStatus)}
          canManage={canManage}
          openLabel="Beschikbaarheid open, klik om te sluiten"
          closedLabel="Beschikbaarheid gesloten, klik om te openen"
        />
      </div>

      {canManage && !isPastWeek(week[0]) && (
        <div className="mt-3">
          <RosterPublishToggle
            key={`publish-${week[0].toISOString()}`}
            weekStart={week[0].toISOString()}
            initialPublished={rosterWeek?.published ?? false}
          />
        </div>
      )}

      {!canManage && !hideRosterFromViewer && (
        <div className="mt-4 flex gap-1 overflow-x-auto text-sm">
          {showCompanyRoster && (
            <RosterViewTab
              active={view === "company"}
              href={`/dashboard/rooster?week=${weekParam}&view=company`}
            >
              Bedrijf
            </RosterViewTab>
          )}
          <RosterViewTab
            active={view === "team"}
            href={`/dashboard/rooster?week=${weekParam}&view=team`}
          >
            Mijn team
          </RosterViewTab>
          <RosterViewTab
            active={view === "personal"}
            href={`/dashboard/rooster?week=${weekParam}&view=personal`}
          >
            Mijn rooster
          </RosterViewTab>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <WeekNav basePath="/dashboard/rooster" weekStart={week[0]} />
        {canManage && (
          <RosterActions
            isPublished={rosterPublished}
            emailedAt={rosterWeek?.emailedAt ? rosterWeek.emailedAt.toISOString() : null}
            emailedCount={rosterWeek?.emailedCount ?? null}
            weekStart={week[0].toISOString()}
            weekLabel={`week ${getISOWeekNumber(week[0])}`}
            members={members.map((m) => ({
              membershipId: m.id,
              name: m.user.name ?? m.user.email ?? "Onbekend",
              departmentName: m.department?.name ?? null,
            }))}
            shifts={shiftsRaw.map((s) => ({
              id: s.id,
              date: s.date.toISOString(),
              startTime: s.startTime,
              endTime: s.endTime,
              role: s.role,
              memberName: s.membership?.user.name ?? s.membership?.user.email ?? null,
              membershipId: s.membershipId,
              departmentName: s.membership?.department?.name ?? null,
            }))}
          />
        )}
      </div>

      {canManage && pendingApprovals.length > 0 && (
        <div className="mt-6">
          <PendingSwapApprovals
            requests={pendingApprovals.map((r) => ({
              id: r.id,
              date: r.shift.date.toISOString(),
              startTime: r.shift.startTime,
              endTime: r.shift.endTime,
              role: r.shift.role,
              offeredByName: memberNameById.get(r.offeredById) ?? "Onbekend",
              claimedByName: r.claimedById ? memberNameById.get(r.claimedById) ?? "Onbekend" : "Onbekend",
            }))}
          />
        </div>
      )}
      {canManage && pendingApprovals.length === 0 && (
        <p className="mt-4 text-xs text-ink/30">Iedereen staat gewoon te werken, mooi zo.</p>
      )}

      {hideRosterFromViewer ? (
        <p className="mt-6 rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Het rooster van week {getISOWeekNumber(week[0])} is nog niet gepubliceerd.
          Je manager zet het online zodra het klaar is, je krijgt dan een melding.
        </p>
      ) : view === "team" && !ownDepartmentId ? (
        <p className="mt-6 rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">
          Je bent nog niet bij een team ingedeeld. Vraag je manager om je aan
          een team toe te voegen bij Instellingen.
        </p>
      ) : (
        <div className="mt-6">
          <RosterBoard
            canManage={canManage}
            viewerMembershipId={membership.membershipId}
            swapRequests={swapRequestsThisWeek.map((r) => ({
              id: r.id,
              shiftId: r.shiftId,
              status: r.status,
              offeredById: r.offeredById,
              offeredByName: memberNameById.get(r.offeredById) ?? "Onbekend",
              claimedById: r.claimedById,
              notifiedNames: r.notifiedMembershipIds.map(
                (id) => memberNameById.get(id) ?? "Onbekend"
              ),
              proposals: r.proposals.map((p) => ({
                proposedById: p.proposedById,
                name: memberNameById.get(p.proposedById) ?? "Onbekend",
                note: p.note,
              })),
            }))}
            events={rosterEvents.map((e) => ({
              id: e.id,
              date: e.date ? e.date.toISOString() : null,
              weekStart: e.weekStart ? e.weekStart.toISOString() : null,
              title: e.title,
              description: e.description,
              startTime: e.startTime,
              endTime: e.endTime,
            }))}
            week={week.map((d) => d.toISOString())}
            members={visibleMembers.map((m) => ({
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
            shifts={visibleShifts.map((s) => ({
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
            closedReasons={closedReasons}
            isWeekOpen={isWeekOpen}
            weekStartIso={week[0].toISOString()}
          />
        </div>
      )}
    </div>
  );
}

function RosterViewTab({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 ${
        active ? "bg-ink text-paper" : "text-ink/60 hover:bg-ink/5"
      }`}
    >
      {children}
    </Link>
  );
}
