import Link from "next/link";
import ContactButton from "@/components/contact-button";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import HeroLaptop from "@/components/marketing/hero-laptop";
import { FAQ, FEATURES } from "@/lib/home-content";
import { SHIFT_THEME, themeStyle } from "@/lib/home-themes";
import { PRICE_TIERS, MAX_STANDARD_MEMBERS, formatEuro, yearlyExclForTier } from "@/lib/pricing";

/**
 * "Shift": het ontwerp met de dienst als gezicht van de site. De gekleurde
 * dienstblokjes uit het rooster keren overal terug: zwevend om de laptop,
 * als lopende band, als dagkaarten bij de functies en als prijsstaffels.
 * Zelfde inhoud en features als de andere ontwerpen.
 */

const PASTEL = {
  butter: "bg-[#FFD66B]",
  mint: "bg-[#B7E4C7]",
  lilac: "bg-[#CDBFFF]",
  peach: "bg-[#FFC2A8]",
  sky: "bg-[#A9D8FF]",
};

const FEATURE_STYLE = [
  { day: "Ma", bg: PASTEL.lilac, span: "md:col-span-4" },
  { day: "Di", bg: PASTEL.mint, span: "md:col-span-2" },
  { day: "Wo", bg: PASTEL.peach, span: "md:col-span-2" },
  { day: "Do", bg: PASTEL.sky, span: "md:col-span-2" },
  { day: "Vr", bg: PASTEL.butter, span: "md:col-span-2" },
];

const TIER_BG = [PASTEL.butter, PASTEL.mint, PASTEL.lilac, PASTEL.peach];

const MARQUEE = [
  ["Beschikbaarheid", PASTEL.lilac],
  ["Rooster", PASTEL.mint],
  ["Teams", PASTEL.peach],
  ["Ruilen & overnemen", PASTEL.sky],
  ["Uren", PASTEL.butter],
  ["Lunch", PASTEL.mint],
  ["Diner", PASTEL.lilac],
  ["Bar", PASTEL.peach],
  ["Keuken", PASTEL.butter],
  ["Bediening", PASTEL.sky],
] as const;

