import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifySupportOfMessage } from "@/lib/support-notify";
import {
  createConversation,
  findOpenConversation,
  findOwnedConversation,
  listClosedConversations,
  resolveContact,
  type ChatOwner,
} from "@/lib/support-chat";

async function ownerOf(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const owner: ChatOwner = {
    userId: session?.user?.id ?? null,
    guestToken: req.headers.get("x-guest-token"),
  };
  return { session, owner };
}

// Zonder ?id: het lopende gesprek (of null) en een lijst met gesloten
// gesprekken. Met ?id=: één gesprek van deze klant, ook als het gesloten is.
export async function GET(req: Request) {
  const { owner } = await ownerOf(req);

  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const conversation = await findOwnedConversation(owner, id);
    if (!conversation) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    return NextResponse.json({ conversation });
  }

  const [conversation, closed] = await Promise.all([
    findOpenConversation(owner),
    listClosedConversations(owner),
  ]);
  return NextResponse.json({ conversation, closed });
}

export async function POST(req: Request) {
  const { session, owner } = await ownerOf(req);

  const body = await req.json().catch(() => ({}));
  const message = (body?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Bericht is verplicht" }, { status: 400 });
  }

  // Is er een lopend gesprek, dan hoort het bericht daarbij; anders starten we
  // een nieuw gesprek (ook als er gesloten gesprekken zijn).
  const open = await findOpenConversation(owner);
  if (open) {
    await prisma.supportMessage.create({
      data: { conversationId: open.id, sender: "USER", body: message },
    });
    const updated = await findOpenConversation(owner);
    await notifySupportOfMessage({
      conversationId: open.id,
      name: open.guestName ?? session?.user?.name ?? "Onbekend",
      email: open.guestEmail ?? session?.user?.email ?? "",
      message,
      isNew: false,
    });
    return NextResponse.json({ conversation: updated });
  }

  const contact = await resolveContact(
    owner,
    { name: (body?.name ?? "").trim(), email: (body?.email ?? "").trim() },
    session?.user ?? null
  );
  if (!contact.name || !contact.email) {
    return NextResponse.json({ error: "Naam, e-mail en bericht zijn verplicht" }, { status: 400 });
  }

  const { conversation, newGuestToken } = await createConversation(owner, contact, message);
  await notifySupportOfMessage({
    conversationId: conversation.id,
    name: contact.name,
    email: contact.email,
    message,
    isNew: true,
  });

  return NextResponse.json({ conversation, guestToken: newGuestToken });
}
