import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  resolveWeek,
  getISOWeekNumber,
  isWeekOpenByDefault,
  toDateParam,
} from "@/lib/week";
import { filterVisibleForEmployee } from "@/lib/roster-publish";
import { teamIdsOf } from "@/lib/teams";
import { workedHours, formatHours } from "@/lib/worked-hours";
import { isManagerRole, type DashboardBlockId } from "@/lib/dashboard-blocks";
import MemberList from "../member-list";

// Inhoud van de blokken op het overzicht. Elk blok haalt zijn eigen gegevens
// op en wordt alleen gerenderd als de gebruiker het ook op zijn overzicht heeft.

export type BlockContext = {
  membershipId: string;
  companyId: string;
  companySlug: string;
  role: string;
};

const fmtDay = (d: Date) =>
  d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink/50">{children}</p>;
}

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mt-3 inline-block text-xs text-awning hover:underline">
      {children}
    </Link>
  );
}

/** De verst vooruit openstaande week binnen de komende weken, voor beschikbaarheid. */
async function openAvailabilityWeek(companyId: string): Promise<Date | null> {
  const [company, statuses] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { autoOpenWeeks: true } }),
    prisma.weekStatus.findMany({ where: { companyId } }),
  ]);
  const current = resolveWeek()[0];
  let found: Date | null = null;
  for (let i = 0; i < 6; i++) {
    const weekStart = new Date(current);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const status = statuses.find((s) => s.weekStart.getTime() === weekStart.getTime());
    const open = status?.isOpen ?? isWeekOpenByDefault(weekStart, company?.autoOpenWeeks ?? 2);
    if (open) found = weekStart;
  }
  return found;
}

async function myShifts(ctx: BlockContext, range: { gte: Date; lte?: Date }, take?: number) {
  const shifts = await prisma.shift.findMany({
    where: { membershipId: ctx.membershipId, date: range },
    include: { department: true, membership: { include: { department: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take,
  });
  return isManagerRole(ctx.role) ? shifts : filterVisibleForEmployee(ctx.companyId, shifts);
}

async function TeamStats({ ctx }: { ctx: BlockContext }) {
  const manager = isManagerRole(ctx.role);
  const week = resolveWeek();
  const [memberCount, allWeekShifts, pendingHours] = await Promise.all([
    prisma.membership.count({ where: { companyId: ctx.companyId } }),
    prisma.shift.findMany({
      where: { companyId: ctx.companyId, date: { gte: week[0], lte: week[6] } },
    }),
    manager
      ? prisma.timeEntry.count({ where: { companyId: ctx.companyId, status: "SUBMITTED" } })
      : Promise.resolve(0),
  ]);
  // Medewerkers tellen alleen mee wat ze ook in het rooster mogen zien.
  const shifts = manager ? allWeekShifts : await filterVisibleForEmployee(ctx.companyId, allWeekShifts);
  const open = shifts.filter((s) => !s.membershipId).length;
  const assigned = new Set(shifts.filter((s) => s.membershipId).map((s) => s.membershipId as string));
  const withoutShift = memberCount - assigned.size;

  const Card = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl border border-line bg-white px-5 py-4">
      <p className="font-display text-2xl">{value}</p>
      <p className="text-sm text-ink/50">{label}</p>
    </div>
  );
  return (
    <div className="stat-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card label="Teamleden" value={memberCount} />
      <Card label="Shifts deze week" value={shifts.length} />
      <Card label="Open diensten" value={open} />
      <Card label="Zonder shift deze week" value={Math.max(0, withoutShift)} />
      {manager && <Card label="Uren ter goedkeuring" value={pendingHours} />}
    </div>
  );
}

async function TeamMembers({ ctx }: { ctx: BlockContext }) {
  const members = await prisma.membership.findMany({
    where: { companyId: ctx.companyId },
    include: { user: true, department: true },
    orderBy: { createdAt: "asc" },
  });
  // Alleen-lezen: beheren (indelen, status, verwijderen) doen managers bij Medewerkers.
  return (
    <MemberList
      initialMembers={members.map((m) => ({
        id: m.id,
        // E-mailadressen van collega's zijn alleen zichtbaar voor eigenaar en managers
        // (en worden voor medewerkers niet eens naar de browser gestuurd).
        name: m.user.name ?? (isManagerRole(ctx.role) ? m.user.email : null) ?? "Onbekend",
        email: isManagerRole(ctx.role) ? m.user.email ?? "" : "",
        role: m.role,
        departmentName: m.department?.name ?? null,
        departmentColor: m.department?.color ?? null,
      }))}
      canManage={false}
      viewerRole={ctx.role}
      viewerMembershipId={ctx.membershipId}
      isDemoCompany={ctx.companySlug === "demo"}
    />
  );
}

async function NextShift({ ctx }: { ctx: BlockContext }) {
  const shifts = await myShifts(ctx, { gte: startOfToday() }, 10);
  const next = shifts[0];
  if (!next) return <Empty>Je staat de komende tijd nog niet ingeroosterd.</Empty>;
  const team = next.department ?? next.membership?.department ?? null;
  const days = Math.round((next.date.getTime() - startOfToday().getTime()) / 86400000);
  return (
    <div>
      <p className="font-display text-2xl first-letter:uppercase">{fmtDay(next.date)}</p>
      <p className="mt-1 text-sm">
        {next.startTime}–{next.endTime}
        {next.role ? ` · ${next.role}` : ""}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
        {team && (
          <>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: team.color }} />
            {team.name} ·{" "}
          </>
        )}
        {days === 0 ? "vandaag" : days === 1 ? "morgen" : `over ${days} dagen`}
      </p>
      <MoreLink href="/dashboard/rooster">Naar het rooster →</MoreLink>
    </div>
  );
}

