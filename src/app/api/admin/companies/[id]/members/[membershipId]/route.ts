import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; membershipId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json();
  const role = body?.role;
  if (!["OWNER", "MANAGER", "EMPLOYEE"].includes(role)) {
    return NextResponse.json({ error: "Ongeldige rol" }, { status: 400 });
  }

  const membership = await prisma.membership.update({
    where: { id: params.membershipId },
    data: { role },
  });

  return NextResponse.json({ membership });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; membershipId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  await prisma.membership.delete({ where: { id: params.membershipId } });
  return NextResponse.json({ ok: true });
}
