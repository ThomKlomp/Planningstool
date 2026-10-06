import type { Metadata } from "next";
import Link from "next/link";
import ContactButton from "@/components/contact-button";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

const TITLE = "Over Shiftje: gemaakt door Thom en Daniel";
const DESCRIPTION =
  "Shiftje is gemaakt door Thom en Daniel, twee ondernemers met horeca-ervaring. Lees waarom we een eenvoudige planningstool voor lokale horeca bouwden.";

// Pas deze datum aan wanneer de inhoud van de pagina echt wijzigt.
const LAST_UPDATED = "2026-10-06";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/over-ons" },
  // Een openGraph/twitter in een pagina vervangt die van de layout als geheel,
  // dus de overige velden staan hier opnieuw.
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Shiftje",
    url: "/over-ons",
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    images: [
      {
        url: "/api/og?eyebrow=Over%20Shiftje&title=Wie%20zit%20er%20achter%20Shiftje",
        width: 1200,
        height: 630,
        alt: "Over Shiftje: gemaakt door Thom en Daniel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    images: ["/api/og?eyebrow=Over%20Shiftje&title=Wie%20zit%20er%20achter%20Shiftje"],
  },
};

const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${SITE_URL}/over-ons#webpage`,
  url: `${SITE_URL}/over-ons`,
  name: TITLE,
  description: DESCRIPTION,
  inLanguage: "nl-NL",
  dateModified: LAST_UPDATED,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
};

export default function OverOnsPage() {
  return (
    <main className="page-sage min-h-screen text-ink">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />
      <SiteHeader />

      <article className="mx-auto max-w-2xl px-6 pb-20 pt-12 md:pt-16">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Wie zit er achter Shiftje
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink/85">
          Shiftje is een planningstool voor lokale horeca, gemaakt door Thom en Daniel. Beschikbaarheid,
          rooster, ruilen en uren zitten in één app, voor één vaste prijs per zaak.
        </p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Waarom Shiftje bestaat
            </h2>
            <p className="mt-3 leading-relaxed text-ink/75">
              Achter Shiftje staan Thom en Daniel, twee jonge ondernemers die allebei zelf in de horeca
              hebben gewerkt. Tijdens onze bijbanen zagen we hoeveel gedoe er soms komt kijken bij het
              plannen van medewerkers. Lijstjes, WhatsApp-berichten, Excel en uren die achteraf nog
              allemaal verwerkt moeten worden. We merkten dat ondernemers hier iedere week opnieuw veel
              tijd aan kwijt waren en vroegen ons af: kan dit niet gewoon makkelijker?
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Hoe we begonnen
            </h2>
            <p className="mt-3 leading-relaxed text-ink/75">
              We hadden geen IT-achtergrond en wisten eerlijk gezegd in het begin ook niet precies hoe we
              dit moesten aanpakken. Toch zijn we ons erin gaan verdiepen, hebben we onszelf veel
              aangeleerd en zijn we begonnen met het bouwen van Shiftje. Vanuit een praktisch probleem
              dat we zelf hadden gezien, wilden we iets maken waar een lokale horecaondernemer écht iets
              aan heeft.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Waar we voor staan
            </h2>
            <p className="mt-3 leading-relaxed text-ink/75">
              Voor ons draait Shiftje daarom niet om zoveel mogelijk functies. We willen vooral dat een
              ondernemer zijn planning snel en eenvoudig geregeld heeft, zonder ingewikkelde systemen of
              onnodige administratie. Gewoon één overzichtelijke plek voor de personeelsplanning.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Spreek ons gewoon aan
            </h2>
            <p className="mt-3 leading-relaxed text-ink/75">
              We werken graag persoonlijk. Je kunt ons gewoon aanspreken, ook via de chat. Wat je bij ons
              neerlegt, nemen we serieus.
            </p>
            <ContactButton
              message="Hoi! Ik heb een vraag over Shiftje."
              className="mt-4 rounded-full border-2 border-ink px-5 py-2 text-sm font-bold transition-colors hover:bg-ink hover:text-paper"
            >
              Stuur ons een bericht
            </ContactButton>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Bedrijfsgegevens
            </h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-ink/75">
              <dt className="font-bold text-ink">Naam</dt>
              <dd>Shiftje</dd>
              <dt className="font-bold text-ink">KvK-nummer</dt>
              <dd>95993509</dd>
              <dt className="font-bold text-ink">Contact</dt>
              <dd>Via de chat op deze site</dd>
            </dl>
          </section>
        </div>

        <div className="mt-12 rounded-3xl bg-sand p-6 text-[#4A2A12] md:p-8">
          <p className="font-display text-xl font-bold md:text-2xl">Zelf proberen?</p>
          <p className="mt-2">Zeven dagen gratis, zonder creditcard.</p>
          <Link
            href="/onboarding"
            data-track="cta-over-ons"
            className="mt-4 inline-block rounded-full bg-terra px-6 py-3 font-bold text-white transition-colors hover:bg-terra-dark"
          >
            Begin gratis
          </Link>
        </div>

        <p className="mt-8 text-sm text-ink/50">
          Laatst bijgewerkt: <time dateTime={LAST_UPDATED}>6 oktober 2026</time>
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
