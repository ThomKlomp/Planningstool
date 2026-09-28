import { prisma } from "@/lib/prisma";
import { isDateClosed } from "@/lib/closed-days";

// Terugkerende diensten ("altijd op zaterdag van 12 tot 18"). Het patroon
// (RecurringShift) maakt gewone diensten aan voor de komende weken. Die zijn
// daarna los aan te passen of te verwijderen. Een verwijderde dienst komt
// niet terug: per patroon houden we bij t/m welke datum alles al is
// aangemaakt (generatedUntil), en alleen daarna komen er nieuwe bij.

/** Hoever vooruit de diensten worden aangemaakt. */
export const RECURRING_HORIZON_DAYS = 56; // 8 weken

import { dayName } from "@/lib/recurring-shifts-labels";
export { dayName };

export function midnightUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/**
 * Maakt de diensten van één patroon aan tot de horizon en zet generatedUntil
 * door. Slaat gesloten dagen over en dagen in het verleden. Idempotent.
 * Geeft het aantal nieuw aangemaakte diensten terug.
 */
export async function generateRecurringShifts(patternId: string): Promise<number> {
  const pattern = await prisma.recurringShift.findUnique({
    where: { id: patternId },
    include: { company: { select: { closedWeekdays: true } } },
  });
  if (!pattern) return 0;

  const today = midnightUTC(new Date());
  const horizon = addDays(today, RECURRING_HORIZON_DAYS);

  let from = addDays(pattern.generatedUntil, 1);
  if (from < today) from = today;
  if (from < pattern.startDate) from = pattern.startDate;
  if (from > horizon) return 0;

  const [closedDays, existing] = await Promise.all([
    prisma.closedDay.findMany({
      where: { companyId: pattern.companyId, date: { gte: from, lte: horizon } },
      select: { date: true },
    }),
    prisma.shift.findMany({
      where: { recurringShiftId: pattern.id, date: { gte: from, lte: horizon } },
      select: { date: true },
    }),
  ]);
  const closedStrings = closedDays.map((c) => c.date.toDateString());
  const existingStrings = new Set(existing.map((e) => e.date.toDateString()));

  let created = 0;
  for (let d = new Date(from); d <= horizon; d = addDays(d, 1)) {
    if (d.getUTCDay() !== pattern.weekday) continue;
    if (isDateClosed(d, pattern.company.closedWeekdays, closedStrings)) continue;
    if (existingStrings.has(d.toDateString())) continue;

    const date = new Date(d);
    const shift = await prisma.shift.create({
      data: {
        companyId: pattern.companyId,
        membershipId: pattern.membershipId,
        departmentId: pattern.departmentId,
        date,
        startTime: pattern.startTime,
        endTime: pattern.endTime,
        role: pattern.role,
        recurringShiftId: pattern.id,
      },
    });
    // Zelfde als bij een gewone dienst: alvast een concept-urenregel, met
    // bewust een lege eindtijd (zie api/shifts).
    await prisma.timeEntry.create({
      data: {
        companyId: pattern.companyId,
        membershipId: pattern.membershipId,
        shiftId: shift.id,
        date,
        startTime: pattern.startTime,
        endTime: "",
        status: "DRAFT",
      },
    });
    created += 1;
  }

  await prisma.recurringShift.update({
    where: { id: pattern.id },
    data: { generatedUntil: horizon },
  });
  return created;
}

/** Vult alle patronen aan tot de horizon. Bedoeld voor de dagelijkse cron. */
export async function topUpAllRecurringShifts(): Promise<{ patterns: number; created: number }> {
  const horizon = addDays(midnightUTC(new Date()), RECURRING_HORIZON_DAYS);
  const patterns = await prisma.recurringShift.findMany({
    where: { generatedUntil: { lt: horizon } },
    select: { id: true },
  });
  let created = 0;
  for (const p of patterns) {
    created += await generateRecurringShifts(p.id);
  }
  return { patterns: patterns.length, created };
}
