import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const shifts = await prisma.shift.findMany({
    where: {
      companyId: membership.companyId,
      date: { gte: new Date(start), lte: new Date(end) },
    },
    include: { membership: { include: { user: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ shifts });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json();
  const { date, startTime, endTime, role, membershipId } = body ?? {};
  if (!date || !startTime || !endTime) {
    return NextResponse.json(
      { error: "date, startTime en endTime zijn verplicht" },
      { status: 400 }
    );
  }

  const shift = await prisma.shift.create({
    data: {
      companyId: membership.companyId,
      date: new Date(date),
      startTime,
      endTime,
      role: role || null,
      membershipId: membershipId || null,
    },
  });

  // Alvast een conceptregel bij Uren zetten zodat de medewerker 'm alleen
  // nog hoeft te bevestigen/aan te passen, niet vanaf nul hoeft in te vullen.
  // Eindtijd bewust leeg: voorkomt dat iemand per ongeluk doorklikt met de
  // geplande eindtijd terwijl er misschien eerder/later gewerkt is.
  if (membershipId) {
    await prisma.timeEntry.create({
      data: {
        companyId: membership.companyId,
        membershipId,
        shiftId: shift.id,
        date: new Date(date),
        startTime,
        endTime: "",
        status: "DRAFT",
      },
    });
  }

  return NextResponse.json({ shift });
}