async function MyWeek({ ctx }: { ctx: BlockContext }) {
  const week = resolveWeek();
  const shifts = await myShifts(ctx, { gte: week[0], lte: week[6] });
  if (shifts.length === 0) return <Empty>Je hebt deze week geen diensten.</Empty>;
  const total = shifts.reduce(
    (sum, s) => sum + workedHours({ startTime: s.startTime, endTime: s.endTime, breakMinutes: 0 }),
    0
  );
  return (
    <div>
      <ul className="space-y-1.5 text-sm">
        {shifts.map((s) => (
          <li key={s.id} className="flex justify-between gap-3">
            <span className="first-letter:uppercase">{fmtDay(s.date)}</span>
            <span className="text-ink/60">
              {s.startTime}–{s.endTime}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink/50">Totaal {formatHours(total)}</p>
    </div>
  );
}

async function OpenShifts({ ctx }: { ctx: BlockContext }) {
  const manager = isManagerRole(ctx.role);
  const today = startOfToday();
  const until = new Date(today);
  until.setDate(until.getDate() + 14);

  let teamFilter: { departmentId: { in: string[] } } | undefined;
  if (!manager) {
    // Medewerkers zien alleen open diensten van hun eigen team(s).
    const me = await prisma.membership.findUnique({
      where: { id: ctx.membershipId },
      include: { extraDepartments: true },
    });
    const teamIds = me ? teamIdsOf(me) : [];
    if (teamIds.length === 0) {
      return <Empty>Je zit nog niet in een team, dus er zijn geen open diensten om te tonen.</Empty>;
    }
    teamFilter = { departmentId: { in: teamIds } };
  }

  const found = await prisma.shift.findMany({
    where: {
      companyId: ctx.companyId,
      membershipId: null,
      date: { gte: today, lte: until },
      ...teamFilter,
    },
    include: { department: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 30,
  });
  const shifts = manager ? found : await filterVisibleForEmployee(ctx.companyId, found);
  if (shifts.length === 0) return <Empty>Er zijn de komende twee weken geen open diensten.</Empty>;

  return (
    <div>
      <ul className="space-y-1.5 text-sm">
        {shifts.slice(0, 6).map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3">
            <span className="first-letter:uppercase">{fmtDay(s.date)}</span>
            <span className="flex items-center gap-2 text-ink/60">
              {s.startTime}–{s.endTime}
              {s.department && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.department.color }}
                  title={s.department.name}
                />
              )}
            </span>
          </li>
        ))}
      </ul>
      {shifts.length > 6 && <p className="mt-2 text-xs text-ink/50">en nog {shifts.length - 6}</p>}
      <MoreLink href="/dashboard/rooster">Naar het rooster →</MoreLink>
    </div>
  );
}

async function AvailabilityStatus({ ctx }: { ctx: BlockContext }) {
  const weekStart = await openAvailabilityWeek(ctx.companyId);
  if (!weekStart) return <Empty>Er staat op dit moment geen week open voor beschikbaarheid.</Empty>;
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const entries = await prisma.availability.findMany({
    where: { membershipId: ctx.membershipId, date: { gte: weekStart, lte: end } },
    select: { date: true },
  });
  const days = new Set(entries.map((e) => e.date.toDateString())).size;
  return (
    <div>
      <p className="text-sm">
        Week {getISOWeekNumber(weekStart)} staat open.{" "}
        {days === 0 ? "Je hebt nog niets ingevuld." : `Je hebt ${days} van de 7 dagen ingevuld.`}
      </p>
      <MoreLink href={`/dashboard/availability?week=${toDateParam(weekStart)}`}>
        {days === 0 ? "Beschikbaarheid invullen →" : "Aanpassen →"}
      </MoreLink>
    </div>
  );
}

