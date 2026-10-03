import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWeekOpenByDefault } from "@/lib/week";
import { isDateClosed } from "@/lib/closed-days";
import { isCustomDaypart, parseCustomDaypart } from "@/lib/availability-custom";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start en end zijn verplicht" }, { status: 400 });
  }

  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";

  const availabilities = await prisma.availability.findMany({
    where: {
      date: { gte: new Date(start), lte: new Date(end) },
      membership: canManage
        ? { companyId: membership.companyId }
        : { id: membership.membershipId },
    },
    include: canManage ? { membership: { include: { user: true } } } : undefined,
  });

  return NextResponse.json({ availabilities });
}

/**
 * Mag deze medewerker voor deze datum nog beschikbaarheid aanpassen? Managers
 * altijd; medewerkers niet op een gesloten dag of in een gesloten week.
 * Geeft een foutmelding terug, of null als het mag.
 */
async function lockedReason(
  membership: { role: string; companyId: string },
  date: string
): Promise<string | null> {
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  if (canManage) return null;

  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() + (day === 0 ? -6 : 1 - day));
  weekStart.setHours(0, 0, 0, 0);

  const [weekStatus, company, closedDay] = await Promise.all([
    prisma.weekStatus.findUnique({
      where: {
        companyId_weekStart: { companyId: membership.companyId, weekStart },
      },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { autoOpenWeeks: true, closedWeekdays: true },
    }),
    prisma.closedDay.findUnique({
      where: {
        companyId_date: { companyId: membership.companyId, date: new Date(date) },
      },
    }),
  ]);

  if (closedDay || isDateClosed(new Date(date), company?.closedWeekdays ?? [], [])) {
    return "De zaak is dicht op deze dag";
  }

  const isOpen =
    weekStatus?.isOpen ?? isWeekOpenByDefault(weekStart, company?.autoOpenWeeks ?? 2);
  if (!isOpen) {
    return "Deze week is gesloten voor het doorgeven van beschikbaarheid";
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const body = await req.json();
  const { date, status, note } = body ?? {};
  const daypart = body?.daypart ?? "";
  if (!date || !status) {
    return NextResponse.json({ error: "date en status zijn verplicht" }, { status: 400 });
  }

  const locked = await lockedReason(membership, date);
  if (locked) {
    return NextResponse.json({ error: locked }, { status: 403 });
  }

  // Een losse tijd moet een geldig tijdvak zijn; andere waarden zijn het id van
  // een shift-sjabloon (of leeg voor hele dag) en blijven zoals ze waren.
  if (typeof daypart === "string" && daypart.startsWith("custom:") && !isCustomDaypart(daypart)) {
    return NextResponse.json({ error: "Ongeldig tijdvak" }, { status: 400 });
  }
  if (isCustomDaypart(daypart)) {
    const range = parseCustomDaypart(daypart)!;
    if (range.startTime === range.endTime) {
      return NextResponse.json({ error: "Begin- en eindtijd zijn gelijk" }, { status: 400 });
    }
  }

  const availability = await prisma.availability.upsert({
    where: {
      membershipId_date_daypart: {
        membershipId: membership.membershipId,
        date: new Date(date),
        daypart,
      },
    },
    update: { status, note: note ?? null },
    create: {
      membershipId: membership.membershipId,
      date: new Date(date),
      daypart,
      status,
      note: note || null,
    },
  });

  return NextResponse.json({ availability });
}

// Verwijdert een losse tijd. Alleen losse tijden zijn te verwijderen: de vaste
// shift-tijden blijven altijd staan en krijg je door een andere status te kiezen.
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { date, daypart } = body ?? {};
  if (!date || typeof daypart !== "string" || !isCustomDaypart(daypart)) {
    return NextResponse.json({ error: "Alleen losse tijden kun je verwijderen" }, { status: 400 });
  }

  const locked = await lockedReason(membership, date);
  if (locked) {
    return NextResponse.json({ error: locked }, { status: 403 });
  }

  await prisma.availability.deleteMany({
    where: { membershipId: membership.membershipId, date: new Date(date), daypart },
  });
  return NextResponse.json({ ok: true });
}
