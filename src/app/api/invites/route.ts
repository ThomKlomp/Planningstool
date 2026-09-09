import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

function roleLabel(role: string) {
  return role === "MANAGER" ? "manager" : "medewerker";
}

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

  const inviteUrl = `${process.env.NEXTAUTH_URL ?? ""}/invite/${invite.token}`;

  const emailResult = await sendEmail({
    to: email,
    subject: `Uitnodiging voor ${membership.companyName}`,
    html: emailLayout(
      `Je bent uitgenodigd bij ${membership.companyName}`,
      `
        <p>Je bent uitgenodigd om als ${roleLabel(role)} mee te werken bij
        <strong>${membership.companyName}</strong>.</p>
        <p style="margin-top: 20px;">
          <a href="${inviteUrl}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
            Uitnodiging bekijken
          </a>
        </p>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">
          Werkt de knop niet? Kopieer deze link: ${inviteUrl}
        </p>
      `
    ),
  });

  return NextResponse.json({
    invite,
    inviteUrl,
    emailSent: !("skipped" in emailResult),
  });
}
