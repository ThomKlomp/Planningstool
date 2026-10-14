"use client";

import { useEffect, useState } from "react";

type Summary = {
  eligible: boolean;
  reason?: string;
  mode?: "SOON" | "AVAILABLE" | "NOBODY_AVAILABLE";
  daysAhead?: number;
  nobodyAvailable?: boolean;
  recipients: { name: string; reason: string }[];
  skipped: { name: string; reason: string }[];
  mailedCount?: number;
  problems?: string[];
};

const SENT_EVENT = "shiftje:open-shift-mail";
const PROMPT_EVENT = "shiftje:open-shift-prompt";

/** Toont na het aanmaken van een open dienst wie er gemaild is (melding). */
export function announceOpenShiftMail(summary: Summary | undefined | null) {
  if (summary) window.dispatchEvent(new CustomEvent(SENT_EVENT, { detail: summary }));
}

/** Vraagt de manager of het team gemaild moet worden omdat een dienst open is gekomen. */
export function promptOpenShiftMail(shiftId: string) {
  window.dispatchEvent(new CustomEvent(PROMPT_EVENT, { detail: { shiftId } }));
}

function PersonList({ title, people }: { title: string; people: { name: string; reason: string }[] }) {
  if (people.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink/40">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {people.map((p, i) => (
          <li key={i} className="text-xs">
            <span className="font-medium">{p.name}</span>
            <span className="text-ink/50"> · {p.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OpenShiftMailHost() {
  const [toast, setToast] = useState<Summary | null>(null);
  const [promptShift, setPromptShift] = useState<string | null>(null);
  const [preview, setPreview] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeManagers, setIncludeManagers] = useState(false);

  async function loadPreview(shiftId: string, withManagers: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/open-mail${withManagers ? "?includeManagers=1" : ""}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Voorbeeld laden mislukt.");
      setPreview(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voorbeeld laden mislukt.");
    }
    setLoading(false);
  }

  useEffect(() => {
    function onSent(e: Event) {
      setToast((e as CustomEvent<Summary>).detail);
    }
    async function onPrompt(e: Event) {
      const { shiftId } = (e as CustomEvent<{ shiftId: string }>).detail;
      setPromptShift(shiftId);
      setPreview(null);
      setError(null);
      setIncludeManagers(false);
      await loadPreview(shiftId, false);
    }
    window.addEventListener(SENT_EVENT, onSent);
    window.addEventListener(PROMPT_EVENT, onPrompt);
    return () => {
      window.removeEventListener(SENT_EVENT, onSent);
      window.removeEventListener(PROMPT_EVENT, onPrompt);
    };
  }, []);

  async function send() {
    if (!promptShift) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/shifts/${promptShift}/open-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeManagers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Mailen mislukt.");
      setPromptShift(null);
      setToast(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mailen mislukt.");
    }
    setSending(false);
  }

  const canSend = !!preview?.eligible && preview.recipients.length > 0;

  return (
    <>
      {promptShift && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4"
          onClick={() => !sending && setPromptShift(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg">Dienst staat nu open</h3>
            <p className="mt-1 text-sm text-ink/60">Wil je het team mailen dat er een dienst open staat?</p>
            {loading && <p className="mt-3 text-xs text-ink/50">Even kijken wie je kunt mailen…</p>}
            {preview && !preview.eligible && (
              <p className="mt-3 text-xs text-ink/60">Er wordt niet gemaild: {preview.reason}</p>
            )}
            {preview?.eligible && preview.nobodyAvailable && (
              <p className="mt-3 rounded-lg bg-amber/15 px-3 py-2 text-xs">
                Niemand in het team staat beschikbaar, daarom gaat de mail naar iedereen.
              </p>
            )}
            {preview?.eligible && (
              <>
                <PersonList title="Krijgt een mail" people={preview.recipients} />
                <PersonList title="Krijgt geen mail" people={preview.skipped} />
              </>
            )}
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={includeManagers}
                disabled={sending}
                onChange={(e) => {
                  setIncludeManagers(e.target.checked);
                  if (promptShift) loadPreview(promptShift, e.target.checked);
                }}
                className="h-3.5 w-3.5 rounded border-line text-awning focus:ring-awning"
              />
              Managers ook mailen
            </label>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPromptShift(null)}
                disabled={sending}
                className="rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-ink disabled:opacity-50"
              >
                Niet mailen
              </button>
              <button
                onClick={send}
                disabled={sending || !canSend}
                className="rounded-full bg-orange px-3 py-1.5 text-xs font-medium text-ink hover:bg-orange-dark disabled:opacity-50"
              >
                {sending ? "Versturen..." : canSend ? `Ja, mail ${preview!.recipients.length} ${preview!.recipients.length === 1 ? "persoon" : "mensen"}` : "Ja, mailen"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-[70] w-[calc(100%-2rem)] max-w-sm" role="status">
          <div
            className={`max-h-[70vh] overflow-y-auto rounded-2xl border bg-white p-4 shadow-xl ${
              toast.nobodyAvailable ? "border-amber" : "border-line"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">
                {!toast.eligible
                  ? "Geen mail verstuurd"
                  : toast.problems && toast.problems.length > 0
                  ? "Mail niet (helemaal) verstuurd"
                  : (toast.mailedCount ?? 0) > 0
                  ? `Team gemaild (${toast.mailedCount} ${toast.mailedCount === 1 ? "persoon" : "mensen"})`
                  : "Niemand gemaild"}
              </p>
              <button
                onClick={() => setToast(null)}
                className="rounded-full px-1.5 text-ink/40 hover:text-ink"
                aria-label="Sluiten"
              >
                ✕
              </button>
            </div>
            {!toast.eligible && <p className="mt-1 text-xs text-ink/60">{toast.reason}</p>}
            {toast.eligible && toast.nobodyAvailable && (
              <p className="mt-1 text-xs text-ink/70">
                Niemand in het team staat beschikbaar, daarom is iedereen gemaild.
              </p>
            )}
            {toast.eligible && toast.mode === "SOON" && (
              <p className="mt-1 text-xs text-ink/50">De dienst is binnen 7 dagen: iedereen in het team.</p>
            )}
            {toast.problems && toast.problems.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{toast.problems.join("; ")}</p>
            )}
            {toast.eligible && (
              <>
                <PersonList title="Gemaild" people={toast.recipients} />
                <PersonList title="Niet gemaild" people={toast.skipped} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
