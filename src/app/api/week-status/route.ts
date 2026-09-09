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
  const weekStart = searchParams.get("weekStart");
  if (!weekStart) {
    return NextResponse.json({ error: "weekStart is verplicht" }, { status: 400 });
  }

  const [weekStatus, company] = await Promise.all([
    prisma.weekStatus.findUnique({
      where: {
        companyId_weekStart: {
          companyId: membership.companyId,
          weekStart: new Date(weekStart),
        },
      },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { autoOpenWeeks: true },
    }),
  ]);

  const isOpen =
    weekStatus?.isOpen ?? isWeekOpenByDefault(new Date(weekStart), company?.autoOpenWeeks ?? 2);

  return NextResponse.json({ isOpen });
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
  const { weekStart, isOpen } = body ?? {};
  if (!weekStart || typeof isOpen !== "boolean") {
    return NextResponse.json(
      { error: "weekStart en isOpen zijn verplicht" },
      { status: 400 }
    );
  }

  const weekStatus = await prisma.weekStatus.upsert({
    where: {
      companyId_weekStart: {
        companyId: membership.companyId,
        weekStart: new Date(weekStart),
      },
    },
    update: { isOpen },
    create: {
      companyId: membership.companyId,
      weekStart: new Date(weekStart),
      isOpen,
    },
  });

  return NextResponse.json({ weekStatus });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  if (!weekStart) {
    return NextResponse.json({ error: "weekStart is verplicht" }, { status: 400 });
  }

  await prisma.weekStatus
    .delete({
      where: {
        companyId_weekStart: { companyId: membership.companyId, weekStart: new Date(weekStart) },
      },
    })
    .catch(() => null); // was toch al geen override ingesteld

  return NextResponse.json({ ok: true });
}
