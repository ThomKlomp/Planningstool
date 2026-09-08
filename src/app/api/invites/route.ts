import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const body = await req.json();
  const email = (body?.email ?? "").trim().toLowerCase();
  const role = body?.role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

  if (!email) {
    return NextResponse.json({ error: "E-mailadres is verplicht" }, { status: 400 });
  }

  // Alleen owner/manager van de zaak mag uitnodigen.
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const invite = await prisma.invite.create({
    data: {
      email,
      role,
      companyId: membership.companyId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // 14 dagen geldig
    },
  });

  // TODO: verstuur hier een e-mail met de invite-link, bv. via Resend of Postmark.
  const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/invite/${invite.token}`;

  return NextResponse.json({ invite, inviteUrl });
}
