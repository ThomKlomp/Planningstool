import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Privacy & bezoekstatistieken",
  description: "Welke gegevens Shiftje vastlegt wanneer je de website bezoekt.",
  alternates: { canonical: "/privacy" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl">Privacy &amp; bezoekstatistieken</h1>
        <p className="mt-4 text-ink/70">
          Deze pagina legt specifiek uit wat we vastleggen wanneer je de website van Shiftje bezoekt.
          Voor hoe we omgaan met gegevens van medewerkers en zaken die Shiftje gebruiken, verwijzen we
          naar onze volledige privacyverklaring.
        </p>

        <h2 className="mt-8 font-display text-xl">Bezoekstatistieken</h2>
        <p className="mt-3 text-ink/70">
          Van elk bezoek aan de website leggen we standaard vast:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/70">
          <li>Welke pagina je bezocht (bijvoorbeeld de homepage of de inlogpagina)</li>
          <li>Vanaf welke website of zoekmachine je kwam (alleen de domeinnaam, niet de volledige link)</li>
          <li>Of je op dat moment al bent ingelogd bij een zaak, en zo ja: bij welke</li>
          <li>Tijdstip van bezoek</li>
        </ul>
        <p className="mt-3 text-ink/70">
          Dit gebeurt zonder dat we iets op jouw apparaat opslaan (geen cookie, geen lokale opslag), dus
          er is voor déze meting geen voorafgaande toestemming nodig. Wil je liever niet dat we dit
          meten? Klik dan op "Weigeren" bij de melding onderaan de pagina — dat stopt het direct voor
          jou.
        </p>

        <h2 className="mt-8 font-display text-xl">Wat we niet vastleggen</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/70">
          <li>Geen IP-adres</li>
          <li>Geen locatiegegevens</li>
          <li>Geen advertentie- of trackingcookies van derden</li>
        </ul>
        <p className="mt-3 text-ink/70">
          Er wordt geen bezoekersprofiel opgebouwd over meerdere bezoeken heen: elk bezoek is een los
          gegeven, niet gekoppeld aan een blijvend "bezoeker"-ID.
        </p>

        <h2 className="mt-8 font-display text-xl">Cookies</h2>
        <p className="mt-3 text-ink/70">
          We plaatsen één cookie (<code className="rounded bg-line px-1">shiftje_consent</code>) die
          onthoudt of je de melding hierboven al hebt gezien en, als je op "Weigeren" klikte, dat we niet
          moeten meten. Deze cookie is maximaal 12 maanden geldig en bevat verder niets.
        </p>
        <p className="mt-3 text-ink/70">
          Log je in op Shiftje, dan gebruiken we daarnaast een technisch noodzakelijke cookie om je
          ingelogd te houden. Daar is geen aparte toestemming voor nodig, omdat je daar zelf uitdrukkelijk
          om vraagt door in te loggen.
        </p>

        <h2 className="mt-8 font-display text-xl">Vragen</h2>
        <p className="mt-3 text-ink/70">
          Vragen over deze pagina of over hoe Shiftje met gegevens omgaat? Neem contact met ons op via het
          chat-bolletje rechtsonder.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
