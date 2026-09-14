import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email-verification";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = (body?.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Bewust geen onderscheid maken in de response tussen "bestaat niet" en
  // "al geverifieerd", dat lekt anders informatie over welke e-mailadressen
  // een account hebben.
  if (user && !user.emailVerified && user.passwordHash) {
    await sendVerificationEmail(email);
  }

  return NextResponse.json({ ok: true });
}
