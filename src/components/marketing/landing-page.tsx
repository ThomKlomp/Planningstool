import type { ReactNode } from "react";
import Link from "next/link";
import ContactButton from "@/components/contact-button";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import ScheduleMock from "@/components/schedule-mock";
import HeroBoard from "@/components/marketing/hero-board";
import FeatureFlipCards from "@/components/marketing/feature-flip-cards";
import type { Venue } from "@/components/marketing/venue";
import { PRICE_TIERS, MAX_STANDARD_MEMBERS, formatEuro, yearlyExclForTier } from "@/lib/pricing";

export type LandingFaq = { name: string; answer: string };

// Alle teksten van een landingspagina. De opmaak is voor de homepage en de
// zaaktype-pagina's hetzelfde: alleen de teksten verschillen per doelgroep.
export type LandingContent = {
  /** Welke voorbeeldgegevens de rooster-voorbeelden tonen (standaard: restaurant). */
  venue?: Venue;
  eyebrow: string;
  h1: string;
  definition: ReactNode;
  tagline: string;
  body: string;
  synonyms: string;
  heroTrack: string;
  prijsTrack: string;
  quote: ReactNode;
  functiesHeading: string;
  functiesIntro: string;
  /** Eigen tekst voor een functiekaart, op titel (bv. "Teams"). */
  cardBodies?: Record<string, string>;
  moreFeatures: { title: string; body: string }[];
  faqs: LandingFaq[];
  footerNote?: ReactNode;
  schemas: object[];
};

export default function LandingPage({ content: c }: { content: LandingContent }) {
  return (
    <main className="page-sage min-h-screen overflow-x-clip text-ink">
      {c.schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-6 pb-20 pt-10 md:pt-14 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <p className="self-start rounded-full bg-sand px-4 py-2 text-sm font-bold text-[#4A2A12]">
            {c.eyebrow}
          </p>
          {/* "personeelsplanning" is één lang woord en mag niet worden afgebroken
              (geen hyphens/break-words): de tekstgrootte is per breedte
              afgestemd zodat het hele woord in de kolom past. */}
          <h1 className="font-display text-[1.75rem] font-bold leading-[1.04] min-[360px]:text-[1.9rem] tracking-tight sm:text-5xl md:text-6xl lg:text-[2.5rem] xl:text-[2.9rem]">
            {c.h1}
          </h1>
          {/* Eerste, citeerbare omschrijving: wat, voor wie, wat het kost. */}
          <p className="max-w-xl text-lg leading-relaxed text-ink/85">{c.definition}</p>
          <p className="font-display text-xl font-semibold leading-snug text-terra md:text-2xl">
            {c.tagline}
          </p>
          <p className="max-w-xl text-lg leading-relaxed text-ink/75">{c.body}</p>
          <p className="max-w-xl text-sm leading-relaxed text-ink/60">{c.synonyms}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              data-track={c.heroTrack}
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

        <HeroBoard venue={c.venue} />
      </section>

      {/* De omslag */}
      <section className="bg-ink text-sage">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold leading-snug md:text-4xl">{c.quote}</p>
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="mx-auto max-w-6xl px-6 pb-12 pt-24">
        <div className="max-w-3xl">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {c.functiesHeading}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/70">{c.functiesIntro}</p>
        </div>
        <div className="mt-10">
          <FeatureFlipCards bodies={c.cardBodies} venue={c.venue} />
        </div>

        <div className="mt-16">
          <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            En nog meer, zonder gedoe
          </h3>
          <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.moreFeatures.map((f) => (
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
          <ScheduleMock venue={c.venue} />
        </div>
      </section>

      {/* Veelgestelde vragen */}
      <section id="faq" className="mx-auto max-w-3xl px-6 pb-20 pt-4">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Veelgestelde vragen</h2>
        <div className="mt-6 flex flex-col gap-2.5">
          {c.faqs.map((f) => (
            <details key={f.name} className="group rounded-2xl bg-white px-6 py-1.5">
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 py-2 font-display text-lg font-bold">
                {f.name}
                <span aria-hidden className="text-xl text-terra transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-4 leading-relaxed text-ink/70">{f.answer}</p>
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
              data-track={c.prijsTrack}
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

      {c.footerNote ? (
        <p className="mx-auto max-w-3xl px-6 pb-10 text-sm text-ink/50">{c.footerNote}</p>
      ) : null}

      <SiteFooter />
    </main>
  );
}
