"use client";

import { useEffect, useState } from "react";

/** "47 uur en 12 minuten" / "12 minuten" / "op het punt van blokkeren" */
function describeRemaining(ms: number) {
  if (ms <= 0) return null;
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} ${minutes === 1 ? "minuut" : "minuten"}`;
  if (minutes === 0) return `${hours} ${hours === 1 ? "uur" : "uur"}`;
  return `${hours} uur en ${minutes} ${minutes === 1 ? "minuut" : "minuten"}`;
}

/**
 * Live aftellende melding, de laatste 48 uur voor het einde van een opgezegd
 * abonnement. Telt echt af (elke minuut bijgewerkt) i.p.v. een vaste tekst
 * die pas klopt na een paginaherlading.
 */
export default function CancellationCountdown({
  periodEndIso,
  canManage,
}: {
  periodEndIso: string;
  canManage: boolean;
}) {
  const target = new Date(periodEndIso).getTime();
  const [remaining, setRemaining] = useState(() => target - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(target - Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [target]);

  const label = describeRemaining(remaining);
  if (!label) return null; // voorbij: de pagina zelf blokkeert dan al

  return (
    <div className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 sm:px-8">
      Je abonnement is opgezegd. Toegang wordt over <strong>{label}</strong> geblokkeerd.
      {canManage && (
        <>
          {" "}
          <a href="/dashboard/settings/billing" className="underline hover:no-underline">
            Kies alsnog een abonnement
          </a>
        </>
      )}
    </div>
  );
}
