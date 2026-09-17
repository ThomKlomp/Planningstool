"use client";

import { useEffect, useState } from "react";

export default function CalendarSyncCard() {
  const [url, setUrl] = useState<string | null>(null);
  const [webcalUrl, setWebcalUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/calendar/token")
      .then((r) => r.json())
      .then((data) => {
        setUrl(data.url);
        setWebcalUrl(data.webcalUrl);
      })
      .finally(() => setLoading(false));
  }, []);

  async function createOrRegenerate(regenerate: boolean) {
    setBusy(true);
    const res = await fetch("/api/calendar/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate }),
    });
    const data = await res.json();
    setUrl(data.url);
    setWebcalUrl(data.webcalUrl);
    setBusy(false);
  }

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <p className="text-sm text-ink/50">Bezig met laden...</p>;
  }

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      {!url ? (
        <div>
          <p className="text-sm text-ink/70">Nog geen agenda-link aangemaakt.</p>
          <button
            onClick={() => createOrRegenerate(false)}
            disabled={busy}
            className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning disabled:opacity-50"
          >
            {busy ? "Bezig..." : "Agenda-link aanmaken"}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm font-medium">Jouw agenda-link</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              readOnly
              value={url}
              className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink/70"
            />
            <button
              onClick={copy}
              className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink"
            >
              {copied ? "Gekopieerd" : "Kopiëren"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-ink/70">Google Agenda</p>
              <p className="mt-1 text-xs text-ink/50">
                Instellingen → Agenda's toevoegen → Via URL, plak de link
                hierboven.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink/70">Apple Agenda</p>
              <a
                href={webcalUrl ?? "#"}
                className="mt-1 inline-block text-xs text-awning hover:underline"
              >
                Tik hier om direct te abonneren
              </a>
              <p className="mt-1 text-xs text-ink/50">
                Of handmatig: Agenda-app → Archief → Nieuw agenda-abonnement.
              </p>
            </div>
          </div>

          <button
            onClick={() => createOrRegenerate(true)}
            disabled={busy}
            className="mt-5 text-xs text-ink/50 hover:underline"
          >
            Link verlopen of gelekt? Nieuwe link genereren
          </button>
        </div>
      )}
    </div>
  );
}
