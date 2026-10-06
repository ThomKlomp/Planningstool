import type { Metadata } from "next";
import Link from "next/link";
import LandingPage, { type LandingFaq } from "@/components/marketing/landing-page";
import { PRICE_TIERS, MAX_STANDARD_MEMBERS, formatEuro } from "@/lib/pricing";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";
const PATH = "/rooster-maken-cafe";

const TITLE = "Rooster maken voor je café, kroeg of bar";
const DESCRIPTION =
  "Rooster maken voor café, kroeg, eetcafé of bar? Beschikbaarheid, rooster, ruilen en uren op één plek. Eén vaste prijs per zaak. 7 dagen gratis.";
const OG_IMAGE = "/api/og?eyebrow=Shiftje%20voor%20caf%C3%A9s%20en%20bars&title=Rooster%20maken%20voor%20je%20caf%C3%A9%2C%20kroeg%20of%20bar";

// Pas deze datum aan wanneer de inhoud van de pagina echt wijzigt.
const LAST_UPDATED = "2026-10-06";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  // Een openGraph/twitter in een pagina vervangt die van de layout als geheel,
  // dus de overige velden staan hier opnieuw.
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Shiftje",
    url: PATH,
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const firstTier = PRICE_TIERS[0];

// Alleen wat het product echt doet. Controleer nieuwe claims tegen de code.
const FAQS: LandingFaq[] = [
  {
    name: "Kan ik studenten en bijbaners inplannen?",
    answer:
      "Ja. Iedereen die meewerkt zet je in het rooster. Je nodigt medewerkers uit met een uitnodiging of de link van je zaak.",
  },
  {
    name: "Werkt Shiftje voor een café met een terras?",
    answer:
      "Ja. Naast het rooster zie je de weersverwachting voor jouw plaats, met een korte terrashint per dag. Het is een hulpmiddel bij het inplannen, geen voorspelling van drukte.",
  },
  {
    name: "Werkt Shiftje ook voor een eetcafé of een restaurant met bar?",
    answer:
      "Ja. Je deelt medewerkers in bij teams zoals bar, bediening en keuken, en plant ze samen in één rooster. Elk team heeft een eigen kleur.",
  },
  {
    name: "Kan ik diensten tot na middernacht plannen?",
    answer:
      "Ja. Een dienst mag tot in de nacht doorlopen, bijvoorbeeld van 17:00 tot 01:00. De gewerkte uren worden dan gewoon goed berekend.",
  },
  {
    name: "Kan ik een vaste dienst instellen, bijvoorbeeld elke vrijdag?",
    answer:
      "Ja. Met terugkerende diensten stel je een vast patroon één keer in en vult het rooster zich vooruit. Je vaste diensttijden bewaar je als sjabloon.",
  },
  {
    name: "Wat als mijn café een dag dicht is?",
    answer:
      "Je stelt vaste sluitingsdagen in, bijvoorbeeld elke maandag, of een losse dag. Medewerkers zien dat meteen bij het doorgeven van hun beschikbaarheid.",
  },
  {
    name: "Wat kost Shiftje voor een café?",
    answer: `Eén vast bedrag per zaak, op basis van het aantal medewerkers. Het begint bij ${formatEuro(
      firstTier.monthlyExcl
    )} per maand excl. btw voor 1 tot 10 medewerkers. De andere staffels staan in het prijsblok hieronder. Het bedrag geldt voor de hele zaak, niet per medewerker.`,
  },
];

