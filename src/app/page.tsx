import type { Metadata } from "next";
import LandingPage from "@/components/marketing/landing-page";
import { PRICE_TIERS, formatEuro } from "@/lib/pricing";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

export const metadata: Metadata = {
  // De titeltemplate van de layout geldt niet voor de pagina op hetzelfde
  // niveau (de homepage), dus " | Shiftje" staat hier zelf (samen 60 tekens).
  title: "Personeelsplanning voor lokale horeca, vaste prijs | Shiftje",
  description:
    "Personeelsplanning voor lokale horeca. Geen kosten per medewerker, wel beschikbaarheid, rooster, ruilen en uren. Probeer 7 dagen gratis.",
  alternates: { canonical: "/" },
  // Staat hier en niet in de layout: canonical en og:url zouden anders door
  // alle andere pagina's worden geërfd en naar de homepage wijzen. Een
  // openGraph in een pagina vervangt die van de layout als geheel, dus de
  // overige velden staan hier opnieuw.
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Shiftje",
    url: "/",
    title: "Personeelsplanning voor lokale horeca, vaste prijs | Shiftje",
    description:
      "Personeelsplanning voor lokale horeca. Geen kosten per medewerker, wel beschikbaarheid, rooster, ruilen en uren. Probeer 7 dagen gratis.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Shiftje: personeelsplanning voor lokale horeca" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personeelsplanning voor lokale horeca, vaste prijs | Shiftje",
    description:
      "Personeelsplanning voor lokale horeca. Geen kosten per medewerker, wel beschikbaarheid, rooster, ruilen en uren. Probeer 7 dagen gratis.",
    images: ["/api/og"],
  },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shiftje",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Personeelsplanning / roostersoftware",
  // Shiftje is een webapp; er zijn geen native iOS- of Android-apps.
  operatingSystem: "Web",
  inLanguage: "nl-NL",
  description:
    "Planningstool voor lokale horeca (cafés, restaurants en bars): beschikbaarheid, personeelsplanning, diensten ruilen en urenregistratie op één plek. Eén vaste prijs per zaak, geen kosten per medewerker. 7 dagen gratis proberen.",
  // Alleen functies die echt in het product zitten.
  featureList: [
    "Beschikbaarheid doorgeven",
    "Personeelsplanning en rooster maken",
    "Teams",
    "Open diensten",
    "Diensten ruilen en overnemen",
    "Terugkerende diensten",
    "Dienstsjablonen",
    "Urenregistratie en uren goedkeuren",
    "Notificaties",
    "Rooster synchroniseren met je agenda",
    "Weersverwachting bij het rooster",
    "Rooster mailen naar je team",
    "Rooster downloaden als PDF en CSV",
    "Uren exporteren",
    "Verschillende gebruikersrechten",
    "Chatondersteuning",
  ],
  provider: { "@id": `${SITE_URL}/#organization` },
  // Eén aanbod per staffel: vaste prijs per zaak per maand, excl. btw.
  offers: PRICE_TIERS.map((tier) => ({
    "@type": "Offer",
    name: `Shiftje ${tier.label}, per zaak per maand`,
    price: tier.monthlyExcl.toFixed(2),
    priceCurrency: "EUR",
    // Google accepteert hier PriceSpecification (UnitPriceSpecification gaf een
    // waarschuwing). "Per maand, per zaak" staat daarom in de naam.
    priceSpecification: {
      "@type": "PriceSpecification",
      price: tier.monthlyExcl.toFixed(2),
      priceCurrency: "EUR",
      valueAddedTaxIncluded: false,
    },
    url: `${SITE_URL}/#prijs`,
  })),
  // Geen aggregateRating: we voegen die pas toe zodra er échte, verifieerbare
  // reviews zijn. Verzonnen sterren in structured data schendt Google's
  // richtlijnen en kan tot een handmatige actie leiden.
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Wat is Shiftje?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Shiftje is een Nederlandse rooster- en personeelsplanningapp voor lokale horecabedrijven, zoals cafés, restaurants en bars. Beschikbaarheid, rooster, diensten ruilen en uren zitten allemaal in dezelfde app.",
      },
    },
    {
      "@type": "Question",
      name: "Voor wie is Shiftje gemaakt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Voor lokale horecazaken: cafés, restaurants en bars. Eén team, één rooster, geen ingewikkelde configuratie vooraf.",
      },
    },
    {
      "@type": "Question",
      name: "Wat kost Shiftje?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Vanaf ${formatEuro(PRICE_TIERS[0].monthlyExcl)} per maand excl. btw voor 1–10 medewerkers; de prijs loopt op met de grootte van je team. Je betaalt één vast bedrag per zaak, niet per gebruiker. Heb je een groter team, dan maken we een prijs op maat.`,
      },
    },
    {
      "@type": "Question",
      name: "Kan ik maandelijks opzeggen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, met een maandabonnement kun je elke maand opzeggen. Kies je een jaarabonnement (2 maanden korting), dan loopt dat een jaar.",
      },
    },
    {
      "@type": "Question",
      name: "Kan ik Shiftje eerst gratis proberen?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja, je kunt 7 dagen gratis beginnen zonder creditcard.",
      },
    },
    {
      "@type": "Question",
      name: "Werkt Shiftje ook voor een restaurant met keuken én bediening?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Ja. Je deelt medewerkers in bij teams zoals bediening en keuken, en plant lunch- en dinerdiensten los van elkaar in.",
      },
    },
    {
      "@type": "Question",
      name: "Wat gebeurt er als iemand een dienst niet kan werken?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Die biedt de dienst aan het team aan. Een collega neemt 'm over of ruilt, en jij ziet het meteen terug in het rooster.",
      },
    },
    {
      "@type": "Question",
      name: "Is Shiftje een planningstool, roostertool of beschikbaarheidsprogramma?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Eigenlijk alle drie tegelijk. Shiftje combineert beschikbaarheid doorgeven, een rooster maken en uren goedkeuren in één programma, zodat je niet drie losse tools nodig hebt.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <LandingPage
      content={{
        eyebrow: "Voor cafés, restaurants & bars",
        h1: "De eenvoudige personeelsplanning voor lokale horeca",
        definition: (
          <>
            Shiftje is de planningstool voor lokale horeca: cafés, restaurants en bars. Je team geeft beschikbaarheid door, jij maakt het
            rooster en ruilen en uren zitten in dezelfde app, voor één vaste prijs per zaak vanaf{" "}
            {formatEuro(PRICE_TIERS[0].monthlyExcl)} per maand excl. btw.
          </>
        ),
        tagline: "Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.",
        body: "Aan het eind van de week keur je de uren goed. Geen groepsapp vol foto's van een geprint rooster.",
        synonyms:
          "Of je er nu een planningstool, roostertool, planningsprogramma of beschikbaarheidsprogramma voor gebruikt: dit is 'm.",
        heroTrack: "cta-hero",
        prijsTrack: "cta-prijs",
        quote:
          "\u201cWie kan vrijdag?\u201d in de groepsapp, een geel A4'tje op het prikbord, en een spreadsheet die alleen jij begrijpt: dat wordt één plek waar iedereen naar kijkt.",
        functiesHeading: "Alles wat je nodig hebt, op één pagina",
        functiesIntro:
          "Of je nu een café, restaurant of bar runt: Shiftje vervangt de spreadsheet voor je rooster en de WhatsApp-groep voor alles daaromheen. Beschikbaarheid, personeelsplanning, ruilen en uren zitten allemaal in dezelfde app, zodat jij en je team maar op één plek hoeven te kijken.",
        faqs: faqSchema.mainEntity.map((f) => ({ name: f.name, answer: f.acceptedAnswer.text })),
        schemas: [softwareApplicationSchema, faqSchema],
      }}
    />
  );
}
