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
  const { date, status } = body ?? {};
  if (!date || !status) {
    return NextResponse.json({ error: "date en status zijn verplicht" }, { status: 400 });
  }

  const availability = await prisma.availability.upsert({
    where: {
      membershipId_date_daypart: {
        membershipId: membership.membershipId,
        date: new Date(date),
        daypart: "", // hele dag, geen specifiek dagdeel
      },
    },
    update: { status },
    create: {
      membershipId: membership.membershipId,
      date: new Date(date),
      status,
    },
  });

  return NextResponse.json({ availability });
}
