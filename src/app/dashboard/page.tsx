import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import TeamSection from "./team-section";
import MemberList from "./member-list";

export default async function DashboardOverviewPage() {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";

  const [members, pendingInvites, openShiftCount, pendingHours] = await Promise.all([
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    canManage
      ? prisma.invite.findMany({
          where: { companyId: membership.companyId, acceptedAt: null },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.shift.count({
      where: { companyId: membership.companyId, membershipId: null },
    }),
    canManage
      ? prisma.timeEntry.count({
          where: { companyId: membership.companyId, status: "SUBMITTED" },
        })
      : Promise.resolve(0),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl">Overzicht</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Teamleden" value={members.length} />
        <StatCard label="Openstaande shifts" value={openShiftCount} />
        {canManage && (
          <StatCard label="Uren ter goedkeuring" value={pendingHours} />
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl">Team</h2>
        <MemberList
          initialMembers={members.map((m) => ({
            id: m.id,
            name: m.user.name ?? m.user.email ?? "Onbekend",
            email: m.user.email ?? "",
            role: m.role,
          }))}
          canManage={canManage}
          viewerRole={membership.role}
          viewerMembershipId={membership.membershipId}
        />
      </section>

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
