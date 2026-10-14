import { prisma } from "@/lib/prisma";

// Locaties zijn een kostenplaats binnen één zaak (zie Location in het schema).
// Regel die overal terugkomt: een medewerker zonder locatiekoppeling werkt op alle locaties.

export const LOCATION_PALETTE = [
  "#2563EB",
  "#DB2777",
  "#0D9488",
  "#7C3AED",
  "#C9821F",
  "#92400E",
  "#475569",
  "#3F6E5B",
];

export type LocationLite = { id: string; name: string; color: string };

type WithLocations = { locations?: { locationId: string }[] };

/** Locatie-id's waaraan een lid gekoppeld is (leeg = alle locaties). */
export function locationIdsOf(m: WithLocations): string[] {
  return (m.locations ?? []).map((l) => l.locationId);
}

/** Werkt dit lid op die locatie? Zonder koppeling: ja, overal. */
export function worksAtLocation(m: WithLocations, locationId: string): boolean {
  const ids = locationIdsOf(m);
  return ids.length === 0 || ids.includes(locationId);
}

/**
 * Welke locaties mag deze kijker zien? null = alle. Managers en eigenaren zien
 * alles; een medewerker alleen de eigen locaties als de zaak dat zo heeft
 * ingesteld (en als die medewerker aan locaties gekoppeld is).
 */
export function visibleLocationIds(opts: {
  canManage: boolean;
  showAllToEmployees: boolean;
  own: WithLocations;
}): string[] | null {
  if (opts.canManage || opts.showAllToEmployees) return null;
  const ids = locationIdsOf(opts.own);
  return ids.length === 0 ? null : ids;
}

/** Gekozen locatiefilter uit de URL, alleen als de kijker die locatie mag zien. */
export function resolveLocationFilter(
  requested: string | undefined,
  locations: { id: string }[],
  visible: string[] | null
): string {
  if (!requested) return "";
  if (!locations.some((l) => l.id === requested)) return "";
  if (visible && !visible.includes(requested)) return "";
  return requested;
}

/**
 * Hoort een dienst bij de locatie (filter)? Een dienst met locatie telt alleen
 * daar; een dienst zonder locatie telt overal waar de medewerker werkt (een open
 * dienst zonder locatie: overal).
 */
export function shiftAtLocation(
  s: { locationId: string | null; membership?: WithLocations | null },
  locationId: string
): boolean {
  if (s.locationId) return s.locationId === locationId;
  if (!s.membership) return true;
  return worksAtLocation(s.membership, locationId);
}

/** Mag een kijker met beperkt zicht deze dienst zien? */
export function shiftVisibleTo(
  s: { locationId: string | null; membership?: WithLocations | null },
  visible: string[] | null
): boolean {
  if (!visible) return true;
  if (s.locationId) return visible.includes(s.locationId);
  if (!s.membership) return true;
  const ids = locationIdsOf(s.membership);
  return ids.length === 0 || ids.some((id) => visible.includes(id));
}

/**
 * Bepaalt welke locatie op een dienst komt. Leeg + een medewerker met precies één
 * locatie: die locatie. Een medewerker met locaties mag alleen op een eigen locatie
 * ingeroosterd worden; zonder koppeling mag elke locatie. Een open dienst mag elke
 * locatie van de zaak hebben.
 */
export async function resolveShiftLocation(
  companyId: string,
  membershipId: string | null | undefined,
  requested: string | null | undefined
): Promise<{ ok: true; locationId: string | null } | { ok: false; error: string }> {
  if (requested) {
    const loc = await prisma.location.findUnique({ where: { id: requested } });
    if (!loc || loc.companyId !== companyId) return { ok: false, error: "Ongeldige locatie" };
  }
  if (!membershipId) return { ok: true, locationId: requested || null };

  const member = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { locations: true },
  });
  if (!member || member.companyId !== companyId) return { ok: false, error: "Ongeldige medewerker" };
  const own = locationIdsOf(member);
  if (!requested) return { ok: true, locationId: own.length === 1 ? own[0] : null };
  if (own.length > 0 && !own.includes(requested)) {
    return { ok: false, error: "Deze medewerker is niet aan die locatie gekoppeld" };
  }
  return { ok: true, locationId: requested };
}

/** Alle locaties van een zaak, in de ingestelde volgorde. */
export async function listLocations(companyId: string) {
  return prisma.location.findMany({
    where: { companyId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true, order: true },
  });
}
