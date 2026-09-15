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
