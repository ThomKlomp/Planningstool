"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Message = { id: string; sender: string; body: string; createdAt: string };
type Conversation = { id: string; status: string; messages: Message[] } | null;
type ClosedSummary = { id: string; createdAt: string; updatedAt: string; preview: string };

const GUEST_TOKEN_KEY = "shiftje_guest_token";

// Pagina's zonder chatknop: losse artikelen die als neutrale bron moeten aanvoelen.
const NO_CHAT_PATHS = ["/rooster-oproepkrachten-horeca", "/gids", "/artikel"];

export default function ChatWidget({
  defaultName = "",
  defaultEmail = "",
  isLoggedIn = false,
}: {
  defaultName?: string;
  defaultEmail?: string;
  isLoggedIn?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<Conversation>(null);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Gesloten gesprekken (geschiedenis) en wat er nu getoond wordt: het gesprek
  // zelf, de lijst met eerdere gesprekken, of één gesloten gesprek (alleen lezen).
  const [closedList, setClosedList] = useState<ClosedSummary[]>([]);
  const [view, setView] = useState<"chat" | "history" | "closed">("chat");
  const [viewing, setViewing] = useState<Conversation>(null);
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
      setClosedList(data.closed ?? []);
      if (data.conversation) {
        setConversation(data.conversation);
      } else {
        // Geen lopend gesprek meer: is het net door ons afgesloten terwijl het
        // venster openstond, dan blijft het zichtbaar (als gesloten) tot de
        // klant een nieuw bericht stuurt; anders is er gewoon geen gesprek.
        setConversation((prev) => (prev ? { ...prev, status: "CLOSED" } : null));
      }
    }
    setLoaded(true);
  }

  async function openClosed(id: string) {
    setError(null);
    setDraft("");
    const res = await fetch(`/api/support/conversation?id=${encodeURIComponent(id)}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    setViewing(data.conversation);
    setView("closed");
  }

  function startNewChat() {
    // Het gesloten gesprek maakt plaats voor een leeg, nieuw gesprek.
    setConversation((prev) => (prev?.status === "CLOSED" ? null : prev));
    setViewing(null);
    setView("chat");
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

  // Link uit de support-mail (…?chat=open): chat direct openen.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("chat") === "open") setOpen(true);
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

    // Een gesloten gesprek uit de lijst bewust heropenen en erop reageren.
    if (view === "closed" && viewing) {
      const res = await fetch(`/api/support/conversation/${viewing.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ message: draft, reopen: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Versturen mislukt.");
        setSending(false);
        return;
      }
      setConversation(data.conversation);
      setViewing(null);
      setView("chat");
      setDraft("");
      setSending(false);
      loadConversation();
      return;
    }

    // Geen lopend gesprek (of het is gesloten): dit bericht start een nieuw gesprek.
    if (!conversation || conversation.status === "CLOSED") {
      // Eerste bericht: naam + e-mail zijn dan verplicht, tenzij we ze al kennen
      // (ingelogd, of een bezoeker met eerdere gesprekken).
      const known = isLoggedIn || closedList.length > 0 || conversation !== null;
      if (!known && (!name.trim() || !email.trim())) {
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
      setView("chat");
      loadConversation();
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

  if (NO_CHAT_PATHS.some((p) => pathname === p || pathname?.startsWith(p + "/"))) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {view !== "chat" && (
                <button
                  onClick={() => setView(view === "closed" ? "history" : "chat")}
                  className="rounded-full px-1.5 text-ink/50 hover:text-ink"
                  aria-label="Terug"
                >
                  ←
                </button>
              )}
              <p className="truncate font-display text-lg">
                {view === "history" ? "Eerdere gesprekken" : view === "closed" ? "Gesloten gesprek" : "Hulp nodig?"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {view === "chat" && closedList.length > 0 && (
                <button
                  onClick={() => setView("history")}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-ink/60 hover:border-ink hover:text-ink"
                >
                  Eerdere gesprekken ({closedList.length})
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-1.5 text-ink/40 hover:text-ink"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex max-h-96 min-h-[10rem] flex-col gap-2 overflow-y-auto px-4 py-3">
            {view === "history" && (
              <ul className="-mx-1 divide-y divide-line">
                {closedList.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => openClosed(c.id)}
                      className="block w-full rounded-lg px-2 py-2.5 text-left hover:bg-mist"
                    >
                      <span className="block text-xs text-ink/40">
                        {new Date(c.createdAt).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="block truncate text-sm">{c.preview || "Gesprek"}</span>
                    </button>
                  </li>
                ))}
                {closedList.length === 0 && (
                  <li className="px-2 py-2 text-xs text-ink/50">Nog geen gesloten gesprekken.</li>
                )}
              </ul>
            )}

            {view === "closed" &&
              viewing?.messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.sender === "SUPPORT" ? "bg-mist text-ink" : "ml-auto bg-ink text-paper"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}

            {view === "chat" && (
              <>
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
                      m.sender === "SUPPORT" ? "bg-mist text-ink" : "ml-auto bg-ink text-paper"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
                {conversation?.status === "CLOSED" && (
                  <p className="rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink/60">
                    Dit gesprek is afgerond. Stuur een bericht om een nieuw gesprek te starten.
                  </p>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {view === "closed" && (
            <div className="space-y-2 border-t border-line px-4 py-3">
              {conversation && conversation.status !== "CLOSED" ? (
                <>
                  <p className="text-xs text-ink/50">
                    Je hebt al een lopend gesprek. Heropenen kan pas als dat is afgerond.
                  </p>
                  <button
                    onClick={() => setView("chat")}
                    className="w-full rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning"
                  >
                    Naar het lopende gesprek
                  </button>
                </>
              ) : (
                <>
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Reageer om dit gesprek te heropenen"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
                    >
                      {sending ? "..." : "Stuur"}
                    </button>
                  </form>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <button
                    onClick={startNewChat}
                    className="text-xs text-ink/50 hover:text-ink hover:underline"
                  >
                    Of begin een nieuw gesprek
                  </button>
                </>
              )}
            </div>
          )}

          {view === "chat" && (
          <form onSubmit={sendMessage} className="space-y-2 border-t border-line px-4 py-3">
            {!conversation && !isLoggedIn && closedList.length === 0 && (
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
          )}
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
