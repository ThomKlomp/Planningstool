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
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: params.id },
    include: { shift: true },
  });
  if (!swapRequest || swapRequest.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (swapRequest.status !== "PENDING_APPROVAL" || !swapRequest.claimedById) {
    return NextResponse.json({ error: "Niets om goed te keuren" }, { status: 409 });
  }

  const shift = await prisma.shift.update({
    where: { id: swapRequest.shiftId },
    data: { membershipId: swapRequest.claimedById },
  });

  const timeEntry = await prisma.timeEntry.findUnique({ where: { shiftId: shift.id } });
  if (timeEntry && timeEntry.status === "DRAFT") {
    await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: { membershipId: swapRequest.claimedById },
    });
  } else if (!timeEntry) {
    await prisma.timeEntry.create({
      data: {
        companyId: shift.companyId,
        membershipId: swapRequest.claimedById,
        shiftId: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: "",
        status: "DRAFT",
      },
    });
  }

  const updated = await prisma.shiftSwapRequest.update({
    where: { id: swapRequest.id },
    data: {
      status: "APPROVED",
      reviewedById: membership.membershipId,
      reviewedAt: new Date(),
    },
  });

  await notify(
    membership.companyId,
    [swapRequest.offeredById, swapRequest.claimedById],
    {
      title: "Overname/ruil goedgekeurd",
      body: `${swapRequest.shift.startTime}–${swapRequest.shift.endTime} op ${swapRequest.shift.date.toLocaleDateString(
        "nl-NL",
        { weekday: "long", day: "numeric", month: "long" }
      )}.`,
      link: "/dashboard/roster",
    }
  );

  return NextResponse.json({ swapRequest: updated });
}
