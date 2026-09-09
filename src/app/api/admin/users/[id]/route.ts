import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json();
  const isPlatformAdmin = Boolean(body?.isPlatformAdmin);

  if (isPlatformAdmin) {
    await prisma.platformAdmin.upsert({
      where: { userId: params.id },
      update: {},
      create: { userId: params.id },
    });
  } else {
    // Voorkom dat de laatste platform-admin zichzelf buitensluit.
    if (session.user.id === params.id) {
      const adminCount = await prisma.platformAdmin.count();
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Je kunt jezelf niet verwijderen als laatste platform-admin" },
          { status: 400 }
        );
      }
    }
    await prisma.platformAdmin.deleteMany({ where: { userId: params.id } });
  }

  return NextResponse.json({ ok: true });
}
