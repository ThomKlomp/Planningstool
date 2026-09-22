import type { Metadata } from "next";
import Link from "next/link";
import ContactButton from "@/components/contact-button";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import {
  PRICE_TIERS,
  MAX_STANDARD_MEMBERS,
  formatEuro,
  yearlyExclForTier,
} from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Roosterprogramma voor kleine horeca",
  description:
    "Shiftje is rooster software voor kleine horeca: beschikbaarheid, personeelsplanning en uren op één plek. Eén vaste prijs per zaak tot 40 medewerkers, geen kosten per gebruiker. Begin gratis, 7 dagen.",
  alternates: { canonical: "/" },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shiftje",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Personeelsplanning / roostersoftware",
  operatingSystem: "Web, iOS, Android",
  description:
    "Rooster software voor kleine horeca: beschikbaarheid, personeelsplanning, dienstruil en urenregistratie op één plek.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: PRICE_TIERS[0].monthlyExcl.toFixed(2),
    highPrice: PRICE_TIERS[PRICE_TIERS.length - 1].monthlyExcl.toFixed(2),
    offerCount: PRICE_TIERS.length,
  },
  // Geen aggregateRating: we voegen die pas toe zodra er échte, verifieerbare
  // reviews zijn. Verzonnen sterren in structured data schendt Google's
  // richtlijnen en kan tot een handmatige actie leiden.
};

