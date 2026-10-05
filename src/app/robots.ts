import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

// Ingelogde omgeving en interne routes horen niet in de zoekresultaten.
// Inlog-, registratie- en onboardingpagina's staan hier bewust NIET in: die
// hebben een noindex-tag, en die kan een bot alleen lezen als hij de pagina
// mag ophalen.
const DISALLOW = ["/dashboard", "/admin", "/api", "/invite", "/join", "/demo-switch"];

// De OG-afbeelding staat onder /api, maar moet wel opgehaald kunnen worden.
// Bij Google wint de specifiekste (langste) regel.
const ALLOW = ["/", "/api/og"];

// AI-bots die we expliciet toestaan. Een bot met een eigen blok volgt het
// "*"-blok niet meer, dus elke bot krijgt dezelfde regels.
// Let op: robots.txt is een verzoek, geen afdwingbare toegangscontrole.
const AI_BOTS = [
  // OpenAI
  "OAI-SearchBot", // zoekindex van ChatGPT (bronvermelding in antwoorden)
  "ChatGPT-User", // haalt een pagina op wanneer een ChatGPT-gebruiker erom vraagt
  "GPTBot", // crawler voor het trainen van OpenAI-modellen
  // Perplexity
  "PerplexityBot", // zoekindex van Perplexity
  "Perplexity-User", // ophalen op verzoek van een Perplexity-gebruiker
  // Anthropic
  "Claude-SearchBot", // zoekkwaliteit van Claude
  "Claude-User", // ophalen op verzoek van een Claude-gebruiker
  "ClaudeBot", // crawler voor het trainen van Anthropic-modellen
  // Google: geen aparte crawler maar een schakelaar. Toestaan betekent dat
  // Google de inhoud mag gebruiken voor Gemini; gewone zoekindexering staat
  // hier los van (Googlebot).
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: ALLOW, disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
