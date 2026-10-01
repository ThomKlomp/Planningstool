import Link from "next/link";
import ContactButton from "@/components/contact-button";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import HeroLaptop from "@/components/marketing/hero-laptop";
import HomeSchema from "@/components/marketing/home-schema";
import { FAQ, FEATURES } from "@/lib/home-content";
import { MAISON_THEME, themeStyle } from "@/lib/home-themes";
import { PRICE_TIERS, MAX_STANDARD_MEMBERS, formatEuro, yearlyExclForTier } from "@/lib/pricing";

/**
 * "Maison": ingetogen en horeca-elegant, zoals een goed restaurant zich
 * presenteert. Diep groen, crème en messing, een klassieke serif, dunne
 * lijnen en de prijzen op een kassabon. Zelfde inhoud en features als de
 * andere ontwerpen.
 */
// Tandrand van het bonnetje (driehoekjes in bonkleur), als herhaalde SVG.
const TEETH_BOTTOM =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 8'><polygon points='0,0 16,0 8,8' fill='%23FFFDF6'/></svg>\")";
const TEETH_TOP =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 8'><polygon points='0,8 16,8 8,0' fill='%23FFFDF6'/></svg>\")";

function ReceiptRule() {
  return <div aria-hidden className="my-4 border-t border-dashed border-[#1c1c19]/40" />;
}

