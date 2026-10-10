import type { MetadataRoute } from "next";
import { listArticles } from "@/lib/articles";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

// Alleen pagina's die in zoekresultaten horen te staan. Inlog-, registratie-
// en onboardingpagina's staan er bewust niet in (noindex). lastModified is een
// vaste datum: pas die aan wanneer de inhoud van de pagina echt wijzigt, anders
// is het een misleidend signaal voor zoekmachines. Voeg nieuwe pagina's hier toe
// zodra ze bestaan.
const routes = [
  { path: "/", lastModified: "2026-10-05", priority: 1, changeFrequency: "weekly" as const },
  { path: "/rooster-maken-cafe", lastModified: "2026-10-06", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/gids/rooster-maken-horeca", lastModified: "2026-10-08", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/rooster-oproepkrachten-horeca", lastModified: "2026-10-09", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/over-ons", lastModified: "2026-10-06", priority: 0.6, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Artikelen uit src/content/articles worden automatisch toegevoegd.
  const articleRoutes = listArticles().map((a) => ({
    path: `/artikel/${a.slug}`,
    lastModified: a.updated,
    priority: 0.6,
    changeFrequency: "monthly" as const,
  }));
  return [...routes, ...articleRoutes].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: new Date(r.lastModified),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
