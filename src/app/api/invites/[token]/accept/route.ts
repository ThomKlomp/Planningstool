import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const body = await req.json().catch(() => ({}));
  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();

  const existing = await prisma.membership.findUnique({
    where: {
      userId_companyId: { userId: session.user.id, companyId: invite.companyId },
    },
  });

  const operations = [];

  if (firstName || lastName) {
    operations.push(
      prisma.user.update({
        where: { id: session.user.id },
        data: { name: [firstName, lastName].filter(Boolean).join(" ") },
      })
    );
  }

  if (!existing) {
    operations.push(
      prisma.membership.create({
        data: {
          userId: session.user.id,
          companyId: invite.companyId,
          role: invite.role,
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      })
    );
  }

  if (operations.length > 0) {
    await prisma.$transaction(operations);
  }

  return NextResponse.json({ ok: true });
}
