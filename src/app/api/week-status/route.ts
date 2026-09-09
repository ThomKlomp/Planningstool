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
  const weekStart = searchParams.get("weekStart");
  if (!weekStart) {
    return NextResponse.json({ error: "weekStart is verplicht" }, { status: 400 });
  }

  const weekStatus = await prisma.weekStatus.findUnique({
    where: {
      companyId_weekStart: {
        companyId: membership.companyId,
        weekStart: new Date(weekStart),
      },
    },
  });

  // Geen record = standaard open.
  return NextResponse.json({ isOpen: weekStatus?.isOpen ?? true });
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
