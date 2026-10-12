import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Support-chats van klanten. Een gesprek is OPEN of CLOSED (door ons afgehandeld).
// Een klant heeft hooguit één lopend gesprek; gesloten gesprekken blijven als
// geschiedenis zichtbaar (alleen lezen) en een nieuw bericht na het sluiten
// start een nieuw gesprek.

export type ChatOwner = { userId: string | null; guestToken: string | null };

const withMessages = { messages: { orderBy: { createdAt: "asc" as const } } };

/** Filter op de eigenaar van een gesprek, of null als er geen eigenaar bekend is. */
function ownerWhere(owner: ChatOwner) {
  if (owner.userId) return { userId: owner.userId };
  if (owner.guestToken) return { guestToken: owner.guestToken };
  return null;
}

/** Het lopende (nieuwste open) gesprek, met berichten. */
export async function findOpenConversation(owner: ChatOwner) {
  const where = ownerWhere(owner);
  if (!where) return null;
  return prisma.supportConversation.findFirst({
    where: { ...where, status: "OPEN" },
    orderBy: { updatedAt: "desc" },
    include: withMessages,
  });
}

/** Gesloten gesprekken (kort), nieuwste eerst. */
export async function listClosedConversations(owner: ChatOwner) {
  const where = ownerWhere(owner);
  if (!where) return [];
  const rows = await prisma.supportConversation.findMany({
    where: { ...where, status: "CLOSED" },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return rows.map((c) => ({
    id: c.id,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    preview: c.messages[0]?.body.slice(0, 80) ?? "",
  }));
}

/** Eén gesprek van deze eigenaar (open of gesloten), met berichten. */
export async function findOwnedConversation(owner: ChatOwner, id: string) {
  const where = ownerWhere(owner);
  if (!where) return null;
  return prisma.supportConversation.findFirst({
    where: { id, ...where },
    include: withMessages,
  });
}

/** Naam en e-mail voor een nieuw gesprek: wat de klant invult, anders wat we al van hem weten. */
export async function resolveContact(
  owner: ChatOwner,
  given: { name: string; email: string },
  user: { name?: string | null; email?: string | null } | null
) {
  let name = given.name || user?.name || "";
  let email = given.email || user?.email || "";
  if ((!name || !email) && owner.guestToken && !owner.userId) {
    const previous = await prisma.supportConversation.findFirst({
      where: { guestToken: owner.guestToken },
      orderBy: { createdAt: "desc" },
      select: { guestName: true, guestEmail: true },
    });
    name = name || previous?.guestName || "";
    email = email || previous?.guestEmail || "";
  }
  return { name: name.trim(), email: email.trim() };
}

/** Maakt een nieuw gesprek met een eerste bericht. */
export async function createConversation(
  owner: ChatOwner,
  contact: { name: string; email: string },
  message: string
) {
  // Een bezoeker houdt zijn token (ook voor volgende gesprekken); alleen de
  // allereerste keer maken we er een.
  const newGuestToken = !owner.userId && !owner.guestToken ? randomBytes(16).toString("hex") : undefined;
  const conversation = await prisma.supportConversation.create({
    data: {
      userId: owner.userId,
      guestToken: owner.userId ? null : owner.guestToken ?? newGuestToken,
      guestName: contact.name,
      guestEmail: contact.email,
      messages: { create: { sender: "USER", body: message } },
    },
    include: withMessages,
  });
  return { conversation, newGuestToken };
}
