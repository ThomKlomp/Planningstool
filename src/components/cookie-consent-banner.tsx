"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const COOKIE_NAME = "shiftje_consent";
const MAX_AGE_DAYS = 365; // ~12 maanden, gangbare periode om toestemming opnieuw te vragen

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, days: number) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${days * 24 * 60 * 60}; path=/; SameSite=Lax${secure}`;
}

/**
 * Toestemmingsbanner voor de (privacy-vriendelijke, cookie-loze) statistieken.
 * Zolang er geen keuze is gemaakt, wordt er niets bijgehouden: zie
 * PageViewTracker, die pas een bezoek logt na "shiftje:consent-changed" met
 * accepted: true, of als de cookie al op "accepted" staat.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readCookie(COOKIE_NAME) === null);
  }, []);

  function choose(accepted: boolean) {
    writeCookie(COOKIE_NAME, accepted ? "accepted" : "declined", MAX_AGE_DAYS);
    setVisible(false);
    window.dispatchEvent(new CustomEvent("shiftje:consent-changed", { detail: { accepted } }));
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-white px-4 py-4 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink/70">
          We houden geanonimiseerde bezoekstatistieken bij (welke pagina, waar je vandaan komt, uit
          welk land) om te zien hoe Shiftje gevonden wordt. Je IP-adres wordt niet opgeslagen, en er
          wordt niets op je apparaat bewaard om dit te meten.{" "}
          <Link href="/privacy" className="text-awning hover:underline">
            Meer info
          </Link>
          . Liever niet? Klik op Weigeren.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose(false)}
            className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink"
          >
            Weigeren
          </button>
          <button
            onClick={() => choose(true)}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-awning"
          >
            Oké, begrepen
          </button>
        </div>
      </div>
    </div>
  );
}
