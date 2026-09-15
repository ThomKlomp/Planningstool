import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import TeamSection from "./team-section";

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
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{m.user.name ?? m.user.email}</p>
                <p className="text-xs text-ink/50">{m.user.email}</p>
              </div>
              <span className="text-xs uppercase tracking-wide text-ink/40">
                {m.role}
              </span>
            </li>
          ))}
        </ul>
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
