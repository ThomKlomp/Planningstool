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

export const metadata: Metadata = {
  title: "Shiftje — planning voor kleine horeca",
  description:
    "Beschikbaarheid, rooster en uren op één plek. Gemaakt voor kleinere horecazaken.",
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
