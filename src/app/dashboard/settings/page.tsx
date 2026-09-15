import { redirect } from "next/navigation";
import Link from "next/link";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import ShiftTemplatesManager from "./shift-templates-manager";
import AutoOpenWeeksSetting from "./auto-open-weeks-setting";
import ClosedDaysManager from "./closed-days-manager";
import ClosedWeekdaysSetting from "./closed-weekdays-setting";
import DepartmentsManager from "./departments-manager";
import RosterVisibilitySetting from "./roster-visibility-setting";
import AutoApprovalSettings from "./auto-approval-settings";
import JoinLink from "./join-link";
import CompanyDetailsSetting from "./company-details-setting";

export default async function SettingsPage() {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";

  if (!canManage) {
    redirect("/dashboard");
  }

  const [shiftTemplates, company, closedDays, departments, members] = await Promise.all([
    prisma.shiftTemplate.findMany({
      where: { companyId: membership.companyId },
      orderBy: { startTime: "asc" },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: {
        slug: true,
        autoOpenWeeks: true,
        closedWeekdays: true,
        showCompanyRosterToEmployees: true,
        autoApproveShiftSwaps: true,
        autoApproveHours: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        billingName: true,
        kvkNumber: true,
        vatNumber: true,
        address: true,
        postalCode: true,
      },
    }),
    prisma.closedDay.findMany({
      where: { companyId: membership.companyId, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    prisma.department.findMany({
      where: { companyId: membership.companyId },
      orderBy: { order: "asc" },
    }),
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const trialDaysLeft = company?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil((company.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      )
    : null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Instellingen</h1>
      <p className="mt-1 text-sm text-ink/60">
        Basisinstellingen voor {membership.companyName}.
      </p>

      {membership.role === "OWNER" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/settings/billing"
            className="inline-block rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink"
          >
            Facturering →
          </Link>
          <SubscriptionStatusBadge
            status={company?.subscriptionStatus ?? "TRIALING"}
            trialDaysLeft={trialDaysLeft}
          />
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl">Bedrijfsgegevens</h2>
        <p className="mt-1 text-sm text-ink/60">
          Nodig voor je facturen. Vul deze in ieder geval in voordat je een
          betaald abonnement afsluit.
        </p>
        <div className="mt-4">
          <CompanyDetailsSetting
            initialValue={{
              billingName: company?.billingName ?? "",
              kvkNumber: company?.kvkNumber ?? "",
              vatNumber: company?.vatNumber ?? "",
              address: company?.address ?? "",
              postalCode: company?.postalCode ?? "",
            }}
          />
        </div>
      </section>

      {company?.slug && (
        <section className="mt-10">
          <h2 className="font-display text-xl">Medewerkers uitnodigen via link</h2>
          <p className="mt-1 text-sm text-ink/60">
            Deel deze link met je team. Iedereen die 'm opent kan zelf inloggen
            of een account aanmaken en sluit direct aan als medewerker, je
            hoeft dan niet iedereen los uit te nodigen.
          </p>
          <div className="mt-4">
            <JoinLink slug={company.slug} />
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl">Beschikbaarheid automatisch openen</h2>
        <p className="mt-1 text-sm text-ink/60">
          Een week staat standaard dicht voor medewerkers, totdat hij binnen
          dit aantal weken vooruit valt. Zodra een nieuwe week opengaat, krijgt
          iedereen daar automatisch een e-mail over.
        </p>
        <div className="mt-4">
          <AutoOpenWeeksSetting initialValue={company?.autoOpenWeeks ?? 2} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Vaste sluitingsdagen</h2>
        <p className="mt-1 text-sm text-ink/60">
          Dagen dat de zaak structureel dicht is, bijvoorbeeld elke maandag
          en dinsdag.
        </p>
        <div className="mt-4">
          <ClosedWeekdaysSetting initialWeekdays={company?.closedWeekdays ?? []} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Gesloten dagen</h2>
        <p className="mt-1 text-sm text-ink/60">
          Losse dagen dat de zaak dicht is (feestdag, vakantie). Deze dagen
          verdwijnen uit de datumprikker en het rooster, en er kunnen geen
          uren op ingediend worden.
        </p>
        <div className="mt-4">
          <ClosedDaysManager
            initialClosedDays={closedDays.map((c) => ({
              id: c.id,
              date: c.date.toISOString().slice(0, 10),
              reason: c.reason,
            }))}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Teams</h2>
        <p className="mt-1 text-sm text-ink/60">
          Deel je medewerkers in teams in, bijvoorbeeld Bediening en Keuken,
          dan zie je dat onderscheid terug op het rooster.
        </p>
        <div className="mt-4">
          <DepartmentsManager
            initialDepartments={departments.map((d) => ({
              id: d.id,
              name: d.name,
              color: d.color,
              order: d.order,
            }))}
            members={members.map((m) => ({
              membershipId: m.id,
              name: m.user.name ?? m.user.email ?? "Onbekend",
              departmentId: m.departmentId,
            }))}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Rooster-zichtbaarheid</h2>
        <p className="mt-1 text-sm text-ink/60">
          Bepaal of medewerkers het volledige bedrijfsrooster mogen zien, of
          alleen hun eigen team en eigen diensten.
        </p>
        <div className="mt-4">
          <RosterVisibilitySetting
            initialValue={company?.showCompanyRosterToEmployees ?? true}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Automatisch goedkeuren</h2>
        <p className="mt-1 text-sm text-ink/60">
          Standaard beoordeel jij elke overname/ruil en elke ingediende
          urenregel zelf. Hier kun je dat automatiseren.
        </p>
        <div className="mt-4">
          <AutoApprovalSettings
            initialShiftSwaps={company?.autoApproveShiftSwaps ?? false}
            initialHours={company?.autoApproveHours ?? false}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl">Standaard shifts</h2>
        <p className="mt-1 text-sm text-ink/60">
          Medewerkers geven hun beschikbaarheid dan per shift door in plaats
          van alleen voor de hele dag. Bijvoorbeeld: een middagshift van
          12:00–18:00 en een avondshift van 17:00–23:00 op doordeweekse
          dagen.
        </p>
        <div className="mt-4">
          <ShiftTemplatesManager
            initialTemplates={shiftTemplates.map((t) => ({
              id: t.id,
              name: t.name,
              startTime: t.startTime,
              endTime: t.endTime,
              weekdays: t.weekdays,
            }))}
          />
        </div>
      </section>
    </div>
  );
}

function SubscriptionStatusBadge({
  status,
  trialDaysLeft,
}: {
  status: string;
  trialDaysLeft: number | null;
}) {
  const config: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: "Actief",
      className: "border-awning/30 bg-awning/10 text-awning",
    },
    TRIALING: {
      label:
        trialDaysLeft !== null
          ? trialDaysLeft > 0
            ? `Proefperiode, nog ${trialDaysLeft} ${trialDaysLeft === 1 ? "dag" : "dagen"}`
            : "Proefperiode afgelopen"
          : "Proefperiode",
      className: "border-amber/30 bg-amber/10 text-amber-dark",
    },
    PAST_DUE: {
      label: "Fout met betaling",
      className: "border-red-200 bg-red-50 text-red-600",
    },
    CANCELED: {
      label: "Niet actief",
      className: "border-line bg-ink/5 text-ink/50",
    },
  };

  const { label, className } = config[status] ?? config.TRIALING;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
