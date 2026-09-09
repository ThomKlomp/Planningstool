import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  const invite = await prisma.invite.findUnique({ where: { token: params.token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Uitnodiging is niet meer geldig" }, { status: 410 });
  }

  const body = await req.json().catch(() => ({}));
  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();
  const password = body?.password ?? "";

  if (!firstName || !lastName || !password) {
    return NextResponse.json({ error: "Alle velden zijn verplicht" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Wachtwoord moet minimaal 8 tekens zijn" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    return NextResponse.json(
      {
        error:
          "Er bestaat al een account met dit e-mailadres. Log in (met Google of e-mail) en open de uitnodigingslink opnieuw.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: invite.email,
        name: `${firstName} ${lastName}`,
        passwordHash,
      },
    });
    await tx.membership.create({
      data: { userId: user.id, companyId: invite.companyId, role: invite.role },
    });
    await tx.invite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return NextResponse.json({ ok: true });
}
