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

  const shiftTemplates = await prisma.shiftTemplate.findMany({
    where: { companyId: membership.companyId },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ shiftTemplates });
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
  const name = (body?.name ?? "").trim();
  const startTime = body?.startTime;
  const endTime = body?.endTime;
  const weekdays: number[] = Array.isArray(body?.weekdays) ? body.weekdays : [];

  if (!name || !startTime || !endTime || weekdays.length === 0) {
    return NextResponse.json(
      { error: "Naam, tijden en minstens één dag zijn verplicht" },
      { status: 400 }
    );
  }

  const shiftTemplate = await prisma.shiftTemplate.create({
    data: {
      companyId: membership.companyId,
      name,
      startTime,
      endTime,
      weekdays,
    },
  });

  return NextResponse.json({ shiftTemplate });
}
