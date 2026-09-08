import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
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
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-12 md:pt-20">
        <p className="mb-4 text-sm text-awning">Voor cafés, restaurants &amp; bars tot ~30 medewerkers</p>
        <h1 className="max-w-2xl font-display text-4xl leading-tight md:text-6xl">
          Wie kan er donderdagavond staan? Dat weet je nu in één oogopslag.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          Medewerkers geven hun beschikbaarheid door, jij zet er in een paar
          klikken een rooster overheen — en aan het eind van de week keur je
          de uren goed. Geen Excel, geen appjes over en weer.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/onboarding"
            className="rounded-full bg-amber px-6 py-3 font-medium text-ink hover:bg-amber-dark transition-colors"
          >
            Maak je omgeving aan
          </Link>
          <Link
            href="/signin"
            className="rounded-full border border-line px-6 py-3 font-medium hover:border-ink transition-colors"
          >
            Ik ben uitgenodigd
          </Link>
        </div>
      </section>

      <section className="border-t border-line bg-ink text-paper">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-3">
          <div>
            <h2 className="font-display text-2xl">Beschikbaarheid</h2>
            <p className="mt-3 text-paper/70">
              Medewerkers vinken per dag of dagdeel aan wanneer ze kunnen —
              net zo simpel als een datumprikker.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl">Rooster</h2>
            <p className="mt-3 text-paper/70">
              Alle beschikbaarheid naast elkaar in één weekoverzicht. Slepen,
              plaatsen, klaar.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl">Uren</h2>
            <p className="mt-3 text-paper/70">
              Medewerkers loggen hun uren, de manager keurt goed of stuurt
              terug — met een reden.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-sm text-ink/50">
        © {new Date().getFullYear()} Shiftje
      </footer>
    </main>
  );
}
