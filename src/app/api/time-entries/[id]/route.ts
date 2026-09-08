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

  const body = await req.json();
  const status = body?.status === "REJECTED" ? "REJECTED" : "APPROVED";

  const timeEntry = await prisma.timeEntry.update({
    where: { id: params.id },
    data: {
      status,
      reviewedById: membership.membershipId,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json({ timeEntry });
}
