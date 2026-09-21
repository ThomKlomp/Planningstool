import Link from "next/link";
import ContactButton from "@/components/contact-button";
import {
  PRICE_TIERS,
  MAX_STANDARD_MEMBERS,
  formatEuro,
  yearlyExclForTier,
} from "@/lib/pricing";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-50 border-b border-line/60 bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-xl">Shiftje</span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/signin" className="hover:text-awning">
              Inloggen
            </Link>
            <Link
              href="/onboarding"
              className="rounded-full bg-ink px-4 py-2 text-paper hover:bg-awning transition-colors"
            >
              Start met je zaak
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-8 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 text-sm text-awning">
              Voor cafés, restaurants &amp; bars tot {MAX_STANDARD_MEMBERS} medewerkers
            </p>
            <h1 className="font-display text-4xl leading-tight md:text-5xl">
              Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink/70">
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
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="divide-y divide-line">
          <Feature
            title="Beschikbaarheid"
            body="Medewerkers geven per dag of per shift aan of ze kunnen, net zo simpel als een datumprikker. Jij zet weken vooraf open, zodat er nooit een gat valt."
          />
          <Feature
            title="Rooster"
            body="Beschikbaarheid staat er al naast zodra je gaat inplannen. Sleep niemand meer tussen appjes, het staat gewoon in beeld."
          />
          <Feature
            title="Teams"
            body="Deel medewerkers in bij bediening, keuken of bar. Op het rooster zie je in één oogopslag wie waar hoort."
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

      {/* Prijs */}
      <section className="border-t border-line bg-ink text-paper">
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
                <li>Jaarlijks betalen? 2 maanden gratis</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-paper/20 bg-paper/5 p-6 md:p-8">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-paper/50">
                  <tr>
                    <th className="pb-3 font-medium">Medewerkers</th>
                    <th className="pb-3 text-right font-medium">Per maand</th>
                    <th className="pb-3 text-right font-medium">Per jaar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper/10">
                  {PRICE_TIERS.map((tier) => (
                    <tr key={tier.id}>
                      <td className="py-3">{tier.label.replace(" medewerkers", "")}</td>
                      <td className="py-3 text-right font-display text-lg">
                        {formatEuro(tier.monthlyExcl)}
                      </td>
                      <td className="py-3 text-right text-paper/70">
                        {formatEuro(yearlyExclForTier(tier))}
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
              <p className="mt-3 text-xs text-paper/50">Alle prijzen excl. btw.</p>

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

      <footer className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-ink/50">
        <span>© {new Date().getFullYear()} Shiftje</span>
        <span>Gemaakt voor kleine horecazaken</span>
      </footer>
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
