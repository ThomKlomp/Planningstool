import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const message = (body?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Bericht is verplicht" }, { status: 400 });
  }

  const conversation = await prisma.supportConversation.findUnique({
    where: { id: params.id },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  await prisma.supportMessage.create({
    data: { conversationId: conversation.id, sender: "SUPPORT", body: message },
  });

  const updated = await prisma.supportConversation.findUnique({
    where: { id: conversation.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ conversation: updated });
}
