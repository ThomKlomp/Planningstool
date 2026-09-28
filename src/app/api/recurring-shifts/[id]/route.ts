import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { midnightUTC, dayName } from "@/lib/recurring-shifts";

// Stopt een terugkerende dienst. De nog niet gewerkte diensten die ongewijzigd
// uit dit patroon komen worden weggehaald; een dienst die je zelf hebt
// aangepast (andere tijd, andere medewerker) blijft staan als gewone dienst.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const pattern = await prisma.recurringShift.findUnique({ where: { id: params.id } });
  if (!pattern || pattern.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const untouched = await prisma.shift.findMany({
    where: {
      recurringShiftId: pattern.id,
      date: { gte: midnightUTC(new Date()) },
      membershipId: pattern.membershipId,
      startTime: pattern.startTime,
      endTime: pattern.endTime,
      role: pattern.role,
    },
    select: { id: true },
  });
  const ids = untouched.map((s) => s.id);

  await prisma.$transaction([
    prisma.timeEntry.deleteMany({ where: { shiftId: { in: ids }, status: "DRAFT" } }),
    prisma.shift.deleteMany({ where: { id: { in: ids } } }),
    // De overige diensten raken automatisch losgekoppeld (onDelete: SetNull).
    prisma.recurringShift.delete({ where: { id: pattern.id } }),
  ]);

  await notify(membership.companyId, [pattern.membershipId], {
    title: "Je vaste dienst is gestopt",
    body: `De terugkerende dienst op ${dayName(pattern.weekday)} (${pattern.startTime}–${pattern.endTime}) is stopgezet.`,
    link: "/dashboard/rooster",
  }).catch(() => null);

  return NextResponse.json({ ok: true, removedShifts: ids.length });
}
