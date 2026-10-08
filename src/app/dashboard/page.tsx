import Link from "next/link";
import { requireMembership, requireActiveSubscription } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { allowedBlocks, isManagerRole, pinnableBlockIds, resolveLayout } from "@/lib/dashboard-blocks";
import MemberList from "./member-list";
import DashboardBoard from "./overview/dashboard-board";
import { renderBlock } from "./overview/blocks";

// Het overzicht toont tellers (open diensten, wachtende overnames) die anders
// een tijdje verouderd kunnen blijven staan na een actie elders in de app.
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const { membership } = await requireMembership();
  await requireActiveSubscription(membership);
  const canManage = isManagerRole(membership.role);

  const [me, company, members] = await Promise.all([
    prisma.membership.findUnique({
      where: { id: membership.membershipId },
      select: { dashboardLayout: true },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: {
        pinnedDashboardBlocks: true,
        billingName: true,
        kvkNumber: true,
        address: true,
        postalCode: true,
      },
    }),
    // De teamlijst onderaan is alleen voor medewerkers (managers hebben het tabblad Medewerkers).
    canManage
      ? Promise.resolve([])
      : prisma.membership.findMany({
          where: { companyId: membership.companyId },
          include: { user: true, department: true },
          orderBy: { createdAt: "asc" },
        }),
  ]);

  const layout = resolveLayout(
    membership.role,
    me?.dashboardLayout,
    company?.pinnedDashboardBlocks ?? []
  );

  // Alleen de blokken die nu getoond worden, worden op de server uitgerekend.
  const ctx = {
    membershipId: membership.membershipId,
    companyId: membership.companyId,
    role: membership.role,
  };
  const nodes: Record<string, React.ReactNode> = {};
  for (const id of [...layout.pinned, ...layout.own]) nodes[id] = renderBlock(id, ctx);

  const billingIncomplete =
    canManage &&
    company &&
    !(company.billingName && company.kvkNumber && company.address && company.postalCode);

  const pinnable = pinnableBlockIds();

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

      <DashboardBoard
        isManager={canManage}
        blocks={allowedBlocks(membership.role).map((b) => ({
          id: b.id,
          title: b.title,
          description: b.description,
          wide: Boolean(b.wide),
          pinnable: pinnable.includes(b.id),
        }))}
        pinnedIds={layout.pinned}
        ownIds={layout.own}
        nodes={nodes}
        initialPinnedByManager={company?.pinnedDashboardBlocks ?? []}
      />

      <section className="mt-10">
        <h2 className="font-display text-xl">Team</h2>
        {canManage ? (
          <p className="mt-1 text-sm text-ink/60">
            Medewerkers beheren, uitnodigen en indelen in teams doe je bij{" "}
            <Link href="/dashboard/medewerkers" className="text-awning underline hover:no-underline">
              Medewerkers
            </Link>
            .
          </p>
        ) : (
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
              canManage={false}
              viewerRole={membership.role}
              viewerMembershipId={membership.membershipId}
              isDemoCompany={membership.companySlug === "demo"}
            />
          </div>
        )}
      </section>
    </div>
  );
}
