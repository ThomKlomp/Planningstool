import Link from "next/link";
import ContactButton from "@/components/contact-button";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import HeroLaptop from "@/components/marketing/hero-laptop";
import {
  PRICE_TIERS,
  MAX_STANDARD_MEMBERS,
  formatEuro,
  yearlyExclForTier,
} from "@/lib/pricing";
import HomeSchema from "@/components/marketing/home-schema";
import { FAQ, FEATURES } from "@/lib/home-content";
import { CLASSIC_THEME, themeStyle, type HomeTheme } from "@/lib/home-themes";

export default function HomeView({ theme = CLASSIC_THEME }: { theme?: HomeTheme }) {
  const t = theme;
  const centered = t.hero === "center";
  const mx = centered ? "mx-auto" : "";
  const sectionTitle = `font-display ${t.heading}`;
  return (
    <main
      className="min-h-screen bg-paper font-body text-ink"
      style={themeStyle(t.vars, { fontDisplay: t.fontDisplay, fontBody: t.fontBody, btnRadius: t.btnRadius })}
    >
      <HomeSchema />
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl overflow-x-hidden px-6 pb-20 pt-8 md:pt-16">
        <div className={`grid items-center gap-12 ${centered ? "" : "md:grid-cols-[1.1fr_0.9fr]"}`}>
          <div className={centered ? "mx-auto text-center" : ""}>
            <p className={`mb-4 text-sm ${t.eyebrow}`}>
              Voor cafés, restaurants &amp; bars tot {MAX_STANDARD_MEMBERS} medewerkers
            </p>
            <h1 className={`font-display text-4xl leading-tight md:text-6xl ${t.heading}`}>
              Rooster software voor kleine horeca
            </h1>
            <p className={`mt-5 max-w-md ${mx} font-display text-2xl leading-snug text-ink/90`}>
              Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.
            </p>
            <p className={`mt-4 max-w-md ${mx} text-lg text-ink/70`}>
              Medewerkers geven hun beschikbaarheid door, jij zet er in een
              paar klikken een rooster overheen. Aan het eind van de week
              keur je de uren goed. Geen groepsapp vol foto's van een
              geprint rooster.
            </p>
            <p className={`mt-3 max-w-md ${mx} text-sm text-ink/50`}>
              Of je er nu een planningstool, roostertool, planningsprogramma of
              beschikbaarheidsprogramma voor gebruikt: dit is 'm.
            </p>
            <div className={`mt-8 flex flex-wrap gap-4 ${centered ? "justify-center" : ""}`}>
              <Link
                href="/onboarding"
                className={`${t.btn} bg-amber px-6 py-3 font-medium text-onaccent hover:bg-amber-dark transition-colors`}
              >
                Begin gratis, 7 dagen
              </Link>
              <Link
                href="/signin"
                className={`${t.btnGhost} px-6 py-3 font-medium hover:border-ink transition-colors`}
              >
                Ik ben uitgenodigd
              </Link>
            </div>
            <p className="mt-4 text-xs text-ink/50">
              Geen creditcard nodig om te beginnen.
            </p>
          </div>

          <HeroLaptop vars={t.deviceVars} />
        </div>
      </section>

      {/* De omslag */}
      <section className={t.quoteSection}>
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <p className={`font-display text-2xl leading-snug md:text-3xl ${t.quote}`}>
            "Wie kan vrijdag?" in de groepsapp, een geel A4'tje op het
            prikbord, en een spreadsheet die alleen jij begrijpt: dat wordt
            één plek waar iedereen naar kijkt.
          </p>
        </div>
      </section>

      {/* Functies */}
      <section id="functies" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className={`${sectionTitle} text-3xl`}>Alles wat je nodig hebt, op één pagina</h2>
        <p className="mt-3 max-w-2xl text-ink/70">
          Of je nu een café, restaurant of bar runt: Shiftje vervangt de spreadsheet voor je rooster en
          de WhatsApp-groep voor alles daaromheen. Beschikbaarheid, personeelsplanning, ruilen en uren
          zitten allemaal in dezelfde app, zodat jij en je team maar op één plek hoeven te kijken.
        </p>
        <div className={t.featureGrid}>
          {FEATURES.map((f) => (
            <Feature key={f.title} theme={t} title={f.title} body={f.body} />
          ))}
        </div>
      </section>

      {/* Veelgestelde vragen */}
      <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
        <h2 className={`${sectionTitle} text-3xl`}>Veelgestelde vragen</h2>
        <div className="mt-6 divide-y divide-line">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                {f.q}
              </summary>
              <p className="mt-2 text-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Prijs */}
      <section id="prijs" className={t.priceSection} style={themeStyle(t.priceVars ?? {})}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.15em] text-amber underline decoration-wavy decoration-1 underline-offset-4">
                Ons menu
              </p>
              <h2 className={`font-display text-3xl md:text-4xl ${t.heading}`}>
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
                <li>Maandelijks opzegbaar*</li>
              </ul>
            </div>
            <div
              className={t.priceCard}
              style={{
                backgroundImage:
                  "repeating-linear-gradient(115deg, rgba(250,247,242,0.03) 0px, rgba(250,247,242,0.03) 1px, transparent 1px, transparent 5px)",
              }}
            >
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-paper/50">
                  <tr>
                    <th className="pb-3 font-medium">Medewerkers</th>
                    <th className="pb-3 text-right font-medium">Per maand</th>
                    <th className="pb-3 text-right font-medium">Per jaar (met korting)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-paper/20">
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
              <p className="mt-1 text-xs text-paper/50">*Geldt voor het maandabonnement. Een jaarabonnement loopt een jaar.</p>

              <Link
                href="/onboarding"
                className={`${t.btn} mt-6 block bg-amber px-6 py-3 text-center font-medium text-onaccent hover:bg-amber-dark transition-colors`}
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
                  className={`${t.btn} mt-3 border border-paper/40 px-5 py-2 text-sm font-medium hover:border-paper hover:bg-paper/10 transition-colors`}
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

function Feature({ theme, title, body }: { theme: HomeTheme; title: string; body: string }) {
  return (
    <div className={theme.feature}>
      <h2 className={`font-display text-2xl ${theme.heading}`}>{title}</h2>
      <p className="max-w-xl text-ink/70">{body}</p>
    </div>
  );
}
