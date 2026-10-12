import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifySupportOfMessage } from "@/lib/support-notify";
import { createConversation, resolveContact, type ChatOwner } from "@/lib/support-chat";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions).catch(() => null);
  const guestToken = req.headers.get("x-guest-token");

  const conversation = await prisma.supportConversation.findUnique({
    where: { id: params.id },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  // Alleen de eigenaar van dit gesprek (ingelogde gebruiker of bijpassende
  // gasttoken) mag hier een bericht aan toevoegen.
  const isOwner = session?.user?.id
    ? conversation.userId === session.user.id
    : Boolean(guestToken) && conversation.guestToken === guestToken;
  if (!isOwner) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const message = (body?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Bericht is verplicht" }, { status: 400 });
  }

  const sender = conversation.userId
    ? await prisma.user.findUnique({
        where: { id: conversation.userId },
        select: { name: true, email: true },
      })
    : null;
  const name = sender?.name ?? conversation.guestName ?? "Onbekend";
  const email = sender?.email ?? conversation.guestEmail ?? "";

  // Een gesloten gesprek wordt niet meer aangevuld: een nieuw bericht start een
  // nieuw gesprek (bv. als wij het net hebben afgehandeld terwijl de klant typte).
  if (conversation.status === "CLOSED") {
    const owner: ChatOwner = { userId: conversation.userId, guestToken: conversation.guestToken };
    const contact = await resolveContact(owner, { name, email }, sender);
    const { conversation: created } = await createConversation(owner, contact, message);
    await notifySupportOfMessage({
      conversationId: created.id,
      name: contact.name || name,
      email: contact.email || email,
      message,
      isNew: true,
    });
    return NextResponse.json({ conversation: created, startedNew: true });
  }

  await prisma.supportMessage.create({
    data: { conversationId: conversation.id, sender: "USER", body: message },
  });

  const updated = await prisma.supportConversation.findUnique({
    where: { id: conversation.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  await notifySupportOfMessage({
    conversationId: conversation.id,
    name,
    email,
    message,
    isNew: false,
  });

  return NextResponse.json({ conversation: updated });
}
