import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-28 text-center">
        <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-medium text-amber-dark">
          Fout 404
        </span>
        <h1 className="mt-5 font-display text-3xl md:text-4xl">
          Deze pagina is gesloten wegens personeelstekort.
        </h1>
        <p className="mt-4 max-w-md text-ink/70">
          Niemand kon 'm bemannen vandaag. Precies het soort probleem waar Shiftje voor is
          gemaakt, toevallig.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-amber px-6 py-3 font-medium text-ink hover:bg-amber-dark transition-colors"
          >
            Terug naar de zaak
          </Link>
          <Link
            href="/signin"
            className="rounded-full border border-line px-6 py-3 font-medium hover:border-ink transition-colors"
          >
            Inloggen
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
