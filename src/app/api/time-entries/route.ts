import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDateClosed } from "@/lib/closed-days";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }
  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";

  const timeEntries = await prisma.timeEntry.findMany({
    where: canManage
      ? { companyId: membership.companyId }
      : { membershipId: membership.membershipId },
    include: { membership: { include: { user: true } } },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json({ timeEntries });
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
  const { date, startTime, endTime, breakMinutes, note } = body ?? {};
  if (!date || !startTime || !endTime) {
    return NextResponse.json(
      { error: "date, startTime en endTime zijn verplicht" },
      { status: 400 }
    );
  }

  const [closedDay, company] = await Promise.all([
    prisma.closedDay.findUnique({
      where: {
        companyId_date: { companyId: membership.companyId, date: new Date(date) },
      },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { closedWeekdays: true },
    }),
  ]);
  if (closedDay || isDateClosed(new Date(date), company?.closedWeekdays ?? [], [])) {
    return NextResponse.json(
      { error: "De zaak was dicht op deze dag, uren kunnen hier niet op ingediend worden" },
      { status: 403 }
    );
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      companyId: membership.companyId,
      membershipId: membership.membershipId,
      date: new Date(date),
      startTime,
      endTime,
      breakMinutes: breakMinutes ? Number(breakMinutes) : 0,
      note: note || null,
      status: "SUBMITTED",
    },
  });

  return NextResponse.json({ timeEntry });
}
