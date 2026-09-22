import Link from "next/link";

/** Compacte hero voor de subpagina's (/voor/*, /vergelijk, gidsen): geen full-page hero, wel duidelijke H1 + CTA. */
export default function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-4 pt-14 md:pt-20">
      <p className="mb-3 text-sm font-medium text-awning">{eyebrow}</p>
      <h1 className="font-display text-3xl leading-tight md:text-4xl">{title}</h1>
      <p className="mt-5 text-lg text-ink/70">{intro}</p>
      <div className="mt-7 flex flex-wrap gap-4">
        <Link
          href="/onboarding"
          className="rounded-full bg-amber px-6 py-3 font-medium text-ink hover:bg-amber-dark transition-colors"
        >
          Begin gratis, 7 dagen
        </Link>
        <Link
          href="/#prijs"
          className="rounded-full border border-line px-6 py-3 font-medium hover:border-ink transition-colors"
        >
          Bekijk de prijzen
        </Link>
      </div>
    </section>
  );
}
