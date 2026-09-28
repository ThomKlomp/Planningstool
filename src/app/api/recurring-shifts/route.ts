import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { resolveShiftDepartment } from "@/lib/teams";
import {
  generateRecurringShifts,
  midnightUTC,
  addDays,
  dayName,
  RECURRING_HORIZON_DAYS,
} from "@/lib/recurring-shifts";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Nieuwe terugkerende dienst voor een medewerker. Alleen eigenaar/manager.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const weekday = Number(body?.weekday);
  const startTime = String(body?.startTime ?? "");
  const endTime = String(body?.endTime ?? "");
  const role = String(body?.role ?? "").trim() || null;

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return NextResponse.json({ error: "Kies een dag van de week" }, { status: 400 });
  }
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return NextResponse.json({ error: "Vul een geldige begin- en eindtijd in" }, { status: 400 });
  }

  const target = await prisma.membership.findUnique({ where: { id: String(body?.membershipId ?? "") } });
  if (!target || target.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Medewerker niet gevonden" }, { status: 404 });
  }

  const team = await resolveShiftDepartment(membership.companyId, target.id, body?.departmentId);
  if (!team.ok) {
    return NextResponse.json({ error: team.error }, { status: 400 });
  }

  const startDate = midnightUTC(new Date());
  const pattern = await prisma.recurringShift.create({
    data: {
      companyId: membership.companyId,
      membershipId: target.id,
      departmentId: team.departmentId,
      weekday,
      startTime,
      endTime,
      role,
      startDate,
      generatedUntil: addDays(startDate, -1), // nog niets aangemaakt
    },
  });

  const created = await generateRecurringShifts(pattern.id);

  await notify(membership.companyId, [target.id], {
    title: "Je hebt een vaste dienst gekregen",
    body: `Elke ${dayName(weekday)}, ${startTime}–${endTime}. Je ziet de diensten in het rooster zodra dat online staat.`,
    link: "/dashboard/rooster",
  }).catch(() => null);

  return NextResponse.json({ pattern, created, weeksAhead: RECURRING_HORIZON_DAYS / 7 });
}
