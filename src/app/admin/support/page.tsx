import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminSupportPage() {
  const conversations = await prisma.supportConversation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      user: { select: { name: true, email: true } },
    },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-3xl">Support-chats</h1>
      <p className="mt-1 text-sm text-ink/60">
        Berichten via het chat-bolletje in de app.
      </p>

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
        {conversations.map((c) => {
          const lastMessage = c.messages[0];
          const name = c.user?.name ?? c.guestName ?? "Onbekend";
          const email = c.user?.email ?? c.guestEmail ?? "";
          return (
            <li key={c.id}>
              <Link
                href={`/admin/support/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-paper/60"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {name}
                    {c.status === "OPEN" && lastMessage?.sender === "USER" && (
                      <span className="rounded-full bg-amber/20 px-2 py-0.5 text-[10px] font-medium text-amber-dark">
                        Wacht op antwoord
                      </span>
                    )}
                    {c.status === "OPEN" ? (
                      <span className="rounded-full bg-awning/10 px-2 py-0.5 text-[10px] font-medium text-awning">
                        Open
                      </span>
                    ) : (
                      <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-medium text-ink/50">
                        Gesloten
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink/50">{email}</p>
                  {lastMessage && (
                    <p className="mt-1 truncate text-xs text-ink/60">
                      {lastMessage.sender === "SUPPORT" ? "Jij: " : ""}
                      {lastMessage.body}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-xs text-ink/40">
                  {c.updatedAt.toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </Link>
            </li>
          );
        })}
        {conversations.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-ink/40">
            Nog geen chats.
          </li>
        )}
      </ul>
    </div>
  );
}
