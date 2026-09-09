import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isWeekOpenByDefault } from "@/lib/week";

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

  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  if (!canManage) {
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
        select: { autoOpenWeeks: true },
      }),
      prisma.closedDay.findUnique({
        where: {
          companyId_date: { companyId: membership.companyId, date: new Date(date) },
        },
      }),
    ]);

    if (closedDay) {
      return NextResponse.json(
        { error: "De zaak is dicht op deze dag" },
        { status: 403 }
      );
    }

    const isOpen =
      weekStatus?.isOpen ?? isWeekOpenByDefault(weekStart, company?.autoOpenWeeks ?? 2);
    if (!isOpen) {
      return NextResponse.json(
        { error: "Deze week is gesloten voor het doorgeven van beschikbaarheid" },
        { status: 403 }
      );
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
