import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { membershipId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const target = await prisma.membership.findUnique({ where: { id: params.membershipId } });
  if (!target || target.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const body = await req.json();
  const departmentId = body?.departmentId || null;

  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department || department.companyId !== membership.companyId) {
      return NextResponse.json({ error: "Team niet gevonden" }, { status: 404 });
    }
  }

  const updated = await prisma.membership.update({
    where: { id: params.membershipId },
    data: { departmentId },
  });

  return NextResponse.json({ membership: updated });
}
