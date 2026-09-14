import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const conversation = await prisma.supportConversation.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.status === "CLOSED" ? "CLOSED" : "OPEN";

  const conversation = await prisma.supportConversation.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json({ conversation });
}
