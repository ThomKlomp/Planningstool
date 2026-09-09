import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const closedDays = await prisma.closedDay.findMany({
    where: { companyId: membership.companyId },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ closedDays });
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
  const date = body?.date;
  const reason = (body?.reason ?? "").trim();
  if (!date) {
    return NextResponse.json({ error: "Datum is verplicht" }, { status: 400 });
  }

  const closedDay = await prisma.closedDay.upsert({
    where: {
      companyId_date: { companyId: membership.companyId, date: new Date(date) },
    },
    update: { reason: reason || null },
    create: {
      companyId: membership.companyId,
      date: new Date(date),
      reason: reason || null,
    },
  });

  return NextResponse.json({ closedDay });
}