async function MyHours({ ctx }: { ctx: BlockContext }) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const entries = await prisma.timeEntry.findMany({
    where: { membershipId: ctx.membershipId, date: { gte: from, lte: to } },
  });
  const sum = (status: string) =>
    entries.filter((e) => e.status === status).reduce((t, e) => t + workedHours(e), 0);
  const drafts = entries.filter((e) => e.status === "DRAFT").length;
  return (
    <div>
      <p className="text-sm">
        Goedgekeurd: <span className="font-medium">{formatHours(sum("APPROVED"))}</span>
      </p>
      <p className="mt-1 text-sm">
        In behandeling: <span className="font-medium">{formatHours(sum("SUBMITTED"))}</span>
      </p>
      {drafts > 0 && (
        <p className="mt-2 rounded-lg bg-amber/10 px-3 py-2 text-xs text-amber-dark">
          {drafts} {drafts === 1 ? "dienst wacht" : "diensten wachten"} nog op bevestiging.
        </p>
      )}
      <MoreLink href="/dashboard/hours">Naar je uren →</MoreLink>
    </div>
  );
}

async function Notifications({ ctx }: { ctx: BlockContext }) {
  const [count, latest] = await Promise.all([
    prisma.notification.count({ where: { membershipId: ctx.membershipId, read: false } }),
    prisma.notification.findMany({
      where: { membershipId: ctx.membershipId, read: false },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);
  if (count === 0) return <Empty>Geen ongelezen meldingen.</Empty>;
  return (
    <div>
      <ul className="space-y-2 text-sm">
        {latest.map((n) => (
          <li key={n.id}>
            <Link href={n.link ?? "/dashboard/notifications"} className="hover:underline">
              {n.title}
            </Link>
          </li>
        ))}
      </ul>
      <MoreLink href="/dashboard/notifications">
        {count > 3 ? `Alle ${count} meldingen →` : "Naar je meldingen →"}
      </MoreLink>
    </div>
  );
}

async function SwapRequests({ ctx }: { ctx: BlockContext }) {
  const requests = await prisma.shiftSwapRequest.findMany({
    where: { companyId: ctx.companyId, status: "PENDING_APPROVAL" },
    include: { shift: true },
    orderBy: { claimedAt: "asc" },
    take: 5,
  });
  if (requests.length === 0) return <Empty>Geen ruilverzoeken die op jou wachten.</Empty>;
  return (
    <div>
      <p className="text-sm text-amber-dark">
        {requests.length} {requests.length === 1 ? "ruilverzoek wacht" : "ruilverzoeken wachten"} op
        goedkeuring
      </p>
      <ul className="mt-2 space-y-1 text-xs text-ink/60">
        {requests.map((r) => (
          <li key={r.id} className="first-letter:uppercase">
            {fmtDay(r.shift.date)} · {r.shift.startTime}–{r.shift.endTime}
          </li>
        ))}
      </ul>
      <MoreLink href="/dashboard/rooster">Beoordelen op het rooster →</MoreLink>
    </div>
  );
}

async function HoursApproval({ ctx }: { ctx: BlockContext }) {
  const count = await prisma.timeEntry.count({
    where: { companyId: ctx.companyId, status: "SUBMITTED" },
  });
  return (
    <div>
      <p className="font-display text-3xl">{count}</p>
      <p className="text-sm text-ink/50">
        {count === 1 ? "urenregel wacht" : "urenregels wachten"} op goedkeuring
      </p>
      {count > 0 && <MoreLink href="/dashboard/hours">Naar de uren →</MoreLink>}
    </div>
  );
}

async function WorkingToday({ ctx }: { ctx: BlockContext }) {
  const today = startOfToday();
  const shifts = await prisma.shift.findMany({
    where: { companyId: ctx.companyId, date: today, NOT: { membershipId: null } },
    include: {
      department: true,
      membership: { include: { user: true, department: true } },
    },
    orderBy: { startTime: "asc" },
  });
  if (shifts.length === 0) return <Empty>Vandaag staat er niemand ingeroosterd.</Empty>;

  const groups = new Map<string, { name: string; color: string | null; items: typeof shifts }>();
  for (const s of shifts) {
    const team = s.department ?? s.membership?.department ?? null;
    const key = team?.id ?? "geen";
    if (!groups.has(key)) {
      groups.set(key, { name: team?.name ?? "Geen team", color: team?.color ?? null, items: [] });
    }
    groups.get(key)!.items.push(s);
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from(groups.values()).map((g) => (
        <div key={g.name}>
          <p
            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink/50"
            style={g.color ? { color: g.color } : undefined}
          >
            {g.color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: g.color }} />}
            {g.name}
          </p>
          <ul className="mt-1 space-y-1 text-sm">
            {g.items.map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span className="truncate">
                  {s.membership?.user.name ?? s.membership?.user.email ?? "Onbekend"}
                </span>
                <span className="shrink-0 text-ink/60">
                  {s.startTime}–{s.endTime}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

async function MissingAvailability({ ctx }: { ctx: BlockContext }) {
  const weekStart = await openAvailabilityWeek(ctx.companyId);
  if (!weekStart) return <Empty>Er staat op dit moment geen week open voor beschikbaarheid.</Empty>;
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const [members, entries] = await Promise.all([
    prisma.membership.findMany({ where: { companyId: ctx.companyId }, include: { user: true } }),
    prisma.availability.findMany({
      where: { membership: { companyId: ctx.companyId }, date: { gte: weekStart, lte: end } },
      select: { membershipId: true },
    }),
  ]);
  const filled = new Set(entries.map((e) => e.membershipId));
  const missing = members.filter((m) => !filled.has(m.id));
  if (missing.length === 0) {
    return <Empty>Iedereen heeft de beschikbaarheid voor week {getISOWeekNumber(weekStart)} ingevuld.</Empty>;
  }
  return (
    <div>
      <p className="text-sm">
        Week {getISOWeekNumber(weekStart)}: {missing.length} van {members.length} nog niet ingevuld
      </p>
      <ul className="mt-2 space-y-1 text-xs text-ink/60">
        {missing.slice(0, 5).map((m) => (
          <li key={m.id}>{m.user.name ?? m.user.email}</li>
        ))}
      </ul>
      {missing.length > 5 && <p className="mt-1 text-xs text-ink/50">en nog {missing.length - 5}</p>}
      <MoreLink href={`/dashboard/availability?week=${toDateParam(weekStart)}`}>Bekijken →</MoreLink>
    </div>
  );
}

async function RosterStatus({ ctx }: { ctx: BlockContext }) {
  const current = resolveWeek()[0];
  const next = new Date(current);
  next.setDate(next.getDate() + 7);
  const rows = await prisma.rosterWeek.findMany({
    where: { companyId: ctx.companyId, weekStart: { in: [current, next] } },
  });
  const statusOf = (d: Date) => rows.find((r) => r.weekStart.getTime() === d.getTime())?.published ?? false;
  return (
    <ul className="space-y-2 text-sm">
      {[current, next].map((d) => (
        <li key={d.toISOString()} className="flex items-center justify-between gap-3">
          <Link href={`/dashboard/rooster?week=${toDateParam(d)}`} className="hover:underline">
            Week {getISOWeekNumber(d)}
          </Link>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusOf(d) ? "bg-awning/10 text-awning" : "bg-amber/20 text-amber-dark"
            }`}
          >
            {statusOf(d) ? "Gepubliceerd" : "Concept"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function renderBlock(id: DashboardBlockId, ctx: BlockContext): React.ReactNode {
  switch (id) {
    case "team-stats":
      return <TeamStats ctx={ctx} />;
    case "team-members":
      return <TeamMembers ctx={ctx} />;
    case "next-shift":
      return <NextShift ctx={ctx} />;
    case "my-week":
      return <MyWeek ctx={ctx} />;
    case "open-shifts":
      return <OpenShifts ctx={ctx} />;
    case "availability-status":
      return <AvailabilityStatus ctx={ctx} />;
    case "my-hours":
      return <MyHours ctx={ctx} />;
    case "notifications":
      return <Notifications ctx={ctx} />;
    case "swap-requests":
      return <SwapRequests ctx={ctx} />;
    case "hours-approval":
      return <HoursApproval ctx={ctx} />;
    case "working-today":
      return <WorkingToday ctx={ctx} />;
    case "missing-availability":
      return <MissingAvailability ctx={ctx} />;
    case "roster-status":
      return <RosterStatus ctx={ctx} />;
  }
}
