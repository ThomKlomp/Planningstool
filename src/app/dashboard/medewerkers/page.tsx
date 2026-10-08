import { redirect } from "next/navigation";
import { requireMembership, requireActiveSubscription } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import JoinLink from "../settings/join-link";
import MembersManager from "./members-manager";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const { membership } = await requireMembership();
  await requireActiveSubscription(membership);
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";

  if (!canManage) {
    redirect("/dashboard");
  }

  const [members, departments] = await Promise.all([
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true, extraDepartments: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.department.findMany({
      where: { companyId: membership.companyId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, color: true },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Medewerkers</h1>
      <p className="mt-1 text-sm text-ink/60">
        Deel je medewerkers en managers in teams in en bepaal wie manager is.
        Teams zelf maak je aan bij Instellingen.
      </p>

      <section className="mt-8">
        <MembersManager
          viewerRole={membership.role}
          viewerMembershipId={membership.membershipId}
          departments={departments}
          members={members.map((m) => ({
            membershipId: m.id,
            name: m.user.name ?? m.user.email ?? "Onbekend",
            email: m.user.email ?? "",
            role: m.role,
            departmentId: m.departmentId,
            extraDepartmentIds: m.extraDepartments.map((e) => e.departmentId),
          }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Medewerkers uitnodigen via link</h2>
        <p className="mt-1 text-sm text-ink/60">
          Deel deze link met je team. Iedereen die 'm opent kan zelf inloggen
          of een account aanmaken en sluit direct aan als medewerker, je
          hoeft dan niet iedereen los uit te nodigen.
        </p>
        <div className="mt-4">
          <JoinLink slug={membership.companySlug} />
        </div>

        <h2 className="mt-8 font-display text-xl">Inloglink voor je team</h2>
        <p className="mt-1 text-sm text-ink/60">
          Medewerkers die al een account hebben kunnen deze link als
          bladwijzer opslaan of op hun beginscherm zetten. Ze komen dan
          direct op de inlogpagina van jouw zaak, zonder omweg via de
          homepage.
        </p>
        <div className="mt-4">
          <JoinLink slug={membership.companySlug} path="z" />
        </div>
      </section>
    </div>
  );
}
