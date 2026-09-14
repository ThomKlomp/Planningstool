import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { randomBytes } from "crypto";

async function findConversation(userId: string | null, guestToken: string | null) {
  if (userId) {
    return prisma.supportConversation.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }
  if (guestToken) {
    return prisma.supportConversation.findUnique({
      where: { guestToken },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }
  return null;
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const guestToken = req.headers.get("x-guest-token");

  const conversation = await findConversation(session?.user?.id ?? null, guestToken);
  return NextResponse.json({ conversation });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const guestTokenHeader = req.headers.get("x-guest-token");

  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? "").trim();
  const email = (body?.email ?? "").trim();
  const message = (body?.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Naam, e-mail en bericht zijn verplicht" },
      { status: 400 }
    );
  }

  const userId = session?.user?.id ?? null;
  let conversation = await findConversation(userId, guestTokenHeader);

  const newGuestToken = !userId && !conversation ? randomBytes(16).toString("hex") : undefined;

  if (!conversation) {
    conversation = await prisma.supportConversation.create({
      data: {
        userId,
        guestToken: newGuestToken,
        guestName: name,
        guestEmail: email,
        messages: { create: { sender: "USER", body: message } },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    const supportEmail = process.env.SUPPORT_EMAIL;
    if (supportEmail) {
      await sendEmail({
        to: supportEmail,
        subject: `Nieuwe chat geopend — ${name}`,
        replyTo: email,
        html: emailLayout(
          "Er staat een nieuwe chat open",
          `
            <p><strong>Van:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
            <p style="margin-top: 12px; white-space: pre-wrap;">${escapeHtml(message)}</p>
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL ?? ""}/admin/support/${conversation.id}" style="color:#3F6E5B;">
                Reageren in het adminportaal →
              </a>
            </p>
          `
        ),
      });
      await prisma.supportConversation.update({
        where: { id: conversation.id },
        data: { notifiedAt: new Date() },
      });
    }
  } else {
    await prisma.supportMessage.create({
      data: { conversationId: conversation.id, sender: "USER", body: message },
    });
    conversation = await prisma.supportConversation.findUnique({
      where: { id: conversation.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  return NextResponse.json({ conversation, guestToken: newGuestToken });
}

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