function ReceiptLine({
  label,
  value,
  strong,
  big,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  big?: boolean;
}) {
  return (
    <div className={`flex items-baseline gap-2 ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span aria-hidden className="flex-1 translate-y-[-3px] border-b border-dotted border-[#1c1c19]/40" />
      <span className={`whitespace-nowrap ${big ? "text-2xl font-bold" : ""}`}>{value}</span>
    </div>
  );
}

export default function HomeViewMaison({
  fontDisplay,
  fontBody,
  fontMono,
}: {
  fontDisplay?: string;
  fontBody?: string;
  fontMono?: string;
}) {
  const t = MAISON_THEME;

  return (
    <main
      className="min-h-screen bg-paper font-body text-ink"
      style={{
        ...themeStyle(t.vars, { fontDisplay, fontBody, btnRadius: t.btnRadius }),
        ...(fontMono ? ({ "--bon-font": fontMono } as React.CSSProperties) : {}),
      }}
    >
      <HomeSchema />
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl overflow-x-clip px-6 pb-24 pt-10 md:pt-20">
        <div className="grid items-center gap-16 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-awning">
              <span className="h-px w-8 bg-amber" aria-hidden />
              Voor cafés, restaurants &amp; bars tot {MAX_STANDARD_MEMBERS} medewerkers
            </p>
            <h1 className="font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-7xl">
              Rooster software voor{" "}
              <em className="font-normal text-amber-dark">kleine horeca</em>
            </h1>
            <p className="mt-8 max-w-lg font-display text-2xl leading-snug text-ink/90">
              Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.
            </p>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/70">
              Medewerkers geven hun beschikbaarheid door, jij zet er in een paar klikken een rooster
              overheen. Aan het eind van de week keur je de uren goed. Geen groepsapp vol foto's van
              een geprint rooster.
            </p>
            <p className="mt-3 max-w-lg text-sm text-ink/60">
              Of je er nu een planningstool, roostertool, planningsprogramma of
              beschikbaarheidsprogramma voor gebruikt: dit is 'm.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href="/onboarding"
                className="rounded-btn bg-ink px-7 py-3.5 font-medium text-paper transition-colors hover:bg-awning"
              >
                Begin gratis, 7 dagen
              </Link>
              <Link
                href="/signin"
                className="border-b border-ink/40 pb-0.5 font-medium transition-colors hover:border-ink"
              >
                Ik ben uitgenodigd
              </Link>
            </div>
            <p className="mt-5 text-sm text-ink/60">Geen creditcard nodig om te beginnen.</p>
          </div>

          {/* Boogvenster: een klassiek horeca-motief, met de laptop erin */}
          <div className="mx-auto w-full max-w-md rounded-t-[999px] bg-[#E8DFCB] px-6 pb-8 pt-24 md:px-10">
            <HeroLaptop vars={t.deviceVars} />
          </div>
        </div>
      </section>

      {/* De omslag */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <span className="mx-auto mb-8 block h-px w-12 bg-amber" aria-hidden />
          <p className="font-display text-3xl font-normal italic leading-snug md:text-4xl">
            "Wie kan vrijdag?" in de groepsapp, een geel A4'tje op het prikbord, en een spreadsheet
            die alleen jij begrijpt: dat wordt één plek waar iedereen naar kijkt.
          </p>
          <span className="mx-auto mt-8 block h-px w-12 bg-amber" aria-hidden />
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div className="md:sticky md:top-28 md:self-start">
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight">
              Alles wat je nodig hebt, op één pagina
            </h2>
            <p className="mt-5 leading-relaxed text-ink/70">
              Of je nu een café, restaurant of bar runt: Shiftje vervangt de spreadsheet voor je
              rooster en de WhatsApp-groep voor alles daaromheen. Beschikbaarheid,
              personeelsplanning, ruilen en uren zitten allemaal in dezelfde app, zodat jij en je
              team maar op één plek hoeven te kijken.
            </p>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="grid gap-4 py-8 sm:grid-cols-[3rem_1fr]">
                <span className="font-display text-xl italic text-amber-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-medium">{f.title}</h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-ink/70">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Veelgestelde vragen */}
      <section id="faq" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="text-center font-display text-4xl font-medium tracking-tight">
            Veelgestelde vragen
          </h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium marker:content-none">
                  {f.q}
                  <span
                    aria-hidden
                    className="font-display text-2xl leading-none text-amber-dark transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-ink/70">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-ink/70">
            Staat jouw vraag er niet tussen?{" "}
            <ContactButton
              message="Hoi! Ik heb een vraag over Shiftje."
              className="border-b border-ink/40 pb-0.5 font-medium text-ink transition-colors hover:border-ink"
            >
              Stel hem gerust
            </ContactButton>
          </p>
        </div>
      </section>

      {/* Prijs: per pakket een kassabon */}
      <section id="prijs" className="bg-ink text-paper" style={themeStyle(t.priceVars ?? {})}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <div>
              <p className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-amber">
                <span className="h-px w-8 bg-amber" aria-hidden />
                Ons menu
              </p>
              <h2 className="font-display text-4xl font-medium leading-tight tracking-tight md:text-5xl">
                Eén prijs per zaak, op basis van de grootte van je team.
              </h2>
              <p className="mt-5 max-w-lg leading-relaxed text-paper/70">
                Je betaalt een vast bedrag per maand, afhankelijk van hoeveel medewerkers je hebt.
                Geen kosten per gebruiker, en de prijs past zich vanzelf aan als je team groeit of
                krimpt.
              </p>
            </div>
            <ul className="space-y-2 text-paper/80">
              <li>Beschikbaarheid, rooster, teams, uren</li>
              <li>7 dagen gratis proberen</li>
              <li className="font-semibold text-amber">Jaarlijks betalen? Je krijgt 2 maanden korting</li>
              <li>Maandelijks opzegbaar*</li>
            </ul>
          </div>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {PRICE_TIERS.map((tier, i) => {
              const yearly = yearlyExclForTier(tier);
              const saving = tier.monthlyExcl * 12 - yearly;
              const tilt = ["lg:-rotate-[1.5deg]", "lg:rotate-[1deg]", "lg:-rotate-[0.8deg]", "lg:rotate-[1.6deg]"][i % 4];
              return (
                <div key={tier.id} className={`relative flex flex-col ${tilt}`}>
                  <div aria-hidden className="h-2 bg-repeat-x" style={{ backgroundImage: TEETH_TOP }} />
                  <div className="flex flex-1 flex-col bg-[#FFFDF6] px-5 pb-2 pt-4 text-[13px] leading-5 text-[#1c1c19] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] [font-family:var(--bon-font,ui-monospace,monospace)]">
                    <div
                      aria-hidden
                      className="absolute right-2 top-14 -rotate-12 border-2 border-[#B3261E] px-1.5 py-0.5 text-center text-[10px] font-bold uppercase leading-3 tracking-wider text-[#B3261E]"
                    >
                      Jaarlijks:
                      <br />2 mnd korting
                    </div>
                    <p className="text-lg font-semibold tracking-[0.35em]">SHIFTJE</p>
                    <p className="text-[11px] uppercase tracking-widest text-[#1c1c19]/60">
                      Pakket {i + 1}
                    </p>
                    <ReceiptRule />
                    <p className="text-[15px] font-semibold">{tier.label}</p>
                    <p className="mt-2 text-4xl font-bold leading-none">
                      {formatEuro(tier.monthlyExcl)}
                    </p>
                    <p className="mt-1 text-[12px] text-[#1c1c19]/65">per maand, excl. btw</p>

                    <div className="mt-4 flex items-center justify-between gap-2 bg-[#1c1c19] px-2.5 py-2 text-[#FFFDF6]">
                      <span className="text-[11px] uppercase leading-4 tracking-wider">
                        Jaarlijks
                        <br />
                        <span className="text-[#FFFDF6]/60 line-through">
                          {formatEuro(tier.monthlyExcl * 12)}
                        </span>
                      </span>
                      <span className="whitespace-nowrap text-xl font-bold">{formatEuro(yearly)}</span>
                    </div>
                    <p className="mt-1 text-right text-[12px] font-semibold text-[#B3261E]">
                      Je bespaart {formatEuro(saving)}
                    </p>

                    <ReceiptRule />
                    <ReceiptLine label="Kosten per gebruiker" value={formatEuro(0)} />
                    <ReceiptRule />
                    <ul className="space-y-0.5 pb-4 text-[12px] text-[#1c1c19]/80">
                      <li>1x Beschikbaarheid, rooster, teams, uren</li>
                      <li>1x 7 dagen gratis proberen</li>
                      <li>1x Maandelijks opzegbaar*</li>
                    </ul>

                    <Link
                      href="/onboarding"
                      className="mt-auto block rounded-btn bg-[#1c1c19] px-4 py-2.5 text-center font-medium text-[#FFFDF6] transition-colors hover:bg-awning"
                    >
                      Begin gratis
                    </Link>
                    <div
                      aria-hidden
                      className="mx-auto mt-5 h-8 w-4/5"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, #1c1c19 0 2px, transparent 2px 4px, #1c1c19 4px 5px, transparent 5px 8px, #1c1c19 8px 11px, transparent 11px 13px)",
                      }}
                    />
                    <p className="mb-3 mt-2 text-center text-[10px] uppercase tracking-widest text-[#1c1c19]/60">
                      Bedankt en tot ziens
                    </p>
                  </div>
                  <div aria-hidden className="h-2 bg-repeat-x" style={{ backgroundImage: TEETH_BOTTOM }} />
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-5 border border-dashed border-paper/40 px-6 py-5">
            <div>
              <p className="font-display text-xl">Meer dan {MAX_STANDARD_MEMBERS} medewerkers? Op maat.</p>
              <p className="mt-1 text-sm text-paper/70">
                Neem contact met ons op, dan kijken we samen naar de mogelijkheden.
              </p>
            </div>
            <ContactButton
              message={`Hoi! Ik heb meer dan ${MAX_STANDARD_MEMBERS} medewerkers en wil graag weten wat de mogelijkheden zijn.`}
              className="rounded-btn border border-paper/60 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-paper hover:text-ink"
            >
              Neem contact op
            </ContactButton>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-paper/60">
            Alle prijzen excl. btw. Kies je een jaarabonnement, dan betaal je 10 in plaats van 12
            maanden. *Geldt voor het maandabonnement. Een jaarabonnement loopt een jaar.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
