import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const target = await prisma.membership.findUnique({ where: { id: params.id } });
  if (!target || target.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (target.id === membership.membershipId) {
    return NextResponse.json(
      { error: "Je kunt jezelf niet verwijderen" },
      { status: 400 }
    );
  }
  if (target.role === "OWNER") {
    return NextResponse.json(
      { error: "De eigenaar kan niet verwijderd worden" },
      { status: 400 }
    );
  }
  // Een manager mag alleen medewerkers verwijderen, geen andere managers.
  if (membership.role === "MANAGER" && target.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  // Shifts van deze persoon worden door de database automatisch losgekoppeld
  // (membershipId -> null, ze worden dus openstaande shifts). Beschikbaarheid
  // en urenregistraties van deze persoon worden wel mee verwijderd.
  await prisma.membership.delete({ where: { id: target.id } });

  return NextResponse.json({ ok: true });
}
