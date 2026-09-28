"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Beschikbaarheid wordt bij elke klik meteen opgeslagen. Sommige mensen
// twijfelen daardoor of het echt is doorgekomen. Deze provider houdt bij of
// een opslagactie lukt en laat dat DIRECT zien: een melding onderin beeld
// ("Opgeslagen" of een foutmelding) en een bijgewerkte Opslaan-knop. De knop
// hoeft dus niet ingedrukt te worden, maar geeft wel extra zekerheid.
type SaveContext = {
  /** Volg een opslagactie (true = gelukt). Geeft hetzelfde resultaat terug. */
  track: (promise: Promise<boolean>) => Promise<boolean>;
  pending: number;
  failed: boolean;
  lastSavedAt: Date | null;
  /** Toon opnieuw "Opgeslagen" (voor de knop, als er niets meer loopt). */
  confirmNow: () => void;
};

const Ctx = createContext<SaveContext | null>(null);

type Toast = "saved" | "failed" | null;

export function AvailabilitySaveProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const pendingRef = useRef(0);
  const failedInBatchRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((kind: Exclude<Toast, null>) => {
    setToast(kind);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), kind === "failed" ? 6000 : 2500);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const track = useCallback(
    async (promise: Promise<boolean>) => {
      // Nieuwe reeks wijzigingen: eerdere foutstatus is niet meer actueel.
      if (pendingRef.current === 0) {
        failedInBatchRef.current = false;
        setFailed(false);
      }
      pendingRef.current += 1;
      setPending(pendingRef.current);
      setToast(null);

      const ok = await promise.catch(() => false);

      pendingRef.current -= 1;
      setPending(pendingRef.current);
      if (!ok) failedInBatchRef.current = true;

      // Pas melden als alles is afgerond, zodat je niet "Opgeslagen" ziet
      // terwijl er nog iets onderweg is.
      if (pendingRef.current === 0) {
        if (failedInBatchRef.current) {
          setFailed(true);
          showToast("failed");
        } else {
          setLastSavedAt(new Date());
          showToast("saved");
        }
      }
      return ok;
    },
    [showToast]
  );

  const confirmNow = useCallback(() => {
    if (pendingRef.current > 0) return;
    setFailed(false);
    setLastSavedAt(new Date());
    showToast("saved");
  }, [showToast]);

  return (
    <Ctx.Provider value={{ track, pending, failed, lastSavedAt, confirmNow }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {toast === "saved" && (
          <div className="rounded-full bg-awning px-5 py-2.5 text-sm font-medium text-white shadow-lg">
            ✓ Opgeslagen
          </div>
        )}
        {toast === "failed" && (
          <div className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
            Opslaan mislukt, probeer het nog een keer
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useAvailabilitySave() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAvailabilitySave moet binnen AvailabilitySaveProvider staan");
  return ctx;
}

/** "Opslaan"-knop onder de open/dicht-status. Toont live de stand van opslaan. */
export function AvailabilitySaveButton({ locked }: { locked: boolean }) {
  const { pending, failed, lastSavedAt, confirmNow } = useAvailabilitySave();
  if (locked) return null;

  const saved = lastSavedAt !== null && !failed && pending === 0;
  const time = lastSavedAt?.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={confirmNow}
        disabled={pending > 0}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          saved ? "bg-awning text-white" : "bg-ink text-paper hover:bg-awning"
        }`}
      >
        {pending > 0 ? "Bezig met opslaan..." : saved ? "✓ Opgeslagen" : "Opslaan"}
      </button>
      {saved && <p className="text-xs text-awning">Je beschikbaarheid is opgeslagen ({time}).</p>}
      {failed && pending === 0 && (
        <p className="max-w-[16rem] text-right text-xs text-red-600">
          Niet alles is opgeslagen. Klik de dag(en) waar het misging nog een keer aan.
        </p>
      )}
    </div>
  );
}
