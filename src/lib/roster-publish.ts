import { prisma } from "@/lib/prisma";
import { getWeekDates } from "@/lib/week";

// Het rooster van een (huidige of toekomstige) week is pas zichtbaar voor
// medewerkers nadat een manager/eigenaar het gepubliceerd heeft. Weken in het
// verleden zijn altijd zichtbaar (er valt niets meer te verbergen). Eigenaar
// en managers zien het rooster altijd, ook als concept.

/** Sleutel voor een week, gebaseerd op de maandag ("YYYY-MM-DD"). */
export function weekKey(weekStart: Date): string {
  return weekStart.toISOString().slice(0, 10);
}

/** Maandag van de week waarin `date` valt. */
export function weekStartOf(date: Date): Date {
  return getWeekDates(date)[0];
}

export function isPastWeek(weekStart: Date): boolean {
  const currentWeekStart = getWeekDates(new Date())[0];
  return weekStart.getTime() < currentWeekStart.getTime();
}

export async function isRosterPublished(companyId: string, weekStart: Date): Promise<boolean> {
  if (isPastWeek(weekStart)) return true;
  const row = await prisma.rosterWeek.findUnique({
    where: { companyId_weekStart: { companyId, weekStart } },
    select: { published: true },
  });
  return row?.published ?? false;
}

/**
 * Filtert een lijst met datum-objecten (shifts, urenregels, ...) op wat een
 * medewerker mag zien: alleen items uit verleden weken of gepubliceerde weken.
 * Managers/eigenaren roepen dit niet aan, die zien alles.
 */
export async function filterVisibleForEmployee<T extends { date: Date }>(
  companyId: string,
  items: T[]
): Promise<T[]> {
  if (items.length === 0) return items;

  const upcomingWeeks = new Map<string, Date>();
  for (const item of items) {
    const start = weekStartOf(item.date);
    if (!isPastWeek(start)) upcomingWeeks.set(weekKey(start), start);
  }

  let publishedKeys = new Set<string>();
  if (upcomingWeeks.size > 0) {
    const rows = await prisma.rosterWeek.findMany({
      where: {
        companyId,
        published: true,
        weekStart: { in: Array.from(upcomingWeeks.values()) },
      },
      select: { weekStart: true },
    });
    publishedKeys = new Set(rows.map((r) => weekKey(r.weekStart)));
  }

  return items.filter((item) => {
    const start = weekStartOf(item.date);
    return isPastWeek(start) || publishedKeys.has(weekKey(start));
  });
}
