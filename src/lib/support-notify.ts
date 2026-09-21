import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Volgende berichten in een lopend gesprek geven maximaal 1 mail per zoveel
// minuten, anders krijg je bij elk los zinnetje een mail.
const FOLLOW_UP_THROTTLE_MS = 15 * 60 * 1000;

/**
 * Ontvangers van support-meldingen: SUPPORT_EMAIL als die is ingesteld,
 * anders alle platform-admins. Zo komt de melding ook aan als de
 * omgevingsvariabele (nog) niet is gezet.
 */
export async function supportRecipients(): Promise<string[]> {
  const configured = (process.env.SUPPORT_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (configured.length > 0) return configured;

  const admins = await prisma.platformAdmin.findMany({
    include: { user: { select: { email: true } } },
  });
  return admins.map((a) => a.user.email).filter((e): e is string => Boolean(e));
}

/**
 * Mailt het supportteam over een nieuwe chat (isNew) of een nieuw bericht in
 * een bestaande chat. Faalt nooit: een mislukte e-mail mag het chatbericht van
 * de klant niet blokkeren.
 */
export async function notifySupportOfMessage(opts: {
  conversationId: string;
  name: string;
  email: string;
  message: string;
  isNew: boolean;
}) {
  try {
    const conversation = await prisma.supportConversation.findUnique({
      where: { id: opts.conversationId },
      select: { notifiedAt: true },
    });

    if (
      !opts.isNew &&
      conversation?.notifiedAt &&
      Date.now() - conversation.notifiedAt.getTime() < FOLLOW_UP_THROTTLE_MS
    ) {
      return;
    }

    const recipients = await supportRecipients();
    if (recipients.length === 0) {
      console.warn("[support] geen ontvangers voor support-melding (SUPPORT_EMAIL of platform-admin)");
      return;
    }

    const link = `${process.env.NEXTAUTH_URL ?? ""}/admin/support/${opts.conversationId}`;

    await sendEmail({
      to: recipients,
      subject: opts.isNew
        ? `Nieuwe support-chat van ${opts.name}`
        : `Nieuw bericht in support-chat van ${opts.name}`,
      replyTo: opts.email || undefined,
      html: emailLayout(
        opts.isNew ? "Er is een support-chat aangemaakt" : "Nieuw bericht in een support-chat",
        `
          <p><strong>Van:</strong> ${escapeHtml(opts.name)} (${escapeHtml(opts.email)})</p>
          <p style="margin-top: 12px; white-space: pre-wrap;">${escapeHtml(opts.message)}</p>
          <p style="margin-top: 20px;">
            <a href="${link}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
              Reageren in het adminportaal
            </a>
          </p>
        `
      ),
    });

    await prisma.supportConversation.update({
      where: { id: opts.conversationId },
      data: { notifiedAt: new Date() },
    });
  } catch (err) {
    console.error("[support] melding versturen mislukt", err);
  }
}

/**
 * Aantal open chats waarop nog niet gereageerd is (laatste bericht komt van
 * de klant). Voor het bolletje in het adminportaal.
 */
export async function countChatsAwaitingReply(): Promise<number> {
  const open = await prisma.supportConversation.findMany({
    where: { status: "OPEN" },
    select: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { sender: true } } },
  });
  return open.filter((c) => c.messages[0]?.sender === "USER").length;
}
