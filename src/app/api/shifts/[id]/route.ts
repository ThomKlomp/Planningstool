import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const existing = await prisma.shift.findUnique({
    where: { id: params.id },
    include: { timeEntry: true },
  });
  if (!existing || existing.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const body = await req.json();
  const shift = await prisma.shift.update({
    where: { id: params.id },
    data: {
      membershipId: body.membershipId ?? null,
      startTime: body.startTime,
      endTime: body.endTime,
      role: body.role,
    },
  });

  // Conceptregel bij Uren meebeheren, maar alleen zolang de medewerker 'm
  // nog niet zelf heeft bevestigd/aangepast (status nog DRAFT).
  if (existing.timeEntry && existing.timeEntry.status === "DRAFT") {
    if (!shift.membershipId) {
      // Niemand meer toegewezen: concept verwijderen.
      await prisma.timeEntry.delete({ where: { id: existing.timeEntry.id } });
    } else if (shift.membershipId !== existing.timeEntry.membershipId) {
      // Andere medewerker toegewezen: concept verhuist mee.
      await prisma.timeEntry.update({
        where: { id: existing.timeEntry.id },
        data: {
          membershipId: shift.membershipId,
          startTime: shift.startTime,
          endTime: shift.endTime,
        },
      });
    } else {
      // Zelfde medewerker, tijden kunnen gewijzigd zijn.
      await prisma.timeEntry.update({
        where: { id: existing.timeEntry.id },
        data: { startTime: shift.startTime, endTime: shift.endTime },
      });
    }
  } else if (!existing.timeEntry && shift.membershipId) {
    // Shift kreeg net een medewerker toegewezen: concept aanmaken.
    await prisma.timeEntry.create({
      data: {
        companyId: membership.companyId,
        membershipId: shift.membershipId,
        shiftId: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: "DRAFT",
      },
    });
  }

  return NextResponse.json({ shift });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const existing = await prisma.shift.findUnique({
    where: { id: params.id },
    include: { timeEntry: true },
  });

  // Gekoppelde conceptregel opruimen, maar alleen als de medewerker 'm nog
  // niet zelf had bevestigd of aangepast.
  if (existing?.timeEntry && existing.timeEntry.status === "DRAFT") {
    await prisma.timeEntry.delete({ where: { id: existing.timeEntry.id } });
  }

  await prisma.shift.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
