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

  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: params.id },
    include: { shift: true },
  });
  if (!swapRequest || swapRequest.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (swapRequest.status !== "OPEN") {
    return NextResponse.json({ error: "Deze dienst is niet meer beschikbaar" }, { status: 409 });
  }
  if (swapRequest.offeredById === membership.membershipId) {
    return NextResponse.json(
      { error: "Je kunt je eigen aangeboden dienst niet overnemen" },
      { status: 400 }
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: membership.companyId },
    select: { autoApproveShiftSwaps: true },
  });

  if (company?.autoApproveShiftSwaps) {
    const updated = await reassignShift(swapRequest, membership.membershipId);
    await notify(membership.companyId, [swapRequest.offeredById], {
      title: "Je aangeboden dienst is overgenomen",
      body: `${swapRequest.shift.startTime}–${swapRequest.shift.endTime} op ${swapRequest.shift.date.toLocaleDateString(
        "nl-NL",
        { weekday: "long", day: "numeric", month: "long" }
      )}.`,
      link: "/dashboard/roster",
    });
    return NextResponse.json({ swapRequest: updated, autoApproved: true });
  }

  const updated = await prisma.shiftSwapRequest.update({
    where: { id: swapRequest.id },
    data: {
      status: "PENDING_APPROVAL",
      claimedById: membership.membershipId,
      claimedAt: new Date(),
    },
  });

  const managers = await prisma.membership.findMany({
    where: { companyId: membership.companyId, role: { in: ["OWNER", "MANAGER"] } },
    select: { id: true },
  });

  await notify(
    membership.companyId,
    managers.map((m) => m.id),
    {
      title: "Overname/ruil wacht op jouw goedkeuring",
      body: `${swapRequest.shift.startTime}–${swapRequest.shift.endTime} op ${swapRequest.shift.date.toLocaleDateString(
        "nl-NL",
        { weekday: "long", day: "numeric", month: "long" }
      )}.`,
      link: "/dashboard/roster",
    }
  );

  return NextResponse.json({ swapRequest: updated, autoApproved: false });
}

/**
 * Wijst de shift toe aan de nieuwe medewerker en verhuist een eventuele
 * concept-urenregel mee (zelfde logica als bij handmatig herindelen).
 */
async function reassignShift(
  swapRequest: { id: string; shiftId: string },
  newMembershipId: string
) {
  const shift = await prisma.shift.update({
    where: { id: swapRequest.shiftId },
    data: { membershipId: newMembershipId },
  });

  const timeEntry = await prisma.timeEntry.findUnique({ where: { shiftId: shift.id } });
  if (timeEntry && timeEntry.status === "DRAFT") {
    await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: { membershipId: newMembershipId },
    });
  } else if (!timeEntry) {
    await prisma.timeEntry.create({
      data: {
        companyId: shift.companyId,
        membershipId: newMembershipId,
        shiftId: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: "",
        status: "DRAFT",
      },
    });
  }

  return prisma.shiftSwapRequest.update({
    where: { id: swapRequest.id },
    data: {
      status: "APPROVED",
      claimedById: newMembershipId,
      claimedAt: new Date(),
      reviewedAt: new Date(),
    },
  });
}
