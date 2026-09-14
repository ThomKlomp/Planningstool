"use client";

import { useEffect, useRef, useState } from "react";

type Message = { id: string; sender: string; body: string; createdAt: string };

export default function ConversationThread({
  conversationId,
  initialMessages,
  initialStatus,
}: {
  conversationId: string;
  initialMessages: Message[];
  initialStatus: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/support/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.conversation.messages);
        setStatus(data.conversation.status);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);

    const res = await fetch(`/api/admin/support/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages(data.conversation.messages);
      setReply("");
    }
    setSending(false);
  }

  async function toggleStatus() {
    const next = status === "OPEN" ? "CLOSED" : "OPEN";
    setStatus(next);
    await fetch(`/api/admin/support/conversations/${conversationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={toggleStatus}
          className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-ink"
        >
          {status === "OPEN" ? "Markeer als afgehandeld" : "Heropenen"}
        </button>
      </div>

      <div className="mt-3 flex max-h-[60vh] flex-col gap-2 overflow-y-auto rounded-xl border border-line bg-white p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              m.sender === "SUPPORT"
                ? "ml-auto bg-ink text-paper"
                : "bg-paper text-ink"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p
              className={`mt-1 text-[10px] ${
                m.sender === "SUPPORT" ? "text-paper/50" : "text-ink/40"
              }`}
            >
              {new Date(m.createdAt).toLocaleString("nl-NL", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendReply} className="mt-3 flex gap-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Typ je antwoord..."
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !reply.trim()}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
        >
          Versturen
        </button>
      </form>
    </div>
  );
}
