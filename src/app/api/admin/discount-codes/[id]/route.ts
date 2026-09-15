import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requirePlatformAdmin();
  if (!session) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.active === undefined) {
    return NextResponse.json({ error: "Niets om aan te passen" }, { status: 400 });
  }

  const discountCode = await prisma.discountCode.update({
    where: { id: params.id },
    data: { active: Boolean(body.active) },
  });

  return NextResponse.json({ discountCode });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requirePlatformAdmin();
  if (!session) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  // Code zelf verwijderen mag alleen als hij nog nooit is ingewisseld,
  // anders verliest een zaak met een lopende korting de verwijzing.
  // "Uitzetten" (PATCH active: false) is de veiligere route voor codes
  // die al gebruikt zijn.
  const discountCode = await prisma.discountCode.findUnique({
    where: { id: params.id },
    select: { timesRedeemed: true },
  });
  if (discountCode && discountCode.timesRedeemed > 0) {
    return NextResponse.json(
      { error: "Deze code is al gebruikt, zet 'm uit in plaats van verwijderen" },
      { status: 409 }
    );
  }

  await prisma.discountCode.delete({ where: { id: params.id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
