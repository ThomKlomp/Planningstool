import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatWidget from "@/components/chat-widget";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
});

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Shiftje: roosterprogramma voor kleine horeca",
    template: "%s | Shiftje",
  },
  description:
    "Rooster software voor kleine horeca: beschikbaarheid, personeelsplanning en uren op één plek. Eén vaste prijs per zaak, geen kosten per medewerker. Begin gratis.",
  keywords: [
    "rooster software horeca",
    "personeelsplanning horeca",
    "dienstroosterapp",
    "rooster app kleine horeca",
    "personeelsplanning café",
    "planning restaurant",
  ],
  authors: [{ name: "Shiftje" }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Shiftje",
    url: SITE_URL,
    title: "Shiftje: roosterprogramma voor kleine horeca",
    description:
      "Beschikbaarheid, personeelsplanning en uren op één plek. Eén vaste prijs per zaak, geen kosten per medewerker.",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "Shiftje — rooster software voor kleine horeca" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shiftje: roosterprogramma voor kleine horeca",
    description: "Beschikbaarheid, personeelsplanning en uren op één plek voor kleine horecazaken.",
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
    <html lang="nl" className={`${spaceGrotesk.variable} ${plex.variable}`}>
      <body className="font-body">
        {children}
        <ChatWidget
          defaultName={session?.user?.name ?? ""}
          defaultEmail={session?.user?.email ?? ""}
          isLoggedIn={Boolean(session?.user)}
        />
      </body>
    </html>
  );
}
