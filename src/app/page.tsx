import Link from "next/link";

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
              Voor cafés, restaurants &amp; bars tot ~30 medewerkers
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
          <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">
                Eén prijs, per zaak. Niet per medewerker.
              </h2>
              <p className="mt-4 max-w-md text-paper/70">
                Of je nu met 4 of met 25 mensen werkt: je betaalt hetzelfde.
                Geen rekenwerk bij elke nieuwe aanwas, geen minimum aantal
                gebruikers.
              </p>
            </div>
            <div className="rounded-2xl border border-paper/20 bg-paper/5 p-8">
              <p className="font-display text-4xl">
                €10
                <span className="text-lg font-body text-paper/60"> / maand</span>
              </p>
              <p className="mt-1 text-sm text-paper/50">
                excl. btw, of €100/jaar (2 maanden gratis)
              </p>
              <ul className="mt-6 space-y-2 text-sm text-paper/80">
                <li>Onbeperkt medewerkers</li>
                <li>Beschikbaarheid, rooster, teams, uren</li>
                <li>7 dagen gratis proberen</li>
              </ul>
              <Link
                href="/onboarding"
                className="mt-6 block rounded-full bg-amber px-6 py-3 text-center font-medium text-ink hover:bg-amber-dark transition-colors"
              >
                Begin gratis
              </Link>
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
    { label: "Ma", shifts: [] as { time: string; color: string }[] },
    { label: "Di", shifts: [{ time: "17–23", color: "bg-awning" }] },
    { label: "Wo", shifts: [{ time: "12–18", color: "bg-amber" }] },
    {
      label: "Do",
      shifts: [
        { time: "12–18", color: "bg-amber" },
        { time: "17–23", color: "bg-awning" },
      ],
    },
    { label: "Vr", shifts: [{ time: "17–00", color: "bg-awning" }] },
    { label: "Za", shifts: [{ time: "16–00", color: "bg-awning" }] },
    { label: "Zo", shifts: [] },
  ];

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_2px_0_0_#DDD5C7] md:p-5">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs uppercase tracking-wide text-ink/40">Week 38</p>
        <span className="rounded-full bg-awning/10 px-2 py-0.5 text-[11px] font-medium text-awning">
          Open
        </span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div key={d.label} className="text-center">
            <p className="text-[10px] text-ink/40">{d.label}</p>
            <div className="mt-1 flex min-h-[4.5rem] flex-col gap-1">
              {d.shifts.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-md ${s.color} px-1 py-1.5 text-[9px] font-medium text-white`}
                >
                  {s.time}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-ink/50">
        <span className="h-1.5 w-1.5 rounded-full bg-awning" /> Bediening
        <span className="ml-2 h-1.5 w-1.5 rounded-full bg-amber" /> Keuken
      </div>
    </div>
  );
}
