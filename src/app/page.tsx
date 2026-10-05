import type { Metadata } from "next";
import Link from "next/link";
import ContactButton from "@/components/contact-button";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import ScheduleMock from "@/components/schedule-mock";
import HeroBoard from "@/components/marketing/hero-board";
import FeatureFlipCards from "@/components/marketing/feature-flip-cards";
import {
  PRICE_TIERS,
  MAX_STANDARD_MEMBERS,
  formatEuro,
  yearlyExclForTier,
} from "@/lib/pricing";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

export const metadata: Metadata = {
  // De titeltemplate van de layout geldt niet voor de pagina op hetzelfde
  // niveau (de homepage), dus " | Shiftje" staat hier zelf (samen 60 tekens).
  title: "Personeelsplanning voor lokale horeca, vaste prijs | Shiftje",
  description:
    "Personeelsplanning voor lokale horeca tot 40 medewerkers. Geen kosten per medewerker, wel beschikbaarheid, rooster, ruilen en uren. Probeer 7 dagen gratis.",
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
      "Personeelsplanning voor lokale horeca tot 40 medewerkers. Geen kosten per medewerker, wel beschikbaarheid, rooster, ruilen en uren. Probeer 7 dagen gratis.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Shiftje: personeelsplanning voor lokale horeca" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personeelsplanning voor lokale horeca, vaste prijs | Shiftje",
    description:
      "Personeelsplanning voor lokale horeca tot 40 medewerkers. Geen kosten per medewerker, wel beschikbaarheid, rooster, ruilen en uren. Probeer 7 dagen gratis.",
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
    "Planningstool voor lokale horeca (cafés, restaurants en bars tot 40 medewerkers): beschikbaarheid, personeelsplanning, diensten ruilen en urenregistratie op één plek. Eén vaste prijs per zaak, geen kosten per medewerker. 7 dagen gratis proberen.",
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
        text: "Shiftje is een Nederlandse rooster- en personeelsplanningapp voor lokale horecabedrijven, zoals cafés, restaurants en bars met tot 40 medewerkers. Beschikbaarheid, rooster, diensten ruilen en uren zitten allemaal in dezelfde app.",
      },
    },
    {
      "@type": "Question",
      name: "Voor wie is Shiftje gemaakt?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Voor lokale horecazaken tot 40 medewerkers: cafés, restaurants en bars. Eén team, één rooster, geen ingewikkelde configuratie vooraf.",
      },
    },
    {
      "@type": "Question",
      name: "Wat kost Shiftje?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Vanaf ${formatEuro(PRICE_TIERS[0].monthlyExcl)} per maand excl. btw voor 1–10 medewerkers, oplopend in staffels tot ${formatEuro(
          PRICE_TIERS[PRICE_TIERS.length - 1].monthlyExcl
        )} per maand voor 31–40 medewerkers. Je betaalt één vast bedrag per zaak, niet per gebruiker. Boven de 40 medewerkers reken je op maat.`,
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

// Aanvullende functies onder de kaarten. Alleen wat het product echt doet.
const MORE_FEATURES = [
  {
    title: "Open diensten",
    body: "Staat er een dienst open, dan zie je dat meteen in het rooster. Medewerkers kunnen hem zelf pakken, of jij wijst hem toe.",
  },
  {
    title: "Terugkerende diensten en sjablonen",
    body: "Staat iemand elke vrijdag op dezelfde dienst? Stel het één keer in, het rooster vult zich vooruit. Je vaste diensttijden bewaar je als sjabloon.",
  },
  {
    title: "Weer bij het rooster",
    body: "Naast het rooster zie je de weersverwachting voor jouw plaats, met een korte terrashint per dag. Geen voorspelling van drukte, wel een steuntje bij het inplannen.",
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

export default function HomePage() {
  const faqs = faqSchema.mainEntity;

  return (
    <main className="page-sage min-h-screen overflow-x-clip text-ink">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-6 pb-20 pt-10 md:pt-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <p className="self-start rounded-full bg-sand px-4 py-2 text-sm font-bold text-[#4A2A12]">
            Voor cafés, restaurants &amp; bars tot {MAX_STANDARD_MEMBERS} medewerkers
          </p>
          {/* "personeelsplanning" is één lang woord en mag niet worden afgebroken
              (geen hyphens/break-words): de tekstgrootte is per breedte
              afgestemd zodat het hele woord in de kolom past. */}
          <h1 className="font-display text-[1.75rem] font-bold leading-[1.04] min-[360px]:text-[1.9rem] tracking-tight sm:text-5xl md:text-6xl lg:text-[2.5rem] xl:text-[2.9rem]">
            De eenvoudige personeelsplanning voor lokale horeca
          </h1>
          {/* Eerste, citeerbare omschrijving: wat, voor wie, wat het kost. */}
          <p className="max-w-xl text-lg leading-relaxed text-ink/85">
            Shiftje is de planningstool voor lokale horeca: cafés, restaurants en bars tot{" "}
            {MAX_STANDARD_MEMBERS} medewerkers. Je team geeft beschikbaarheid door, jij maakt het
            rooster en ruilen en uren zitten in dezelfde app, voor één vaste prijs per zaak vanaf{" "}
            {formatEuro(PRICE_TIERS[0].monthlyExcl)} per maand excl. btw.
          </p>
          <p className="font-display text-xl font-semibold leading-snug text-terra md:text-2xl">
            Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.
          </p>
          <p className="max-w-xl text-lg leading-relaxed text-ink/75">
            Aan het eind van de week keur je de uren goed. Geen groepsapp vol foto&apos;s van een
            geprint rooster.
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-ink/60">
            Of je er nu een planningstool, roostertool, planningsprogramma of
            beschikbaarheidsprogramma voor gebruikt: dit is &apos;m.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="rounded-full bg-terra px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-terra-dark"
            >
              Begin gratis, 7 dagen
            </Link>
            <Link
              href="/signin"
              className="rounded-full bg-white px-7 py-3.5 text-base font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Ik ben uitgenodigd
            </Link>
          </div>
          <p className="text-sm text-ink/60">Geen creditcard nodig om te beginnen.</p>
        </div>

        <HeroBoard />
      </section>

      {/* De omslag */}
      <section className="bg-ink text-sage">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold leading-snug md:text-4xl">
            &ldquo;Wie kan vrijdag?&rdquo; in de groepsapp, een geel A4&apos;tje op het
            prikbord, en een spreadsheet die alleen jij begrijpt: dat wordt
            één plek waar iedereen naar kijkt.
          </p>
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="mx-auto max-w-6xl px-6 pb-12 pt-24">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Alles wat je nodig hebt, op één pagina
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/70">
            Of je nu een café, restaurant of bar runt: Shiftje vervangt de spreadsheet voor je rooster en
            de WhatsApp-groep voor alles daaromheen. Beschikbaarheid, personeelsplanning, ruilen en uren
            zitten allemaal in dezelfde app, zodat jij en je team maar op één plek hoeven te kijken.
          </p>
        </div>
        <div className="mt-10">
          <FeatureFlipCards />
        </div>

        <div className="mt-16">
          <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            En nog meer, zonder gedoe
          </h3>
          <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MORE_FEATURES.map((f) => (
              <li key={f.title} className="rounded-2xl bg-white p-6">
                <h4 className="font-display text-lg font-bold">{f.title}</h4>
                <p className="mt-2 leading-relaxed text-ink/70">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Probeer het zelf: de bestaande, klikbare demo */}
      <section id="demo" className="mx-auto max-w-4xl px-6 pb-20 pt-8">
        <div className="mb-6 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Probeer het zelf</h2>
          <p className="mt-2 text-ink/70">
            Klik op een dienst, pas de tijden aan of voeg er een toe. Zo werkt het ook in de app.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-3 shadow-[0_30px_50px_-30px_rgba(30,51,38,0.45)] md:p-5">
          <ScheduleMock />
        </div>
      </section>

      {/* Veelgestelde vragen */}
      <section id="faq" className="mx-auto max-w-3xl px-6 pb-20 pt-4">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Veelgestelde vragen</h2>
        <div className="mt-6 flex flex-col gap-2.5">
          {faqs.map((f) => (
            <details key={f.name} className="group rounded-2xl bg-white px-6 py-1.5">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 py-2 font-display text-lg font-bold">
                {f.name}
                <span aria-hidden className="text-xl text-terra transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-4 leading-relaxed text-ink/70">{f.acceptedAnswer.text}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Prijs */}
      <section id="prijs" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 rounded-[40px] bg-sand p-8 text-[#4A2A12] md:p-14 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-bold uppercase tracking-widest">Ons menu</p>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Eén prijs per zaak, op basis van de grootte van je team.
            </h2>
            <p className="text-lg leading-relaxed">
              Je betaalt een vast bedrag per maand, afhankelijk van hoeveel
              medewerkers je hebt. Geen kosten per gebruiker, en de prijs
              past zich vanzelf aan als je team groeit of krimpt.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-base">
              <li>Beschikbaarheid, rooster, teams, uren</li>
              <li>7 dagen gratis proberen</li>
              <li>Jaarlijks betalen? Je krijgt 2 maanden korting</li>
              <li>Maandelijks opzegbaar*</li>
            </ul>
          </div>

          <div className="min-w-0 rounded-3xl bg-white p-6 text-ink md:p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] sm:text-sm">
                <thead>
                  <tr className="border-b border-line text-xs font-bold text-ink/55">
                    <th className="px-2 py-3 font-bold sm:px-3">Medewerkers</th>
                    <th className="px-2 py-3 font-bold sm:px-3">Per maand</th>
                    <th className="px-2 py-3 font-bold sm:px-3">Per jaar (met korting)</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_TIERS.map((tier) => (
                    <tr key={tier.id} className="border-b border-line/70">
                      <td className="px-2 py-3.5 font-bold sm:px-3">{tier.label.replace(" medewerkers", "")}</td>
                      <td className="px-2 py-3.5 sm:px-3">{formatEuro(tier.monthlyExcl)}</td>
                      <td className="px-2 py-3.5 sm:px-3">
                        <span className="block text-ink/40 line-through sm:mr-2 sm:inline">
                          {formatEuro(tier.monthlyExcl * 12)}
                        </span>
                        <span className="font-bold">{formatEuro(yearlyExclForTier(tier))}</span>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-2 py-3.5 font-bold sm:px-3">Meer dan {MAX_STANDARD_MEMBERS}</td>
                    <td colSpan={2} className="px-2 py-3.5 sm:px-3">
                      Op maat
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink/60">
              Alle prijzen excl. btw. Kies je een jaarabonnement, dan betaal je 10 in plaats van 12 maanden.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">
              *Geldt voor het maandabonnement. Een jaarabonnement loopt een jaar.
            </p>
            <Link
              href="/onboarding"
              className="mt-5 block w-full rounded-full bg-terra px-5 py-3.5 text-center font-bold text-white transition-colors hover:bg-terra-dark"
            >
              Begin gratis
            </Link>
            <div className="mt-5 border-t border-line pt-4">
              <p className="font-bold">Meer dan {MAX_STANDARD_MEMBERS} medewerkers?</p>
              <p className="mt-1 text-sm text-ink/70">
                Neem contact met ons op, dan kijken we samen naar de
                mogelijkheden.
              </p>
              <ContactButton
                message={`Hoi! Ik heb meer dan ${MAX_STANDARD_MEMBERS} medewerkers en wil graag weten wat de mogelijkheden zijn.`}
                className="mt-3 rounded-full border-2 border-ink px-5 py-2 text-sm font-bold transition-colors hover:bg-ink hover:text-paper"
              >
                Neem contact op
              </ContactButton>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