const MORE_FEATURES = [
  {
    title: "Open diensten",
    body: "Staat er een dienst open, dan zie je dat meteen in het rooster. Medewerkers kunnen hem zelf pakken, of jij wijst hem toe.",
  },
  {
    title: "Vaste diensten",
    body: "Staat dezelfde barkracht elke vrijdag? Stel het één keer in, het rooster vult zich vooruit. Je vaste diensttijden bewaar je als sjabloon.",
  },
  {
    title: "Sluitingsdagen",
    body: "Elke maandag dicht, of een losse dag? Stel je sluitingsdagen in, dan zien medewerkers ze meteen bij het doorgeven van beschikbaarheid.",
  },
  {
    title: "Terrasweer",
    body: "Naast het rooster zie je de weersverwachting voor jouw plaats, met een korte terrashint per dag. Een steuntje bij het inplannen, geen voorspelling van drukte.",
  },
  {
    title: "Tot na middernacht",
    body: "Eindigt een dienst na 00:00? De gewerkte uren worden dan gewoon goed berekend.",
  },
  {
    title: "Bar en keuken samen",
    body: "Een eetcafé, een grand café, een restaurant met bar: je plant bar, bediening en keuken samen in één rooster, elk team in een eigen kleur.",
  },
  {
    title: "Rooster in je agenda",
    body: "Via een agenda-koppeling zien medewerkers hun diensten in de agenda die ze al gebruiken.",
  },
  {
    title: "Rooster delen",
    body: "Publiceer het rooster en mail het naar je team. Of download het als PDF of CSV.",
  },
  {
    title: "Uren exporteren",
    body: "Een export van de goedgekeurde uren per periode, voor in je eigen administratie.",
  },
  {
    title: "Verschillende rechten",
    body: "Eigenaar en manager plannen en keuren goed. Medewerkers geven beschikbaarheid door en vullen hun eigen uren in.",
  },
  {
    title: "Meldingen",
    body: "Je krijgt een melding in de app en per e-mail, bijvoorbeeld bij opengestelde diensten of een verzoek dat op goedkeuring wacht.",
  },
  {
    title: "Chat",
    body: "Een vraag? Stuur ons een bericht in de chat.",
  },
];

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}${PATH}#webpage`,
  url: `${SITE_URL}${PATH}`,
  name: TITLE,
  description: DESCRIPTION,
  inLanguage: "nl-NL",
  dateModified: LAST_UPDATED,
  isPartOf: { "@id": `${SITE_URL}/#website` },
  about: { "@id": `${SITE_URL}/#organization` },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.name,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Shiftje", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: TITLE, item: `${SITE_URL}${PATH}` },
  ],
};

// Zelfde opmaak als de homepage; alleen de teksten zijn op cafés, kroegen,
// eetcafés en bars afgestemd.
export default function RoosterMakenCafePage() {
  return (
    <LandingPage
      content={{
        venue: "cafe",
        eyebrow: `Voor cafés, kroegen, eetcafés & bars tot ${MAX_STANDARD_MEMBERS} medewerkers`,
        h1: TITLE,
        definition: (
          <>
            Shiftje is een rooster-app voor cafés, kroegen, eetcafés en bars tot {MAX_STANDARD_MEMBERS}{" "}
            medewerkers. Je team geeft beschikbaarheid door, jij maakt het rooster en ruilen en uren
            zitten in dezelfde app, voor één vaste prijs per zaak vanaf {formatEuro(firstTier.monthlyExcl)}{" "}
            per maand excl. btw.
          </>
        ),
        tagline: "Wie staat er vrijdagavond achter de bar? Dat weet je nu in één oogopslag.",
        body: "Aan het eind van de week keur je de uren goed. Geen groepsapp vol foto's van een geprint rooster.",
        synonyms: "Of je het nu een rooster-app, roostertool of planningstool voor je café noemt: dit is 'm.",
        heroTrack: "cta-cafe-hero",
        prijsTrack: "cta-cafe-prijs",
        quote:
          "\u201cWie kan zaterdag?\u201d in de groepsapp, een geel A4'tje achter de bar, en een spreadsheet die alleen jij begrijpt: dat wordt één plek waar iedereen naar kijkt.",
        functiesHeading: "Alles wat je café nodig heeft, op één pagina",
        functiesIntro:
          "Of je nu een café, kroeg, eetcafé of bar runt: Shiftje vervangt de spreadsheet voor je rooster en de WhatsApp-groep voor alles daaromheen. Beschikbaarheid, rooster, ruilen en uren zitten allemaal in dezelfde app, zodat jij en je team maar op één plek hoeven te kijken.",
        cardBodies: {
          Beschikbaarheid:
            "Medewerkers geven per dag of per shift aan of ze kunnen, net zo simpel als een datumprikker. Handig voor de weekendavonden en als je team wisselt met studenten en bijbaners: jij zet weken vooraf open, zodat er nooit een gat valt.",
          Teams:
            "Deel medewerkers in bij bar, bediening of keuken. Handig voor een eetcafé of een restaurant met bar: op het rooster zie je in één oogopslag wie waar hoort.",
        },
        moreFeatures: MORE_FEATURES,
        faqs: FAQS,
        footerNote: (
          <>
            Gemaakt door{" "}
            <Link href="/over-ons" className="underline hover:text-ink">
              Thom en Daniel
            </Link>
            . Laatst bijgewerkt: <time dateTime={LAST_UPDATED}>6 oktober 2026</time>
          </>
        ),
        schemas: [webPageSchema, faqSchema, breadcrumbSchema],
      }}
    />
  );
}
