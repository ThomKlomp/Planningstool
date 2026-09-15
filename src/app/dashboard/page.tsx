import Link from "next/link";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { resolveWeek } from "@/lib/week";
import TeamSection from "./team-section";
import MemberList from "./member-list";
import JoinLink from "./settings/join-link";

export default async function DashboardOverviewPage() {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const week = resolveWeek();

  const [members, pendingInvites, weekShifts, pendingHours, pendingSwapCount, company] =
    await Promise.all([
      prisma.membership.findMany({
        where: { companyId: membership.companyId },
        include: { user: true, department: true },
        orderBy: { createdAt: "asc" },
      }),
      canManage
        ? prisma.invite.findMany({
            where: { companyId: membership.companyId, acceptedAt: null },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      prisma.shift.findMany({
        where: { companyId: membership.companyId, date: { gte: week[0], lte: week[6] } },
      }),
      canManage
        ? prisma.timeEntry.count({
            where: { companyId: membership.companyId, status: "SUBMITTED" },
          })
        : Promise.resolve(0),
      canManage
        ? prisma.shiftSwapRequest.count({
            where: { companyId: membership.companyId, status: "PENDING_APPROVAL" },
          })
        : Promise.resolve(0),
      canManage
        ? prisma.company.findUnique({
            where: { id: membership.companyId },
            select: {
              slug: true,
              billingName: true,
              kvkNumber: true,
              address: true,
              postalCode: true,
            },
          })
        : Promise.resolve(null),
    ]);

  const openShiftCount = weekShifts.filter((s) => !s.membershipId).length;
  const assignedMembershipIds = new Set(
    weekShifts.filter((s) => s.membershipId).map((s) => s.membershipId as string)
  );
  const membersWithoutShiftCount = members.filter((m) => !assignedMembershipIds.has(m.id)).length;

  const billingIncomplete =
    canManage &&
    company &&
    !(company.billingName && company.kvkNumber && company.address && company.postalCode);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Overzicht</h1>

      {billingIncomplete && (
        <div className="mt-4 rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber-dark">
          Bedrijfsgegevens nog niet compleet, nodig voor je factuur.{" "}
          <Link href="/dashboard/settings" className="underline hover:no-underline">
            Aanvullen
          </Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Teamleden" value={members.length} />
        <StatCard label="Shifts deze week" value={weekShifts.length} />
        <StatCard label="Nog niet toegewezen" value={openShiftCount} />
        <StatCard label="Zonder shift deze week" value={membersWithoutShiftCount} />
        {canManage && <StatCard label="Uren ter goedkeuring" value={pendingHours} />}
        {canManage && pendingSwapCount > 0 && (
          <Link
            href="/dashboard/roster"
            className="rounded-xl border border-amber/40 bg-amber/10 px-5 py-4 transition-colors hover:border-amber"
          >
            <p className="text-2xl font-display text-amber-dark">{pendingSwapCount}</p>
            <p className="text-sm text-amber-dark">
              {pendingSwapCount === 1
                ? "ruilverzoek wacht op goedkeuring"
                : "ruilverzoeken wachten op goedkeuring"}
            </p>
          </Link>
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl">Team</h2>
        <div className="mt-3">
          <MemberList
            initialMembers={members.map((m) => ({
              id: m.id,
              name: m.user.name ?? m.user.email ?? "Onbekend",
              email: m.user.email ?? "",
              role: m.role,
              departmentName: m.department?.name ?? null,
              departmentColor: m.department?.color ?? null,
            }))}
            canManage={canManage}
            viewerRole={membership.role}
            viewerMembershipId={membership.membershipId}
          />
        </div>
      </section>

      {canManage && company?.slug && (
        <section className="mt-10">
          <h2 className="font-display text-xl">Medewerkers uitnodigen via link</h2>
          <p className="mt-1 text-sm text-ink/60">
            Deel deze link met je team, iedereen die 'm opent sluit zichzelf
            aan als medewerker.
          </p>
          <div className="mt-4">
            <JoinLink slug={company.slug} />
          </div>
        </section>
      )}

      {canManage && (
        <TeamSection
          initialPendingInvites={pendingInvites.map((i) => ({
            id: i.id,
            email: i.email,
            role: i.role,
            token: i.token,
          }))}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white px-5 py-4">
      <p className="text-2xl font-display">{value}</p>
      <p className="text-sm text-ink/50">{label}</p>
    </div>
  );
}