function Chip({
  className = "",
  bg,
  children,
}: {
  className?: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 text-sm font-medium text-ink ${bg} ${className}`}
    >
      {children}
    </span>
  );
}

export default function HomeViewShift({
  fontDisplay,
  fontBody,
}: {
  fontDisplay?: string;
  fontBody?: string;
}) {
  const t = SHIFT_THEME;
  const marquee = [...MARQUEE, ...MARQUEE];

  return (
    <main
      className="min-h-screen bg-paper font-body text-ink"
      style={themeStyle(t.vars, { fontDisplay, fontBody, btnRadius: t.btnRadius })}
    >
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl overflow-x-clip px-6 pb-20 pt-8 md:pt-16">
        <div className="grid items-center gap-14 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-ink bg-surface px-4 py-1.5 text-sm font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-amber" aria-hidden />
              Voor cafés, restaurants &amp; bars tot {MAX_STANDARD_MEMBERS} medewerkers
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-7xl">
              Rooster software voor{" "}
              <span className="relative isolate whitespace-nowrap">
                <span
                  className="absolute inset-x-[-0.15em] bottom-[0.06em] top-[0.2em] -z-10 -rotate-1 rounded-lg bg-[#FFD66B]"
                  aria-hidden
                />
                kleine horeca
              </span>
            </h1>
            <p className="mt-7 max-w-lg font-display text-2xl font-semibold leading-snug">
              Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.
            </p>
            <p className="mt-4 max-w-lg text-lg text-ink/70">
              Medewerkers geven hun beschikbaarheid door, jij zet er in een paar klikken een rooster
              overheen. Aan het eind van de week keur je de uren goed. Geen groepsapp vol foto's van
              een geprint rooster.
            </p>
            <p className="mt-3 max-w-lg text-sm text-ink/60">
              Of je er nu een planningstool, roostertool, planningsprogramma of
              beschikbaarheidsprogramma voor gebruikt: dit is 'm.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/onboarding"
                className="rounded-btn border-2 border-ink bg-amber px-7 py-3.5 text-lg font-semibold text-onaccent shadow-[4px_4px_0_0_rgb(var(--c-ink))] transition-all hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgb(var(--c-ink))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Begin gratis, 7 dagen
              </Link>
              <Link
                href="/signin"
                className="rounded-btn border-2 border-ink bg-surface px-7 py-3.5 text-lg font-semibold transition-colors hover:bg-ink hover:text-paper"
              >
                Ik ben uitgenodigd
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink/60">Geen creditcard nodig om te beginnen.</p>
          </div>

          <div className="relative">
            {/* Zwevende diensten rond de laptop, puur decoratief */}
            <div aria-hidden className="pointer-events-none hidden md:block">
              <Chip
                bg={PASTEL.mint}
                className="shift-bob absolute -left-10 top-6 z-20 shadow-[3px_3px_0_0_rgb(var(--c-ink))] [--r:-6deg]"
              >
                Julia · 17–23
              </Chip>
              <Chip
                bg={PASTEL.peach}
                className="shift-bob absolute -right-4 top-1/3 z-20 shadow-[3px_3px_0_0_rgb(var(--c-ink))] [--r:5deg] [animation-delay:-1.6s]"
              >
                Ahmed · Kok
              </Chip>
              <Chip
                bg={PASTEL.lilac}
                className="shift-bob absolute -left-6 bottom-8 z-20 shadow-[3px_3px_0_0_rgb(var(--c-ink))] [--r:4deg] [animation-delay:-3.1s]"
              >
                Dienst overnemen ✓
              </Chip>
            </div>
            <HeroLaptop vars={t.deviceVars} />
          </div>
        </div>
      </section>

      {/* Lopende band met diensten */}
      <div className="overflow-hidden border-y-2 border-ink bg-ink py-4" aria-hidden>
        <div className="shift-marquee flex w-max gap-3 pr-3">
          {marquee.map(([label, bg], i) => (
            <Chip key={i} bg={bg} className="border-paper/0 whitespace-nowrap">
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {/* De omslag */}
      <section className="bg-[#FFD66B]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            "Wie kan vrijdag?" in de groepsapp, een geel A4'tje op het prikbord, en een spreadsheet
            die alleen jij begrijpt: dat wordt één plek waar iedereen naar kijkt.
          </p>
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">
          Alles wat je nodig hebt, op één pagina
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink/70">
          Of je nu een café, restaurant of bar runt: Shiftje vervangt de spreadsheet voor je rooster
          en de WhatsApp-groep voor alles daaromheen. Beschikbaarheid, personeelsplanning, ruilen en
          uren zitten allemaal in dezelfde app, zodat jij en je team maar op één plek hoeven te
          kijken.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-6">
          {FEATURES.map((f, i) => {
            const s = FEATURE_STYLE[i % FEATURE_STYLE.length];
            return (
              <div
                key={f.title}
                className={`${s.span} ${s.bg} rounded-3xl border-2 border-ink p-7 shadow-[6px_6px_0_0_rgb(var(--c-ink))]`}
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-paper">
                  {s.day}
                </span>
                <h3 className="mt-5 font-display text-3xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-3 max-w-xl text-ink/80">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Veelgestelde vragen */}
      <section id="faq" className="border-y-2 border-ink bg-surface">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-[0.8fr_1.2fr]">
          <div className="md:sticky md:top-28 md:self-start">
            <h2 className="font-display text-4xl font-extrabold tracking-tight">
              Veelgestelde vragen
            </h2>
            <p className="mt-4 text-ink/70">Staat jouw vraag er niet tussen? Vraag het ons gewoon.</p>
            <ContactButton
              message="Hoi! Ik heb een vraag over Shiftje."
              className="mt-5 rounded-btn border-2 border-ink px-5 py-2.5 font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              Stel je vraag
            </ContactButton>
          </div>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border-2 border-ink bg-paper px-5 py-4 open:bg-[#CDBFFF]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:content-none">
                  {f.q}
                  <span
                    aria-hidden
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-ink text-lg leading-none text-paper transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-ink/80">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Prijs */}
      <section id="prijs" className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-amber underline decoration-wavy decoration-1 underline-offset-4">
            Ons menu
          </p>
          <h2 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">
            Eén prijs per zaak, op basis van de grootte van je team.
          </h2>
          <p className="mt-4 max-w-xl text-lg text-paper/70">
            Je betaalt een vast bedrag per maand, afhankelijk van hoeveel medewerkers je hebt. Geen
            kosten per gebruiker, en de prijs past zich vanzelf aan als je team groeit of krimpt.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PRICE_TIERS.map((tier, i) => (
              <div
                key={tier.id}
                className={`${TIER_BG[i % TIER_BG.length]} rounded-3xl border-2 border-paper/0 p-6 text-ink`}
              >
                <p className="text-sm font-semibold">{tier.label}</p>
                <p className="mt-4 font-display text-5xl font-extrabold tracking-tight">
                  {formatEuro(tier.monthlyExcl)}
                </p>
                <p className="text-sm text-ink/70">per maand</p>
                <p className="mt-5 border-t-2 border-dashed border-ink/30 pt-4 text-sm">
                  <span className="text-ink/50 line-through">{formatEuro(tier.monthlyExcl * 12)}</span>{" "}
                  <span className="font-bold">{formatEuro(yearlyExclForTier(tier))}</span> per jaar
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-dashed border-paper/40 p-6">
            <div>
              <p className="font-display text-xl font-bold">
                Meer dan {MAX_STANDARD_MEMBERS} medewerkers? Op maat
              </p>
              <p className="mt-1 text-paper/70">
                Neem contact met ons op, dan kijken we samen naar de mogelijkheden.
              </p>
            </div>
            <ContactButton
              message={`Hoi! Ik heb meer dan ${MAX_STANDARD_MEMBERS} medewerkers en wil graag weten wat de mogelijkheden zijn.`}
              className="rounded-btn border-2 border-paper/60 px-6 py-2.5 font-semibold transition-colors hover:bg-paper hover:text-ink"
            >
              Neem contact op
            </ContactButton>
          </div>

          <div className="mt-12 grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <ul className="space-y-2 text-paper/80">
                <li>✓ Beschikbaarheid, rooster, teams, uren</li>
                <li>✓ 7 dagen gratis proberen</li>
                <li>✓ Jaarlijks betalen? Je krijgt 2 maanden korting</li>
                <li>✓ Maandelijks opzegbaar*</li>
              </ul>
              <p className="mt-5 text-xs text-paper/60">
                Alle prijzen excl. btw. Kies je een jaarabonnement, dan betaal je 10 in plaats van 12
                maanden.
              </p>
              <p className="mt-1 text-xs text-paper/60">
                *Geldt voor het maandabonnement. Een jaarabonnement loopt een jaar.
              </p>
            </div>
            <Link
              href="/onboarding"
              className="rounded-btn border-2 border-paper bg-amber px-8 py-4 text-center text-lg font-semibold text-onaccent shadow-[4px_4px_0_0_rgb(var(--c-paper))] transition-all hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Begin gratis
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
