"use client";

import { useEffect, useRef, useState } from "react";

type Message = { id: string; sender: string; body: string; createdAt: string };
type Conversation = { id: string; status: string; messages: Message[] } | null;

const GUEST_TOKEN_KEY = "shiftje_guest_token";

export default function ChatWidget({
  defaultName = "",
  defaultEmail = "",
  isLoggedIn = false,
}: {
  defaultName?: string;
  defaultEmail?: string;
  isLoggedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation>(null);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function guestToken() {
    if (isLoggedIn) return null;
    return typeof window !== "undefined" ? localStorage.getItem(GUEST_TOKEN_KEY) : null;
  }

  function authHeaders(): HeadersInit {
    const token = guestToken();
    return token ? { "x-guest-token": token } : {};
  }

  async function loadConversation() {
    const res = await fetch("/api/support/conversation", { headers: authHeaders() });
    if (res.ok) {
      const data = await res.json();
      setConversation(data.conversation);
    }
    setLoaded(true);
  }

  useEffect(() => {
    if (open && !loaded) loadConversation();
  }, [open, loaded]);

  // Andere delen van de site (bv. de "Neem contact op"-knop op de homepage)
  // kunnen de chat openen, optioneel met een voorgevulde tekst.
  useEffect(() => {
    function handleOpen(e: Event) {
      const message = (e as CustomEvent<{ message?: string }>).detail?.message;
      setOpen(true);
      if (message) setDraft((current) => current || message);
    }
    window.addEventListener("shiftje:open-chat", handleOpen);
    return () => window.removeEventListener("shiftje:open-chat", handleOpen);
  }, []);

  // Poll voor nieuwe berichten (bv. een antwoord) terwijl het venster open is.
  useEffect(() => {
    if (!open || !conversation) return;
    const interval = setInterval(loadConversation, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);

    if (!conversation) {
      // Eerste bericht: naam + e-mail zijn dan verplicht.
      if (!name.trim() || !email.trim()) {
        setError("Vul je naam en e-mail in.");
        setSending(false);
        return;
      }
      const res = await fetch("/api/support/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, email, message: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Versturen mislukt.");
        setSending(false);
        return;
      }
      if (data.guestToken && typeof window !== "undefined") {
        localStorage.setItem(GUEST_TOKEN_KEY, data.guestToken);
      }
      setConversation(data.conversation);
    } else {
      const res = await fetch(`/api/support/conversation/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ message: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Versturen mislukt.");
        setSending(false);
        return;
      }
      setConversation(data.conversation);
    }

    setDraft("");
    setSending(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-lg">Hulp nodig?</p>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full px-1.5 text-ink/40 hover:text-ink"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </div>

          <div className="flex max-h-96 min-h-[10rem] flex-col gap-2 overflow-y-auto px-4 py-3">
            {!conversation && (
              <p className="text-xs text-ink/50">
                Stuur ons een berichtje, we reageren zo snel mogelijk. Je
                ziet het antwoord hier terug.
              </p>
            )}
            {conversation?.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.sender === "SUPPORT"
                    ? "bg-paper text-ink"
                    : "ml-auto bg-ink text-paper"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="space-y-2 border-t border-line px-4 py-3">
            {!conversation && !isLoggedIn && (
              <>
                <input
                  type="text"
                  required
                  placeholder="Je naam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Je e-mailadres"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
                />
              </>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Wat kan ik voor je bestellen?"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
              >
                {sending ? "..." : "Stuur"}
              </button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-lg hover:bg-awning transition-colors"
        aria-label={open ? "Chat sluiten" : "Chat openen"}
      >
        {open ? (
          <span className="text-xl">✕</span>
        ) : (
          // Serveerbelletje (zoals op een bar) i.p.v. een generiek chatbolletje: je "belt" voor hulp.
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M3 18h18" />
            <path d="M5 18a7 7 0 0 1 14 0" />
            <path d="M12 6v2" />
            <circle cx="12" cy="4" r="1.4" fill="currentColor" stroke="none" />
          </svg>
        )}
      </button>
    </div>
  );
}
