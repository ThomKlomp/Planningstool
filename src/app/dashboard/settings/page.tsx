import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import ShiftTemplatesManager from "./shift-templates-manager";
import AutoOpenWeeksSetting from "./auto-open-weeks-setting";
import ClosedDaysManager from "./closed-days-manager";
import ClosedWeekdaysSetting from "./closed-weekdays-setting";
import DepartmentsManager from "./departments-manager";

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
      select: { autoOpenWeeks: true, closedWeekdays: true },
    }),
    prisma.closedDay.findMany({
      where: { companyId: membership.companyId, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    prisma.department.findMany({
      where: { companyId: membership.companyId },
      orderBy: { name: "asc" },
    }),
    prisma.membership.findMany({
      where: { companyId: membership.companyId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Instellingen</h1>
      <p className="mt-1 text-sm text-ink/60">
        Basisinstellingen voor {membership.companyName}.
      </p>

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
          Deel je medewerkers in teams in, bijvoorbeeld Bediening en Keuken —
          dan zie je dat onderscheid terug op het rooster.
        </p>
        <div className="mt-4">
          <DepartmentsManager
            initialDepartments={departments.map((d) => ({ id: d.id, name: d.name }))}
            members={members.map((m) => ({
              membershipId: m.id,
              name: m.user.name ?? m.user.email ?? "Onbekend",
              departmentId: m.departmentId,
            }))}
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
