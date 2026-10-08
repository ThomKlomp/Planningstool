import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMembership, requireActiveSubscription } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { resolveWeek, toDateParam } from "@/lib/week";
import { slotLabel } from "@/lib/availability-slots";
import { workedHours, formatHours } from "@/lib/worked-hours";
import WeekNav from "../../week-nav";
import { StatusBadge } from "../../hours/entry-parts";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "beschikbaarheid", label: "Beschikbaarheid" },
  { id: "rooster", label: "Rooster" },
  { id: "uren", label: "Uren" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const ROLE_LABEL = { OWNER: "Eigenaar", MANAGER: "Manager", EMPLOYEE: "Medewerker" } as const;

const AVAILABILITY_LABEL = {
  AVAILABLE: { text: "Beschikbaar", className: "bg-awning/10 text-awning" },
  UNAVAILABLE: { text: "Niet beschikbaar", className: "bg-red-50 text-red-600" },
  UNSURE: { text: "Weet ik nog niet", className: "bg-amber/20 text-amber-dark" },
} as const;

const dayLabel = (d: Date) =>
  d.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: { membershipId: string };
  searchParams: { tab?: string; week?: string };
}) {
  const { membership } = await requireMembership();
  await requireActiveSubscription(membership);
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  if (!canManage) redirect("/dashboard");

  const member = await prisma.membership.findUnique({
    where: { id: params.membershipId },
    include: {
      user: true,
      department: true,
      extraDepartments: { include: { department: true } },
    },
  });
  if (!member || member.companyId !== membership.companyId) notFound();

  const tab: TabId = TABS.some((t) => t.id === searchParams?.tab)
    ? (searchParams.tab as TabId)
    : "beschikbaarheid";
  const week = resolveWeek(searchParams?.week);
  const range = { gte: week[0], lte: week[6] };
  const basePath = `/dashboard/medewerkers/${member.id}`;
  const weekParam = toDateParam(week[0]);

  const name = member.user.name ?? member.user.email ?? "Onbekend";
  const teams = [
    ...(member.department ? [member.department] : []),
    ...member.extraDepartments.map((e) => e.department),
  ];

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/medewerkers" className="text-sm text-ink/50 hover:text-ink hover:underline">
        ← Medewerkers
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="font-display text-3xl">{name}</h1>
        <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink/60">
          {ROLE_LABEL[member.role]}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink/50">{member.user.email}</p>
      {teams.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {teams.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs"
              style={{ borderColor: t.color }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line text-sm">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`${basePath}?tab=${t.id}&week=${weekParam}`}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2 ${
              tab === t.id
                ? "border-ink font-medium text-ink"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <WeekNav basePath={basePath} weekStart={week[0]} extraQuery={`tab=${tab}`} />
      </div>

      <div className="mt-5">
        {tab === "beschikbaarheid" && (
          <AvailabilityTab
            membershipId={member.id}
            companyId={member.companyId}
            week={week}
            range={range}
          />
        )}
        {tab === "rooster" && <ScheduleTab membershipId={member.id} week={week} range={range} />}
        {tab === "uren" && <HoursTab membershipId={member.id} week={week} range={range} />}
      </div>
    </div>
  );
}

type TabProps = { membershipId: string; week: Date[]; range: { gte: Date; lte: Date } };

async function AvailabilityTab({
  membershipId,
  companyId,
  week,
  range,
}: TabProps & { companyId: string }) {
  const [entries, templates, slots] = await Promise.all([
    prisma.availability.findMany({
      where: { membershipId, date: range },
      orderBy: [{ date: "asc" }, { daypart: "asc" }],
    }),
    prisma.shiftTemplate.findMany({ where: { companyId } }),
    prisma.availabilitySlot.findMany({ where: { companyId, date: range } }),
  ]);

  const daypartLabel = (daypart: string) => {
    if (!daypart) return "Hele dag";
    const template = templates.find((t) => t.id === daypart);
    if (template) return `${template.name} (${template.startTime}–${template.endTime})`;
    return slotLabel(daypart, slots) ?? daypart;
  };

  if (entries.length === 0) {
    return <Empty>Deze week heeft nog geen beschikbaarheid doorgegeven.</Empty>;
  }

  return (
    <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
      {week.map((day) => {
        const dayEntries = entries.filter((e) => e.date.toDateString() === day.toDateString());
        return (
          <li key={day.toISOString()} className="px-4 py-3">
            <p className="font-medium capitalize">{dayLabel(day)}</p>
            {dayEntries.length === 0 ? (
              <p className="mt-1 text-xs text-ink/40">Niet ingevuld</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {dayEntries.map((e) => {
                  const label = AVAILABILITY_LABEL[e.status];
                  return (
                    <li key={e.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span className="text-ink/60">{daypartLabel(e.daypart)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 font-medium ${label.className}`}>
                        {label.text}
                      </span>
                      {e.note && <span className="text-ink/50">“{e.note}”</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

async function ScheduleTab({ membershipId, week, range }: TabProps) {
  const shifts = await prisma.shift.findMany({
    where: { membershipId, date: range },
    include: { department: true },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  if (shifts.length === 0) {
    return <Empty>Deze week staat er niets in het rooster.</Empty>;
  }

  const total = shifts.reduce(
    (sum, s) => sum + workedHours({ startTime: s.startTime, endTime: s.endTime, breakMinutes: 0 }),
    0
  );

  return (
    <div>
      <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
        {week.map((day) => {
          const dayShifts = shifts.filter((s) => s.date.toDateString() === day.toDateString());
          if (dayShifts.length === 0) return null;
          return (
            <li key={day.toISOString()} className="px-4 py-3">
              <p className="font-medium capitalize">{dayLabel(day)}</p>
              <ul className="mt-1.5 space-y-1">
                {dayShifts.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-x-2 text-xs">
                    <span className="font-medium">
                      {s.startTime}–{s.endTime}
                    </span>
                    {s.role && <span className="text-ink/60">{s.role}</span>}
                    {s.department && (
                      <span className="inline-flex items-center gap-1 text-ink/60">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: s.department.color }}
                        />
                        {s.department.name}
                      </span>
                    )}
                    {s.note && <span className="text-ink/50">“{s.note}”</span>}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-ink/60">
        Ingeroosterd deze week: <span className="font-medium text-ink">{formatHours(total)}</span>{" "}
        ({shifts.length} {shifts.length === 1 ? "dienst" : "diensten"})
      </p>
    </div>
  );
}

async function HoursTab({ membershipId, week, range }: TabProps) {
  const entries = await prisma.timeEntry.findMany({
    where: { membershipId, date: range },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  if (entries.length === 0) {
    return <Empty>Deze week zijn er nog geen uren ingevuld.</Empty>;
  }

  // Zelfde regel als "Mijn gewerkte uren": alleen goedgekeurd en ingediend tellen mee.
  const approved = entries
    .filter((e) => e.status === "APPROVED")
    .reduce((sum, e) => sum + workedHours(e), 0);
  const pending = entries
    .filter((e) => e.status === "SUBMITTED")
    .reduce((sum, e) => sum + workedHours(e), 0);

  return (
    <div>
      <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
        {week.map((day) => {
          const dayEntries = entries.filter((e) => e.date.toDateString() === day.toDateString());
          if (dayEntries.length === 0) return null;
          return (
            <li key={day.toISOString()} className="px-4 py-3">
              <p className="font-medium capitalize">{dayLabel(day)}</p>
              <ul className="mt-1.5 space-y-2">
                {dayEntries.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="font-medium">
                      {e.startTime}–{e.endTime}
                    </span>
                    <span className="text-ink/60">
                      {formatHours(workedHours(e))}
                      {e.breakMinutes > 0 ? `, ${e.breakMinutes} min pauze` : ""}
                    </span>
                    <StatusBadge status={e.status} small />
                    {e.note && <span className="text-ink/50">“{e.note}”</span>}
                    {e.managerComment && (
                      <span className="text-amber-dark">Vraag: {e.managerComment}</span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-ink/60">
        Goedgekeurd: <span className="font-medium text-ink">{formatHours(approved)}</span>
        {pending > 0 && (
          <>
            {" · "}In behandeling: <span className="font-medium text-ink">{formatHours(pending)}</span>
          </>
        )}
      </p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-ink/5 px-4 py-3 text-sm text-ink/60">{children}</p>;
}
