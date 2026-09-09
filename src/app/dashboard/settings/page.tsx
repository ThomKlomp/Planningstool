import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import ShiftTemplatesManager from "./shift-templates-manager";

export default async function SettingsPage() {
  const { membership } = await requireMembership();
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";

  if (!canManage) {
    redirect("/dashboard");
  }

  const shiftTemplates = await prisma.shiftTemplate.findMany({
    where: { companyId: membership.companyId },
    orderBy: { startTime: "asc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Instellingen</h1>
      <p className="mt-1 text-sm text-ink/60">
        Basisinstellingen voor {membership.companyName}.
      </p>

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
