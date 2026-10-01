import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasRoomForMember, maxMembersResponse } from "@/lib/billing";
import { resolveInviteDepartmentId } from "@/lib/resolve-department";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const invite = await prisma.invite.findUnique({ where: { token: params.token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Uitnodiging is niet meer geldig" }, { status: 410 });
  }
  if (session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json({ error: "Verkeerd account" }, { status: 403 });
  }

  if (!(await hasRoomForMember(invite.companyId))) {
    return NextResponse.json(maxMembersResponse(), { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();

  const resolved = await resolveInviteDepartmentId(invite, body?.departmentId);
  if (resolved.error) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }
  const departmentId: string | null = resolved.departmentId;

  await prisma.$transaction(async (tx) => {
    if (firstName || lastName) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { name: [firstName, lastName].filter(Boolean).join(" ") },
      });
    }
    const created = await tx.membership.create({
      data: {
        userId: session.user.id,
        companyId: invite.companyId,
        role: invite.role,
        departmentId,
      },
    });
    // Extra teams die de manager bij het uitnodigen had aangegeven (niet
    // dubbel met het gekozen hoofdteam).
    const extraIds = invite.extraDepartmentIds.filter((id) => id !== departmentId);
    if (extraIds.length > 0) {
      await tx.membershipDepartment.createMany({
        data: extraIds.map((extraId) => ({ membershipId: created.id, departmentId: extraId })),
        skipDuplicates: true,
      });
    }
    await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
