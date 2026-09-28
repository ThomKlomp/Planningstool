import { prisma } from "@/lib/prisma";

/**
 * Een medewerker heeft één hoofdteam (Membership.departmentId) en eventueel
 * extra teams (MembershipDepartment). Een dienst hoort standaard bij het
 * hoofdteam; alleen bij een medewerker met extra teams kan de manager per
 * dienst kiezen voor welk team die gewerkt wordt (Shift.departmentId).
 */
export function teamIdsOf(m: {
  departmentId: string | null;
  extraDepartments?: { departmentId: string }[];
}): string[] {
  const ids = m.departmentId ? [m.departmentId] : [];
  for (const e of m.extraDepartments ?? []) {
    if (!ids.includes(e.departmentId)) ids.push(e.departmentId);
  }
  return ids;
}

/**
 * Bepaalt welke departmentId er op een dienst opgeslagen moet worden.
 * Leeg = hoofdteam van de medewerker. Alleen een team van die medewerker
 * (hoofd- of extra team) is toegestaan.
 */
export async function resolveShiftDepartment(
  companyId: string,
  membershipId: string | null | undefined,
  requested: string | null | undefined
): Promise<{ ok: true; departmentId: string | null } | { ok: false; error: string }> {
  if (!requested || !membershipId) return { ok: true, departmentId: null };

  const member = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { extraDepartments: true },
  });
  if (!member || member.companyId !== companyId) {
    return { ok: false, error: "Ongeldige medewerker" };
  }
  if (requested === member.departmentId) return { ok: true, departmentId: null };
  if (!member.extraDepartments.some((e) => e.departmentId === requested)) {
    return { ok: false, error: "Deze medewerker zit niet in dat team" };
  }
  return { ok: true, departmentId: requested };
}
