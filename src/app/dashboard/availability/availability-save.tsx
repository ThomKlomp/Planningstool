"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Beschikbaarheid wordt bij elke klik meteen opgeslagen. Sommige mensen (vooral
// wie minder thuis is in apps) twijfelen daardoor of het echt is doorgekomen.
// Deze provider houdt bij hoeveel opslagacties er lopen en of er eentje
// mislukt is, zodat de Opslaan-knop eerlijk kan bevestigen ("Opgeslagen") in
// plaats van alleen maar geruststellend te zijn.
type SaveContext = {
  /** Volg een opslagactie (true = gelukt). Geeft hetzelfde resultaat terug. */
  track: (promise: Promise<boolean>) => Promise<boolean>;
  pending: number;
  failed: boolean;
  changeCount: number;
  clearFailed: () => void;
};

const Ctx = createContext<SaveContext | null>(null);

export function AvailabilitySaveProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);
  const [failed, setFailed] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  const track = useCallback(async (promise: Promise<boolean>) => {
    setPending((n) => n + 1);
    setChangeCount((n) => n + 1);
    const ok = await promise.catch(() => false);
    setPending((n) => n - 1);
    if (!ok) setFailed(true);
    return ok;
  }, []);

  const clearFailed = useCallback(() => setFailed(false), []);

  return (
    <Ctx.Provider value={{ track, pending, failed, changeCount, clearFailed }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAvailabilitySave() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAvailabilitySave moet binnen AvailabilitySaveProvider staan");
  return ctx;
}

/**
 * "Opslaan"-knop onder de open/dicht-status. Wacht op lopende opslagacties en
 * meldt daarna of alles is doorgekomen.
 */
export function AvailabilitySaveButton({ locked }: { locked: boolean }) {
  const { pending, failed, changeCount, clearFailed } = useAvailabilitySave();
  const [waiting, setWaiting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ at: Date; atChange: number } | null>(null);

  // Zodra alles is afgerond na een klik op Opslaan: bevestigen.
  useEffect(() => {
    if (waiting && pending === 0) {
      setWaiting(false);
      if (!failed) setConfirmed({ at: new Date(), atChange: changeCount });
    }
  }, [waiting, pending, failed, changeCount]);

  if (locked) return null;

  // Na een nieuwe wijziging is de vorige bevestiging niet meer actueel.
  const showConfirmed = confirmed && confirmed.atChange === changeCount && !failed;

  function handleClick() {
    clearFailed();
    setConfirmed(null);
    if (pending === 0) {
      setConfirmed({ at: new Date(), atChange: changeCount });
    } else {
      setWaiting(true);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleClick}
        disabled={waiting}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
          showConfirmed
            ? "bg-awning text-white"
            : "bg-ink text-paper hover:bg-awning"
        }`}
      >
        {waiting ? "Bezig met opslaan..." : showConfirmed ? "✓ Opgeslagen" : "Opslaan"}
      </button>
      {showConfirmed && (
        <p className="text-xs text-awning">
          Je beschikbaarheid is opgeslagen
          {confirmed
            ? ` (${confirmed.at.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })})`
            : ""}
          .
        </p>
      )}
      {failed && (
        <p className="max-w-[16rem] text-right text-xs text-red-600">
          Niet alles is opgeslagen. Klik de dag(en) waar het misging nog een keer aan en druk
          daarna weer op Opslaan.
        </p>
      )}
    </div>
  );
}
