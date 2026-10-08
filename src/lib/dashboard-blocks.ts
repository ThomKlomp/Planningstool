// Informatieblokken van het overzicht (/dashboard). Elke persoon kiest zelf
// welke blokken hij ziet en in welke volgorde (Membership.dashboardLayout).
// Managers en eigenaren kunnen blokken voor medewerkers vastzetten
// (Company.pinnedDashboardBlocks): die staan bovenaan en zijn niet te verwijderen.
//
// Geen Prisma/React hier: wordt ook door de API-route en de client gebruikt.

export type DashboardBlockId =
  | "team-stats"
  | "team-members"
  | "next-shift"
  | "my-week"
  | "open-shifts"
  | "availability-status"
  | "my-hours"
  | "notifications"
  | "swap-requests"
  | "hours-approval"
  | "working-today"
  | "missing-availability"
  | "roster-status";

export type DashboardBlockDef = {
  id: DashboardBlockId;
  title: string;
  description: string;
  /** ALL = iedereen; MANAGER = alleen eigenaar en managers. */
  audience: "ALL" | "MANAGER";
  /** Volle breedte op een breed scherm. */
  wide?: boolean;
};

export const DASHBOARD_BLOCKS: DashboardBlockDef[] = [
  { id: "team-stats", title: "Team in cijfers", description: "Aantal teamleden, shifts van deze week en open diensten.", audience: "ALL", wide: true },
  { id: "team-members", title: "Team", description: "Je collega's, per team.", audience: "ALL", wide: true },
  { id: "next-shift", title: "Mijn eerstvolgende dienst", description: "Wanneer en waar je als eerste weer moet werken.", audience: "ALL" },
  { id: "my-week", title: "Mijn week", description: "Je diensten van deze week en het aantal uren.", audience: "ALL" },
  { id: "open-shifts", title: "Open diensten", description: "Diensten zonder medewerker, voor medewerkers van hun eigen team.", audience: "ALL" },
  { id: "availability-status", title: "Beschikbaarheid invullen", description: "Of een week openstaat en hoeveel dagen je al hebt ingevuld.", audience: "ALL" },
  { id: "my-hours", title: "Mijn uren", description: "Je uren van deze maand: goedgekeurd en in behandeling.", audience: "ALL" },
  { id: "notifications", title: "Meldingen", description: "Je laatste ongelezen meldingen.", audience: "ALL" },
  { id: "swap-requests", title: "Ruilverzoeken", description: "Ruil- en overnameverzoeken die op goedkeuring wachten.", audience: "MANAGER" },
  { id: "hours-approval", title: "Uren ter goedkeuring", description: "Ingediende uren die nog beoordeeld moeten worden.", audience: "MANAGER" },
  { id: "working-today", title: "Wie werkt er vandaag", description: "Wie er vandaag staat ingeroosterd, per team.", audience: "MANAGER", wide: true },
  { id: "missing-availability", title: "Beschikbaarheid ontbreekt", description: "Wie nog niets heeft ingevuld voor de openstaande week.", audience: "MANAGER" },
  { id: "roster-status", title: "Rooster-status", description: "Of het rooster van deze en volgende week al is gepubliceerd.", audience: "MANAGER" },
];

const BY_ID = new Map(DASHBOARD_BLOCKS.map((b) => [b.id as string, b]));

export const DEFAULT_LAYOUT: Record<"EMPLOYEE" | "MANAGER", DashboardBlockId[]> = {
  EMPLOYEE: ["next-shift", "my-week", "open-shifts", "availability-status", "team-stats", "team-members"],
  MANAGER: ["team-stats", "swap-requests", "open-shifts", "working-today", "hours-approval"],
};

export function isManagerRole(role: string): boolean {
  return role === "OWNER" || role === "MANAGER";
}

export function blockDef(id: string): DashboardBlockDef | undefined {
  return BY_ID.get(id);
}

/** Blokken die deze rol mag gebruiken. */
export function allowedBlocks(role: string): DashboardBlockDef[] {
  const manager = isManagerRole(role);
  return DASHBOARD_BLOCKS.filter((b) => manager || b.audience === "ALL");
}

/** Blokken die een manager voor medewerkers kan vastzetten. */
export function pinnableBlockIds(): string[] {
  return DASHBOARD_BLOCKS.filter((b) => b.audience === "ALL").map((b) => b.id);
}

/** Leest een opgeslagen indeling veilig uit de database (JSON). */
export function parseLayout(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((v): v is string => typeof v === "string");
}

export type ResolvedLayout = {
  /** Door een manager vastgezet (alleen voor medewerkers), bovenaan en niet te wijzigen. */
  pinned: DashboardBlockId[];
  /** Eigen blokken in de gekozen volgorde. */
  own: DashboardBlockId[];
  /** Blokken die nog niet op het overzicht staan en dus toegevoegd kunnen worden. */
  available: DashboardBlockDef[];
};

export function resolveLayout(
  role: string,
  storedLayout: unknown,
  companyPinned: string[]
): ResolvedLayout {
  const manager = isManagerRole(role);
  const allowed = new Set(allowedBlocks(role).map((b) => b.id as string));

  const pinned = manager
    ? []
    : (companyPinned.filter((id) => allowed.has(id) && pinnableBlockIds().includes(id)) as DashboardBlockId[]);
  const pinnedSet = new Set<string>(pinned);

  const base = parseLayout(storedLayout) ?? DEFAULT_LAYOUT[manager ? "MANAGER" : "EMPLOYEE"];
  const seen = new Set<string>();
  const own: DashboardBlockId[] = [];
  for (const id of base) {
    if (!allowed.has(id) || pinnedSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    own.push(id as DashboardBlockId);
  }

  const shown = new Set<string>([...pinned, ...own]);
  const available = allowedBlocks(role).filter((b) => !shown.has(b.id));
  return { pinned, own, available };
}
