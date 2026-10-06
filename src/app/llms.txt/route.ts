import { PRICE_TIERS, formatEuro } from "@/lib/pricing";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

// Korte, feitelijke beschrijving voor AI-systemen (https://llmstxt.org).
// Houd dit gelijk aan de homepage; alleen wat het product echt doet.
export function GET() {
  const prices = PRICE_TIERS.map((t) => `${formatEuro(t.monthlyExcl)} (${t.label})`).join(", ");

  const body = `# Shiftje

> Shiftje is een planningstool (roostersoftware) voor lokale horeca: cafés, restaurants en bars tot 40 medewerkers. Medewerkers geven beschikbaarheid door, eigenaar of manager maakt het rooster, en diensten ruilen en uren goedkeuren zitten in dezelfde webapp. Eén vaste prijs per zaak, geen kosten per medewerker. 7 dagen gratis proberen, zonder creditcard.

## Pagina's
- [Homepage](${SITE_URL}/): wat Shiftje is, functies en prijzen
- [Prijzen](${SITE_URL}/#prijs): per maand excl. btw: ${prices}
- [Veelgestelde vragen](${SITE_URL}/#faq)

## Functies
Beschikbaarheid doorgeven, rooster maken, teams, open diensten, diensten ruilen en overnemen, terugkerende diensten, dienstsjablonen, uren registreren en goedkeuren, notificaties, rooster in je agenda, weersverwachting bij het rooster, rooster mailen en downloaden (PDF, CSV), uren exporteren, verschillende gebruikersrechten, chatondersteuning.

## Bedrijf
Shiftje, KvK 95993509. Taal: Nederlands.
`;

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
