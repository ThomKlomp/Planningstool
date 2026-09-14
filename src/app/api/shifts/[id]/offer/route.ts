import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id: params.id },
    include: { swapRequest: true },
  });
  if (!shift || shift.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (shift.membershipId !== membership.membershipId) {
    return NextResponse.json({ error: "Dit is niet jouw dienst" }, { status: 403 });
  }
  if (shift.swapRequest) {
    return NextResponse.json({ error: "Deze dienst is al aangeboden" }, { status: 409 });
  }

  const swapRequest = await prisma.shiftSwapRequest.create({
    data: {
      companyId: membership.companyId,
      shiftId: shift.id,
      offeredById: membership.membershipId,
    },
  });

  // Meld het bij iedereen die die dag beschikbaar staat (niet UNAVAILABLE),
  // behalve de aanbieder zelf.
  const availableThatDay = await prisma.availability.findMany({
    where: {
      date: shift.date,
      status: { not: "UNAVAILABLE" },
      membership: { companyId: membership.companyId },
      membershipId: { not: membership.membershipId },
    },
    select: { membershipId: true },
  });
  const recipientIds = [...new Set(availableThatDay.map((a) => a.membershipId))];

  await notify(membership.companyId, recipientIds, {
    title: `Dienst aangeboden op ${shift.date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}`,
    body: `${shift.startTime}–${shift.endTime}${shift.role ? ` · ${shift.role}` : ""} — beschikbaar voor overname of ruil.`,
    link: "/dashboard/roster",
  });

  return NextResponse.json({ swapRequest });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id: params.id },
    include: { swapRequest: true },
  });
  if (!shift?.swapRequest || shift.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (shift.swapRequest.offeredById !== membership.membershipId) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }
  if (shift.swapRequest.status !== "OPEN") {
    return NextResponse.json(
      { error: "Dit aanbod is al geclaimd, intrekken kan niet meer" },
      { status: 409 }
    );
  }

  await prisma.shiftSwapRequest.delete({ where: { id: shift.swapRequest.id } });
  return NextResponse.json({ ok: true });
}
