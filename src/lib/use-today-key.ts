"use client";

import { useEffect, useState } from "react";

/**
 * "Vandaag" als Date.toDateString()-sleutel, pas ingevuld nadat de pagina in
 * de browser staat. Bewust niet tijdens de server-render bepaald: de server
 * kan in een andere tijdzone draaien dan de bezoeker, en dan klopt "vandaag"
 * rond middernacht niet (en geeft React een hydratie-waarschuwing).
 */
export function useTodayKey(): string | null {
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    setKey(new Date().toDateString());
  }, []);
  return key;
}
