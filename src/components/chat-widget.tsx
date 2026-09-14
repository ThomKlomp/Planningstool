"use client";

import { useState } from "react";

export default function ChatWidget({
  defaultName = "",
  defaultEmail = "",
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    const res = await fetch("/api/support/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Versturen mislukt, probeer het later opnieuw.");
      setSending(false);
      return;
    }

    setSent(true);
    setMessage("");
    setSending(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg">Hulp nodig?</p>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full px-1.5 text-ink/40 hover:text-ink"
              aria-label="Sluiten"
            >
              ✕
            </button>
          </div>

          {sent ? (
            <div className="mt-3 rounded-lg bg-awning/10 px-3 py-3 text-sm text-awning">
              Bedankt! Je bericht is verstuurd, we reageren zo snel mogelijk.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-2">
              <p className="text-xs text-ink/50">
                Stuur ons een berichtje, we mailen je terug.
              </p>
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
              <textarea
                required
                placeholder="Waar kunnen we mee helpen?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm focus:border-awning focus:outline-none"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning transition-colors disabled:opacity-50"
              >
                {sending ? "Bezig..." : "Versturen"}
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => {
          setOpen((v) => !v);
          if (sent) setSent(false);
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-lg hover:bg-awning transition-colors"
        aria-label={open ? "Chat sluiten" : "Chat openen"}
      >
        {open ? (
          <span className="text-xl">✕</span>
        ) : (
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
