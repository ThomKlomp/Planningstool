import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ConversationThread from "./conversation-thread";

export default async function AdminSupportConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const conversation = await prisma.supportConversation.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: {
        select: {
          name: true,
          email: true,
          memberships: { select: { role: true, company: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!conversation) notFound();

  const name = conversation.user?.name ?? conversation.guestName ?? "Onbekend";
  const email = conversation.user?.email ?? conversation.guestEmail ?? "";

  return (
    <div className="max-w-2xl">
      <Link href="/admin/support" className="text-sm text-ink/50 hover:text-ink">
        ← Alle chats
      </Link>
      <div className="mt-2">
        <h1 className="font-display text-2xl">{name}</h1>
        <p className="text-sm text-ink/50">{email}</p>
        <p className="mt-1 text-sm">
          <span className="text-ink/50">Zaak: </span>
          {conversation.user ? (
            conversation.user.memberships.length > 0 ? (
              conversation.user.memberships.map((m, i) => (
                <span key={m.company.id}>
                  {i > 0 && ", "}
                  <Link href={`/admin/companies/${m.company.id}`} className="text-awning hover:underline">
                    {m.company.name}
                  </Link>{" "}
                  <span className="text-ink/50">
                    ({m.role === "OWNER" ? "eigenaar" : m.role === "MANAGER" ? "manager" : "medewerker"})
                  </span>
                </span>
              ))
            ) : (
              "ingelogd, nog geen zaak"
            )
          ) : (
            "bezoeker, niet ingelogd"
          )}
        </p>
      </div>

      <div className="mt-6">
        <ConversationThread
          conversationId={conversation.id}
          initialStatus={conversation.status}
          initialMessages={conversation.messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
