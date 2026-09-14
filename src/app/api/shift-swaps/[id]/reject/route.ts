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
  if (swapRequest.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Niets om af te keuren" }, { status: 409 });
  }

  const updated = await prisma.shiftSwapRequest.update({
    where: { id: swapRequest.id },
    data: {
      status: "REJECTED",
      reviewedById: membership.membershipId,
      reviewedAt: new Date(),
    },
  });

  if (swapRequest.claimedById) {
    await notify(membership.companyId, [swapRequest.claimedById], {
      title: "Overname/ruil afgekeurd",
      body: `${swapRequest.shift.startTime}–${swapRequest.shift.endTime} op ${swapRequest.shift.date.toLocaleDateString(
        "nl-NL",
        { weekday: "long", day: "numeric", month: "long" }
      )} is niet goedgekeurd door je manager.`,
      link: "/dashboard/roster",
    });
  }

  return NextResponse.json({ swapRequest: updated });
}
