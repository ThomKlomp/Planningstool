import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/email-verification";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Account niet gevonden" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const data: { name?: string; email?: string; emailVerified?: null; passwordHash?: string } = {};
  let emailChangedTo: string | null = null;

  // ---------- Naam ----------
  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Naam mag niet leeg zijn" }, { status: 400 });
    }
    data.name = name;
  }

  // ---------- E-mailadres ----------
  if (body?.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Vul een geldig e-mailadres in" }, { status: 400 });
    }
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { error: "Dit e-mailadres is al in gebruik" },
          { status: 409 }
        );
      }
      data.email = email;
      data.emailVerified = null; // moet opnieuw bevestigd worden
      emailChangedTo = email;
    }
  }

  // ---------- Wachtwoord ----------
  if (body?.newPassword !== undefined) {
    const newPassword = String(body.newPassword);
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Nieuw wachtwoord moet minimaal 8 tekens zijn" },
        { status: 400 }
      );
    }
    // Alleen verplicht als er al een wachtwoord staat (bv. niet voor een
    // account dat tot nu toe alleen met Google inlogde).
    if (user.passwordHash) {
      const currentPassword = String(body?.currentPassword ?? "");
      const valid = currentPassword && (await verifyPassword(currentPassword, user.passwordHash));
      if (!valid) {
        return NextResponse.json(
          { error: "Huidig wachtwoord klopt niet" },
          { status: 400 }
        );
      }
    }
    data.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Niets om op te slaan" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data });

  if (emailChangedTo) {
    await sendVerificationEmail(emailChangedTo);
  }

  return NextResponse.json({ ok: true, emailChanged: Boolean(emailChangedTo) });
}
