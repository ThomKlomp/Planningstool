import type { Metadata } from "next";
import Link from "next/link";
import { CLASSIC_THEME, THEMES } from "@/lib/home-themes";

export const metadata: Metadata = {
  title: "Homepage-ontwerpen",
  robots: { index: false, follow: false },
};

export default function OntwerpenPage() {
  const all = [{ ...CLASSIC_THEME, href: "/" }, ...THEMES.map((t) => ({ ...t, href: `/ontwerpen/${t.id}` }))];
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-3xl">Homepage-ontwerpen</h1>
      <p className="mt-3 max-w-xl text-ink/70">
        Zelfde inhoud en functies, zes verschillende uitstralingen. Klik een ontwerp open
        om de hele pagina te zien.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {all.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className="block rounded-2xl border border-line bg-surface p-5 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex h-14 overflow-hidden rounded-lg border border-line">
              {t.swatches.map((c) => (
                <div key={c} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <h2 className="mt-4 font-display text-xl">{t.name}</h2>
            <p className="mt-1 text-sm text-ink/70">{t.tagline}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
