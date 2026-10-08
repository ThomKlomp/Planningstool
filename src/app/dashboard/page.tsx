import Link from "next/link";
import { requireMembership, requireActiveSubscription } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import { allowedBlocks, isManagerRole, pinnableBlockIds, resolveLayout } from "@/lib/dashboard-blocks";
import DashboardBoard from "./overview/dashboard-board";
import { renderBlock } from "./overview/blocks";

// Het overzicht toont tellers (open diensten, wachtende overnames) die anders
// een tijdje verouderd kunnen blijven staan na een actie elders in de app.
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const { membership } = await requireMembership();
  await requireActiveSubscription(membership);
  const canManage = isManagerRole(membership.role);

  const [me, company] = await Promise.all([
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
    companySlug: membership.companySlug,
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
    <div>
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
    </div>
  );
}
