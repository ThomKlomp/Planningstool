import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workedHours } from "@/lib/worked-hours";
import { getWeekDates, getISOWeekNumber, toDateParam } from "@/lib/week";

// Totaal aantal gewerkte uren van de ingelogde persoon in een periode
// (?from=YYYY-MM-DD&to=YYYY-MM-DD, inclusief). Alleen de eigen uren.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const params = new URL(req.url).searchParams;
  const from = new Date(`${params.get("from") ?? ""}T00:00:00Z`);
  const to = new Date(`${params.get("to") ?? ""}T00:00:00Z`);
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    return NextResponse.json({ error: "Ongeldige periode" }, { status: 400 });
  }

  // Concept (nog niet ingediend) en afgekeurd tellen niet mee als gewerkte uren.
  const entries = await prisma.timeEntry.findMany({
    where: {
      membershipId: membership.membershipId,
      date: { gte: from, lte: to },
      status: { in: ["APPROVED", "SUBMITTED", "QUERIED"] },
    },
    orderBy: { date: "asc" },
  });

  let approved = 0;
  let pending = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  const perWeek = new Map<string, { weekNumber: number; approved: number; pending: number }>();

  for (const e of entries) {
    const hours = workedHours(e);
    const weekStart = getWeekDates(e.date)[0];
    const key = toDateParam(weekStart);
    const bucket = perWeek.get(key) ?? {
      weekNumber: getISOWeekNumber(weekStart),
      approved: 0,
      pending: 0,
    };
    if (e.status === "APPROVED") {
      approved += hours;
      approvedCount += 1;
      bucket.approved += hours;
    } else {
      pending += hours;
      pendingCount += 1;
      bucket.pending += hours;
    }
    perWeek.set(key, bucket);
  }

  return NextResponse.json({
    approved,
    pending,
    approvedCount,
    pendingCount,
    perWeek: Array.from(perWeek.entries()).map(([weekStart, v]) => ({ weekStart, ...v })),
  });
}
