import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "Algemene voorwaarden",
  description: "Algemene voorwaarden van Shiftje.",
  alternates: { canonical: "/voorwaarden" },
  robots: { index: false, follow: true },
};

export default function VoorwaardenPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl">Algemene voorwaarden</h1>
        <p className="mt-4 rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber-dark">
          Dit is een eerste, beknopte versie zodat we onze gebruikers meteen duidelijkheid kunnen
          bieden. We laten deze tekst op korte termijn nog juridisch nakijken en vullen 'm verder
          aan; kom er dus gerust af en toe op terug.
        </p>

        <h2 className="mt-8 font-display text-xl">1. Wie we zijn</h2>
        <p className="mt-3 text-ink/70">
          Shiftje is een planningstool voor kleine horecazaken: beschikbaarheid, rooster en uren op
          één plek. Door een account aan te maken ga je akkoord met deze voorwaarden en met ons{" "}
          <a href="/privacy" className="text-awning hover:underline">privacybeleid</a>.
        </p>

        <h2 className="mt-8 font-display text-xl">2. Je account</h2>
        <p className="mt-3 text-ink/70">
          Je bent zelf verantwoordelijk voor de juistheid van de gegevens die je invult en voor het
          geheimhouden van je inloggegevens. Merk je ongeautoriseerd gebruik van je account op, laat
          het ons dan zo snel mogelijk weten.
        </p>

        <h2 className="mt-8 font-display text-xl">3. Gebruik van Shiftje</h2>
        <p className="mt-3 text-ink/70">
          Je gebruikt Shiftje alleen voor de personeelsplanning van je eigen zaak, op een manier die
          niet in strijd is met de wet en die andere gebruikers niet hindert.
        </p>

        <h2 className="mt-8 font-display text-xl">4. Betaling</h2>
        <p className="mt-3 text-ink/70">
          Voor een betaald abonnement gelden de prijzen zoals vermeld op de website op het moment van
          afsluiten. Betalingen lopen via onze betaalprovider. Bij een jaarabonnement kan bij groei
          naar een hogere staffel een bijbetaling verschuldigd zijn, zoals toegelicht bij je
          facturering.
        </p>

        <h2 className="mt-8 font-display text-xl">5. Opzeggen</h2>
        <p className="mt-3 text-ink/70">
          Je kunt je abonnement op ieder moment opzeggen via je instellingen. Een lopende betaalperiode
          wordt niet naar rato terugbetaald, tenzij we samen anders afspreken.
        </p>

        <h2 className="mt-8 font-display text-xl">6. Aansprakelijkheid</h2>
        <p className="mt-3 text-ink/70">
          We doen ons best om Shiftje betrouwbaar te laten werken, maar kunnen geen ononderbroken
          beschikbaarheid garanderen. Voor zover wettelijk toegestaan is onze aansprakelijkheid
          beperkt tot het bedrag dat je in de voorafgaande 12 maanden aan ons hebt betaald.
        </p>

        <h2 className="mt-8 font-display text-xl">7. Wijzigingen</h2>
        <p className="mt-3 text-ink/70">
          We kunnen deze voorwaarden aanpassen. Bij een belangrijke wijziging laten we dat vooraf
          weten.
        </p>

        <h2 className="mt-8 font-display text-xl">8. Toepasselijk recht</h2>
        <p className="mt-3 text-ink/70">
          Op deze voorwaarden is Nederlands recht van toepassing.
        </p>

        <h2 className="mt-8 font-display text-xl">Vragen</h2>
        <p className="mt-3 text-ink/70">
          Vragen over deze voorwaarden? Neem contact met ons op via het chat-bolletje rechtsonder.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
