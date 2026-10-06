import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { PRICE_TIERS, formatEuro } from "@/lib/pricing";

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
const FAQS = [
  {
    q: "Kan ik studenten en bijbaners inplannen?",
    a: "Ja. Iedereen die meewerkt zet je in het rooster. Je nodigt medewerkers uit met een uitnodiging of de link van je zaak. Shiftje houdt geen contracten bij.",
  },
  {
    q: "Werkt Shiftje voor een café met een terras?",
    a: "Ja. Naast het rooster zie je de weersverwachting voor jouw plaats, met een korte terrashint per dag. Het is een hulpmiddel bij het inplannen, geen voorspelling van drukte.",
  },
  {
    q: "Wat als iemand een dienst niet kan werken?",
    a: "Die biedt de dienst aan het team aan. Een collega neemt hem over of ruilt, en jij ziet het meteen terug in het rooster. Wil je de ruil eerst zelf goedkeuren, dan kan dat.",
  },
  {
    q: "Wat kost Shiftje voor een café?",
    a: `Eén vast bedrag per zaak, op basis van het aantal medewerkers. Met 1 tot 10 medewerkers is dat ${formatEuro(
      firstTier.monthlyExcl
    )} per maand excl. btw. Het bedrag geldt voor de hele zaak, niet per medewerker.`,
  },
  {
    q: "Kan ik Shiftje eerst proberen?",
    a: "Ja, je kunt 7 dagen gratis beginnen zonder creditcard.",
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
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
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

const H2 = "font-display text-2xl font-bold tracking-tight md:text-3xl";

export default function RoosterMakenCafePage() {
  return (
    <main className="page-sage min-h-screen text-ink">
      {[webPageSchema, faqSchema, breadcrumbSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <SiteHeader />

      <article className="mx-auto max-w-2xl px-6 pb-20 pt-10 md:pt-14">
        <nav aria-label="Kruimelpad" className="text-sm text-ink/55">
          <Link href="/" className="hover:text-ink">
            Shiftje
          </Link>{" "}
          <span aria-hidden="true">›</span> <span>Rooster maken voor je café</span>
        </nav>

        <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {TITLE}
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink/85">
          Shiftje is een rooster-app voor cafés, kroegen, eetcafés en bars tot 40 medewerkers. Je team
          geeft beschikbaarheid door, jij maakt het rooster, en ruilen en uren zitten in dezelfde app.
          Eén vaste prijs per zaak: {formatEuro(firstTier.monthlyExcl)} per maand excl. btw voor 1 tot
          10 medewerkers.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/onboarding"
            data-track="cta-cafe"
            className="rounded-full bg-terra px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-terra-dark"
          >
            Begin gratis, 7 dagen
          </Link>
          <span className="text-sm text-ink/60">Geen creditcard nodig.</span>
        </div>

        <div className="mt-12 space-y-12">
          <section>
            <h2 className={H2}>Wat een rooster in een café lastig maakt</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-ink/75">
              <li>De weekendavonden moeten bemand zijn, en iedereen wil weleens vrij.</li>
              <li>Je team wisselt: studenten, bijbaners en invallers komen en gaan.</li>
              <li>&ldquo;Wie kan vrijdag?&rdquo; in de groepsapp, met antwoorden die tussen de foto&apos;s verdwijnen.</li>
              <li>Een dienst ruilen gaat via drie appjes en komt pas daarna bij jou terecht.</li>
              <li>Aan het eind van de week zoek je de gewerkte uren bij elkaar.</li>
            </ul>
          </section>

          <section>
            <h2 className={H2}>Zo regel je het rooster in Shiftje</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-ink/75">
              <li>
                <strong className="text-ink">Beschikbaarheid doorgeven.</strong> Medewerkers geven per dag
                of per shift aan of ze kunnen, net zo simpel als een datumprikker. Jij zet weken vooraf
                open.
              </li>
              <li>
                <strong className="text-ink">Rooster maken.</strong> Beschikbaarheid staat al naast het
                rooster zodra je gaat inplannen.
              </li>
              <li>
                <strong className="text-ink">Teams.</strong> Deel medewerkers in bij bar, bediening of
                keuken. Op het rooster zie je met een kleur wie waar hoort.
              </li>
              <li>
                <strong className="text-ink">Ruilen en overnemen.</strong> Kan iemand niet meer, dan biedt
                die de dienst aan, een collega neemt hem over, en jij geeft (als je dat wilt) nog even je
                akkoord.
              </li>
              <li>
                <strong className="text-ink">Uren.</strong> Gewerkte uren vullen zich deels vanzelf in op
                basis van het rooster. Medewerkers bevestigen, jij keurt goed of stuurt terug met een
                vraag. De goedgekeurde uren per periode kun je exporteren voor je eigen administratie.
              </li>
            </ol>
          </section>

          <section>
            <h2 className={H2}>Handig in een café</h2>
            <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
              {[
                {
                  t: "Vaste diensten",
                  d: "Staat dezelfde barkracht elke vrijdag? Stel het één keer in, het rooster vult zich vooruit. Je vaste diensttijden bewaar je als sjabloon.",
                },
                {
                  t: "Sluitingsdagen",
                  d: "Elke maandag dicht, of een losse dag? Stel je sluitingsdagen in, dan zien medewerkers ze meteen bij het doorgeven van beschikbaarheid.",
                },
                {
                  t: "Terrasweer",
                  d: "Naast het rooster zie je de weersverwachting voor jouw plaats, met een korte terrashint per dag. Een steuntje bij het inplannen, geen voorspelling van drukte.",
                },
                {
                  t: "Tot na middernacht",
                  d: "Eindigt een dienst na 00:00? De gewerkte uren worden dan gewoon goed berekend.",
                },
              ].map((x) => (
                <li key={x.t} className="rounded-2xl bg-white p-5">
                  <h3 className="font-display text-lg font-bold">{x.t}</h3>
                  <p className="mt-2 leading-relaxed text-ink/70">{x.d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className={H2}>Heb je ook een keuken of een restaurantdeel?</h2>
            <p className="mt-3 leading-relaxed text-ink/75">
              Veel zaken zijn een mix: een eetcafé, een grand café, een restaurant met bar. Dat past. Je
              deelt medewerkers in bij teams als bar, bediening en keuken, en plant ze samen in één
              rooster. Elk team heeft zijn eigen kleur, zodat je in één oogopslag ziet wie waar staat.
            </p>
          </section>

          <section>
            <h2 className={H2}>Wat kost het?</h2>
            <p className="mt-3 leading-relaxed text-ink/75">
              Je betaalt één vast bedrag per zaak per maand, afhankelijk van het aantal medewerkers. Het
              geldt voor de hele zaak, niet per medewerker. Alle prijzen zijn excl. btw.
            </p>
            <ul className="mt-3 space-y-1 text-ink/75">
              {PRICE_TIERS.map((t) => (
                <li key={t.id}>
                  <strong className="text-ink">{t.label}:</strong> {formatEuro(t.monthlyExcl)} per maand
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink/60">
              Kies je een jaarabonnement, dan betaal je 10 in plaats van 12 maanden. Meer over de prijzen
              staat op{" "}
              <Link href="/#prijs" className="underline hover:text-ink">
                de homepage
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className={H2}>Veelgestelde vragen</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {FAQS.map((f) => (
                <details key={f.q} className="group rounded-2xl bg-white px-6 py-1.5">
                  <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 py-2 font-display text-lg font-bold">
                    {f.q}
                    <span aria-hidden className="text-xl text-terra transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-4 leading-relaxed text-ink/70">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 rounded-3xl bg-sand p-6 text-[#4A2A12] md:p-8">
          <p className="font-display text-xl font-bold md:text-2xl">Zelf proberen voor je café?</p>
          <p className="mt-2">
            Zeven dagen gratis, zonder creditcard. Of{" "}
            <Link href="/#demo" className="underline">
              probeer eerst de demo
            </Link>{" "}
            op de homepage.
          </p>
          <Link
            href="/onboarding"
            data-track="cta-cafe"
            className="mt-4 inline-block rounded-full bg-terra px-6 py-3 font-bold text-white transition-colors hover:bg-terra-dark"
          >
            Begin gratis
          </Link>
        </div>

        <p className="mt-8 text-sm text-ink/50">
          Gemaakt door{" "}
          <Link href="/over-ons" className="underline hover:text-ink">
            Thom en Daniel
          </Link>
          . Laatst bijgewerkt: <time dateTime={LAST_UPDATED}>6 oktober 2026</time>
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