const faqSchema = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Voor wie is Shiftje gemaakt?", "acceptedAnswer": {"@type": "Answer", "text": "Voor kleine horecazaken tot 40 medewerkers: cafés, restaurants en bars. Eén team, één rooster, geen ingewikkelde configuratie vooraf."}}, {"@type": "Question", "name": "Wat kost Shiftje?", "acceptedAnswer": {"@type": "Answer", "text": "Eén vast bedrag per maand, gebaseerd op het aantal medewerkers, niet per gebruiker. Je ziet de actuele staffels hieronder bij Prijzen."}}, {"@type": "Question", "name": "Kan ik Shiftje eerst gratis proberen?", "acceptedAnswer": {"@type": "Answer", "text": "Ja, je kunt 7 dagen gratis beginnen zonder creditcard."}}, {"@type": "Question", "name": "Werkt Shiftje ook voor een restaurant met keuken én bediening?", "acceptedAnswer": {"@type": "Answer", "text": "Ja. Je deelt medewerkers in bij teams zoals bediening en keuken, en plant lunch- en dinerdiensten los van elkaar in."}}, {"@type": "Question", "name": "Wat gebeurt er als iemand een dienst niet kan werken?", "acceptedAnswer": {"@type": "Answer", "text": "Die biedt de dienst aan het team aan. Een collega neemt 'm over of ruilt, en jij ziet het meteen terug in het rooster."}}]};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
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
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-8 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 text-sm text-awning">
              Voor cafés, restaurants &amp; bars tot {MAX_STANDARD_MEMBERS} medewerkers
            </p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Rooster software voor kleine horeca
            </h1>
            <p className="mt-5 max-w-md font-display text-2xl leading-snug text-ink/90">
              Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.
            </p>
            <p className="mt-4 max-w-md text-lg text-ink/70">
              Medewerkers geven hun beschikbaarheid door, jij zet er in een
              paar klikken een rooster overheen. Aan het eind van de week
              keur je de uren goed. Geen groepsapp vol foto's van een
              geprint rooster.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/onboarding"
                className="rounded-full bg-amber px-6 py-3 font-medium text-ink hover:bg-amber-dark transition-colors"
              >
                Begin gratis, 7 dagen
              </Link>
              <Link
                href="/signin"
                className="rounded-full border border-line px-6 py-3 font-medium hover:border-ink transition-colors"
              >
                Ik ben uitgenodigd
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink/40">
              Geen creditcard nodig om te beginnen.
            </p>
          </div>

          <ScheduleMock />
        </div>
      </section>

      {/* De omslag */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <p className="font-display text-2xl leading-snug md:text-3xl">
            "Wie kan vrijdag?" in de groepsapp, een geel A4'tje op het
            prikbord, en een spreadsheet die alleen jij begrijpt: dat wordt
            één plek waar iedereen naar kijkt.
          </p>
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-2xl">Alles wat je nodig hebt, op één pagina</h2>
        <p className="mt-3 max-w-2xl text-ink/70">
          Of je nu een café, restaurant of bar runt: Shiftje vervangt de spreadsheet voor je rooster en
          de WhatsApp-groep voor alles daaromheen. Beschikbaarheid, personeelsplanning, ruilen en uren
          zitten allemaal in dezelfde app, zodat jij en je team maar op één plek hoeven te kijken.
        </p>
        <div className="mt-10 divide-y divide-line">
          <Feature
            title="Beschikbaarheid"
            body="Medewerkers geven per dag of per shift aan of ze kunnen, net zo simpel als een datumprikker. Handig of je nu vooral in het weekend plant (café, bar) of ook doordeweeks met lunch en diner (restaurant): jij zet weken vooraf open, zodat er nooit een gat valt."
          />
          <Feature
            title="Rooster"
            body="Beschikbaarheid staat er al naast zodra je gaat inplannen. Sleep niemand meer tussen appjes, het staat gewoon in beeld."
          />
          <Feature
            title="Teams"
            body="Deel medewerkers in bij bediening, keuken of bar. Handig zodra je met meerdere onderdelen tegelijk plant, zoals keuken en bediening in een restaurant: op het rooster zie je in één oogopslag wie waar hoort."
          />
          <Feature
            title="Ruilen &amp; overnemen"
            body="Een medewerker kan niet meer? Die biedt de dienst aan, een collega neemt 'm over, en jij geeft (als je dat wil) nog even je akkoord."
          />
          <Feature
            title="Uren"
            body="Gewerkte uren vullen zich deels vanzelf in op basis van het rooster. Medewerkers bevestigen, jij keurt goed of stuurt terug met een vraag."
          />
        </div>
      </section>

      {/* Veelgestelde vragen */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-2xl">Veelgestelde vragen</h2>
        <div className="mt-6 divide-y divide-line">
          <details className="group py-4">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              Voor wie is Shiftje gemaakt?
            </summary>
            <p className="mt-2 text-ink/70">Voor kleine horecazaken tot 40 medewerkers: cafés, restaurants en bars. Eén team, één rooster, geen ingewikkelde configuratie vooraf.</p>
          </details>
          <details className="group py-4">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              Wat kost Shiftje?
            </summary>
            <p className="mt-2 text-ink/70">Eén vast bedrag per maand, gebaseerd op het aantal medewerkers, niet per gebruiker. Je ziet de actuele staffels hieronder bij Prijzen.</p>
          </details>
          <details className="group py-4">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              Kan ik Shiftje eerst gratis proberen?
            </summary>
            <p className="mt-2 text-ink/70">Ja, je kunt 7 dagen gratis beginnen zonder creditcard.</p>
          </details>
          <details className="group py-4">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              Werkt Shiftje ook voor een restaurant met keuken én bediening?
            </summary>
            <p className="mt-2 text-ink/70">Ja. Je deelt medewerkers in bij teams zoals bediening en keuken, en plant lunch- en dinerdiensten los van elkaar in.</p>
          </details>
          <details className="group py-4">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              Wat gebeurt er als iemand een dienst niet kan werken?
            </summary>
            <p className="mt-2 text-ink/70">Die biedt de dienst aan het team aan. Een collega neemt 'm over of ruilt, en jij ziet het meteen terug in het rooster.</p>
          </details>
        </div>
      </section>

      {/* Prijs */}
      <section id="prijs" className="border-t border-line bg-ink text-paper">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">
                Eén prijs per zaak, op basis van de grootte van je team.
              </h2>
              <p className="mt-4 max-w-md text-paper/70">
                Je betaalt een vast bedrag per maand, afhankelijk van hoeveel
                medewerkers je hebt. Geen kosten per gebruiker, en de prijs
                past zich vanzelf aan als je team groeit of krimpt.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-paper/80">
                <li>Beschikbaarheid, rooster, teams, uren</li>
                <li>7 dagen gratis proberen</li>
                <li>Jaarlijks betalen? Je krijgt 2 maanden korting</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-paper/20 bg-paper/5 p-6 md:p-8">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-paper/50">
                  <tr>
                    <th className="pb-3 font-medium">Medewerkers</th>
                    <th className="pb-3 text-right font-medium">Per maand</th>
                    <th className="pb-3 text-right font-medium">Per jaar (met korting)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper/10">
                  {PRICE_TIERS.map((tier) => (
                    <tr key={tier.id}>
                      <td className="py-3">{tier.label.replace(" medewerkers", "")}</td>
                      <td className="py-3 text-right font-display text-lg">
                        {formatEuro(tier.monthlyExcl)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="mr-1.5 text-paper/40 line-through">
                          {formatEuro(tier.monthlyExcl * 12)}
                        </span>
                        <span className="font-medium text-amber">
                          {formatEuro(yearlyExclForTier(tier))}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="py-3">Meer dan {MAX_STANDARD_MEMBERS}</td>
                    <td className="py-3 text-right text-paper/70" colSpan={2}>
                      Op maat
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-paper/50">Alle prijzen excl. btw. Kies je een jaarabonnement, dan betaal je 10 in plaats van 12 maanden.</p>

              <Link
                href="/onboarding"
                className="mt-6 block rounded-full bg-amber px-6 py-3 text-center font-medium text-ink hover:bg-amber-dark transition-colors"
              >
                Begin gratis
              </Link>

              <div className="mt-6 rounded-xl border border-paper/20 p-4">
                <p className="text-sm font-medium">
                  Meer dan {MAX_STANDARD_MEMBERS} medewerkers?
                </p>
                <p className="mt-1 text-sm text-paper/60">
                  Neem contact met ons op, dan kijken we samen naar de
                  mogelijkheden.
                </p>
                <ContactButton
                  message={`Hoi! Ik heb meer dan ${MAX_STANDARD_MEMBERS} medewerkers en wil graag weten wat de mogelijkheden zijn.`}
                  className="mt-3 rounded-full border border-paper/40 px-5 py-2 text-sm font-medium hover:border-paper hover:bg-paper/10 transition-colors"
                >
                  Neem contact op
                </ContactButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid gap-2 py-8 md:grid-cols-[220px_1fr] md:gap-8">
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="max-w-xl text-ink/70">{body}</p>
    </div>
  );
}

/** Kleine, gestileerde weergave van een weekrooster: geen screenshot, gewoon opgebouwd uit divs. */
function ScheduleMock() {
  const days = [
    {
      label: "Wo 16",
      groups: [
        {
          team: "Bediening",
          color: "text-awning",
          dot: "bg-awning",
          shifts: [
            { name: "Julia Bakker", time: "12–18" },
            { name: "Tom Visser", time: "17–23" },
          ],
        },
        {
          team: "Keuken",
          color: "text-amber-dark",
          dot: "bg-amber",
          shifts: [{ name: "Ahmed · Kok", time: "17–23" }],
        },
      ],
    },
    {
      label: "Do 17",
      groups: [
        {
          team: "Bediening",
          color: "text-awning",
          dot: "bg-awning",
          shifts: [{ name: "Nina de Boer", time: "12–18" }],
        },
        {
          team: "Keuken",
          color: "text-amber-dark",
          dot: "bg-amber",
          shifts: [{ name: "Lotte · Kok", time: "17–23" }],
        },
      ],
    },
    {
      label: "Vr 18",
      groups: [
        {
          team: "Bediening",
          color: "text-awning",
          dot: "bg-awning",
          shifts: [{ name: "Mark Jansen", time: "17–23" }],
        },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_2px_0_0_#DDD5C7] md:p-5">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs uppercase tracking-wide text-ink/40">Week 38</p>
        <span className="rounded-full bg-awning/10 px-2 py-0.5 text-[11px] font-medium text-awning">
          Open
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {days.map((d) => (
          <div key={d.label}>
            <p className="text-center text-[10px] text-ink/40">{d.label}</p>
            <div className="mt-1.5 space-y-2">
              {d.groups.map((g) => (
                <div key={g.team}>
                  <p
                    className={`flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide ${g.color}`}
                  >
                    <span className={`h-1 w-1 rounded-full ${g.dot}`} />
                    {g.team}
                  </p>
                  <div className="mt-1 space-y-1">
                    {g.shifts.map((s, i) => (
                      <div key={i} className="rounded-md bg-paper px-1.5 py-1">
                        <p className="truncate text-[9px] font-medium leading-tight">{s.name}</p>
                        <p className="text-[8px] leading-tight text-ink/50">{s.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
