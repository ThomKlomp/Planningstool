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
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const timeEntry = await prisma.timeEntry.findUnique({ where: { id: params.id } });
  if (!timeEntry || timeEntry.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const isOwnEntry = timeEntry.membershipId === membership.membershipId;
  const body = await req.json();

  // Manager keurt goed/af, of stelt een vraag met een verplichte opmerking.
  if (canManage && body.status) {
    const status = body.status;
    if (!["APPROVED", "REJECTED", "QUERIED"].includes(status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }
    if (status === "QUERIED" && !body.comment?.trim()) {
      return NextResponse.json(
        { error: "Geef aan wat je wilt weten" },
        { status: 400 }
      );
    }

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        status,
        managerComment: status === "QUERIED" ? body.comment.trim() : timeEntry.managerComment,
        reviewedById: membership.membershipId,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ timeEntry: updated });
  }

  // Medewerker past een eigen, nog niet afgeronde urenregel aan (concept,
  // in behandeling, of met een vraag erbij) en dient 'm (opnieuw) in.
  const editableStatuses = ["DRAFT", "SUBMITTED", "QUERIED"];
  if (isOwnEntry && editableStatuses.includes(timeEntry.status)) {
    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { autoApproveHours: true },
    });
    const { date, startTime, endTime, breakMinutes, note } = body;
    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        breakMinutes: breakMinutes !== undefined ? Number(breakMinutes) : undefined,
        note: note ?? undefined,
        status: company?.autoApproveHours ? "APPROVED" : "SUBMITTED",
        reviewedAt: company?.autoApproveHours ? new Date() : timeEntry.reviewedAt,
      },
    });
    return NextResponse.json({ timeEntry: updated });
  }

  return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
}
