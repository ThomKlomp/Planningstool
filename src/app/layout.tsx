import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Figtree } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatWidget from "@/components/chat-widget";
import PageViewTracker from "@/components/page-view-tracker";
import CookieConsentBanner from "@/components/cookie-consent-banner";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["600", "700", "800"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

// Organisatie en website: overal dezelfde omschrijving (entity-consistentie).
// Alleen bevestigde gegevens: geen e-mail, logo of sociale profielen tot die
// bestaan.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Shiftje",
  legalName: "Shiftje",
  url: SITE_URL,
  description: "Shiftje, roostersoftware voor lokale horeca",
  identifier: {
    "@type": "PropertyValue",
    propertyID: "KvK",
    value: "95993509",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Shiftje",
  url: SITE_URL,
  inLanguage: "nl-NL",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shiftje: roosterprogramma voor lokale horeca",
    template: "%s | Shiftje",
  },
  description:
    "Rooster software voor lokale horeca: beschikbaarheid, personeelsplanning en uren op één plek. Eén vaste prijs per zaak, geen kosten per medewerker. Begin gratis.",
  authors: [{ name: "Shiftje" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Shiftje",
    title: "Shiftje: roosterprogramma voor lokale horeca",
    description:
      "Beschikbaarheid, personeelsplanning en uren op één plek. Eén vaste prijs per zaak, geen kosten per medewerker.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Shiftje: rooster software voor lokale horeca" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shiftje: roosterprogramma voor lokale horeca",
    description: "Beschikbaarheid, personeelsplanning en uren op één plek voor lokale horecazaken.",
    images: ["/api/og"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions).catch(() => null);

  return (
    <html lang="nl" className={`${fraunces.variable} ${figtree.variable}`}>
      <body className="font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
        {/* Cookiebanner staat voorlopig on hold (niet verwijderd, alleen
            hier uitgecommentarieerd. Component en /privacy staan klaar. */}
        {/* <CookieConsentBanner /> */}
        <ChatWidget
          defaultName={session?.user?.name ?? ""}
          defaultEmail={session?.user?.email ?? ""}
          isLoggedIn={Boolean(session?.user)}
        />
      </body>
    </html>
  );
}
