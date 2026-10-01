import { prisma } from "@/lib/prisma";

/**
 * Bepaalt welk team (departmentId) een nieuw lid krijgt.
 * - Geen teams ingesteld: geen keuze nodig, departmentId blijft null.
 * - Precies 1 team: vanzelfsprekend, wordt automatisch toegewezen.
 * - 2 of meer teams: een geldige keuze uit `requestedDepartmentId` is verplicht.
 */
export async function resolveDepartmentId(
  companyId: string,
  requestedDepartmentId: string | null | undefined
): Promise<{ departmentId: string | null; error?: string }> {
  const departments = await prisma.department.findMany({
    where: { companyId },
    select: { id: true },
  });

  if (departments.length === 0) {
    return { departmentId: null };
  }
  if (departments.length === 1) {
    return { departmentId: departments[0].id };
  }
  if (!requestedDepartmentId || !departments.some((d) => d.id === requestedDepartmentId)) {
    return { departmentId: null, error: "Kies een team" };
  }
  return { departmentId: requestedDepartmentId };
}

/**
 * Team voor een nieuw lid dat via een uitnodiging binnenkomt. Heeft de manager
 * bij het uitnodigen een team gekozen (en bestaat dat team nog), dan krijgt de
 * medewerker dat team. Anders geldt de gewone regel (zie hierboven): de
 * medewerker kiest zelf. Alleen medewerkers krijgen een team, managers niet.
 */
export async function resolveInviteDepartmentId(
  invite: { companyId: string; role: string; departmentId: string | null },
  requestedDepartmentId: string | null | undefined
): Promise<{ departmentId: string | null; error?: string }> {
  if (invite.role !== "EMPLOYEE") {
    return { departmentId: null };
  }
  if (invite.departmentId) {
    const preset = await prisma.department.findFirst({
      where: { id: invite.departmentId, companyId: invite.companyId },
      select: { id: true },
    });
    if (preset) {
      return { departmentId: preset.id };
    }
  }
  return resolveDepartmentId(invite.companyId, requestedDepartmentId);
}
