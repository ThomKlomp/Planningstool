"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const COOKIE_NAME = "shiftje_consent";

function hasDeclined(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_NAME}=declined`);
}

/**
 * Meldt één keer per paginabezoek het pad, de referrer en eventuele
 * UTM-parameters bij /api/track-visit. Dit gebeurt standaard, zonder dat de
 * bezoeker iets met de cookiebanner hoeft te doen: er wordt voor deze meting
 * zelf niets op het apparaat van de bezoeker opgeslagen (zie CookieConsentBanner
 * en /privacy), dus vooraf toestemming vragen is hier niet verplicht. Klikt
 * iemand wel op "Weigeren", dan stopt het meten voor die bezoeker meteen en
 * blijvend (tot de cookie verloopt of wordt gewist). Draait alleen in de
 * browser (bots die geen JS uitvoeren worden dus niet meegeteld). Faalt
 * geruisloos.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function track() {
    if (
      !pathname ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/api")
    ) {
      return;
    }
    if (hasDeclined()) return;

    const payload = {
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer : "",
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
    };
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  useEffect(() => {
    track();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
