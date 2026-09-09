/** Geeft de 7 datums (ma t/m zo) van de week waarin `date` valt. */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay(); // 0 = zondag
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

/** ISO-8601 weeknummer (1-53) voor een datum. */
export function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Datum -> "YYYY-MM-DD", te gebruiken als URL query param. */
export function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Bepaalt de weekdatums op basis van een optionele ?week=YYYY-MM-DD query
 * param. Zonder (geldige) param wordt de huidige week gebruikt.
 */
export function resolveWeek(weekParam?: string): Date[] {
  if (weekParam) {
    const parsed = new Date(`${weekParam}T00:00:00`);
    if (!isNaN(parsed.getTime())) {
      return getWeekDates(parsed);
    }
  }
  return getWeekDates(new Date());
}

/**
 * Bepaalt of een week standaard open staat wanneer er geen expliciete
 * WeekStatus is ingesteld door een manager. Standaard is een week DICHT,
 * behalve als hij binnen het "automatisch open"-venster valt (bv. de
 * huidige week + de komende N weken, ingesteld per bedrijf).
 */
export function isWeekOpenByDefault(weekStart: Date, autoOpenWeeks: number): boolean {
  const currentWeekStart = getWeekDates(new Date())[0];
  const diffWeeks = Math.round(
    (weekStart.getTime() - currentWeekStart.getTime()) / (7 * 86400000)
  );
  return diffWeeks >= 0 && diffWeeks < autoOpenWeeks;
}
