import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

// Alleen pagina's die in zoekresultaten horen te staan. Inlog-, registratie-
// en onboardingpagina's staan er bewust niet in (noindex). lastModified is een
// vaste datum: pas die aan wanneer de inhoud van de pagina echt wijzigt, anders
// is het een misleidend signaal voor zoekmachines. Voeg nieuwe pagina's hier toe
// zodra ze bestaan.
const routes = [
  { path: "/", lastModified: "2026-10-05", priority: 1, changeFrequency: "weekly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(r.lastModified),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
