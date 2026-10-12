import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { MORE_FEATURES } from "@/lib/features-list";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

const TITLE = "Functies van Shiftje";
const DESCRIPTION =
  "Alle functies van Shiftje op een rij: open diensten, terugkerende diensten, weer bij het rooster, rooster in je agenda, uren exporteren en meer. Zonder gedoe.";

// Pas deze datum aan wanneer de inhoud van de pagina echt wijzigt.
const LAST_UPDATED = "2026-10-12";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/functies" },
  // Een openGraph/twitter in een pagina vervangt die van de layout als geheel,
  // dus de overige velden staan hier opnieuw.
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Shiftje",
    url: "/functies",
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Functies van Shiftje" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    images: ["/api/og"],
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${SITE_URL}/functies#webpage`,
  url: `${SITE_URL}/functies`,
  name: TITLE,
  description: DESCRIPTION,
  inLanguage: "nl-NL",
  dateModified: LAST_UPDATED,
  isPartOf: { "@id": `${SITE_URL}/#website` },
};

export default function FunctiesPage() {
  return (
    <main className="page-sage min-h-screen overflow-x-clip text-ink">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-14 md:pt-20">
        <p className="mb-3 text-sm font-medium text-terra">Functies</p>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          En nog meer, zonder gedoe
        </h1>
        <ul className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MORE_FEATURES.map((f) => (
            <li key={f.title} className="rounded-2xl bg-white p-6">
              <h2 className="font-display text-lg font-bold">{f.title}</h2>
              <p className="mt-2 leading-relaxed text-ink/70">{f.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href="/onboarding"
            className="rounded-full bg-terra px-7 py-3.5 text-base font-bold text-white transition-colors hover:bg-terra-dark"
          >
            Begin gratis, 7 dagen
          </Link>
          <Link
            href="/#functies"
            className="rounded-full bg-white px-7 py-3.5 text-base font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Bekijk de hoofdfuncties
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
