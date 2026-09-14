import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  await prisma.supportMessage.create({
    data: { conversationId: conversation.id, sender: "USER", body: message },
  });
  await prisma.supportConversation.update({
    where: { id: conversation.id },
    data: { status: "OPEN" },
  });

  const updated = await prisma.supportConversation.findUnique({
    where: { id: conversation.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ conversation: updated });
}
