import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotDaypart } from "@/lib/availability-slots";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: params.id } });
  if (!slot || slot.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  // Ingevulde beschikbaarheid voor dit tijdvak gaat mee weg.
  await prisma.availability.deleteMany({
    where: {
      date: slot.date,
      daypart: slotDaypart(slot.id),
      membership: { companyId: membership.companyId },
    },
  });
  await prisma.availabilitySlot.delete({ where: { id: slot.id } });
  return NextResponse.json({ ok: true });
}
