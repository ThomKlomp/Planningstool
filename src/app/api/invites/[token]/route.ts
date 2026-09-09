import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  // Alleen een uitnodiging van de eigen zaak mag verwijderd worden.
  const invite = await prisma.invite.findUnique({ where: { token: params.token } });
  if (!invite || invite.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  await prisma.invite.delete({ where: { id: invite.id } });
  return NextResponse.json({ ok: true });
}
