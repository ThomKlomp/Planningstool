import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json();
  const autoOpenWeeks = Number(body?.autoOpenWeeks);
  if (!Number.isInteger(autoOpenWeeks) || autoOpenWeeks < 0 || autoOpenWeeks > 12) {
    return NextResponse.json({ error: "Ongeldige waarde (0-12)" }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id: membership.companyId },
    data: { autoOpenWeeks },
  });

  return NextResponse.json({ company });
}
