import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ChatWidget from "@/components/chat-widget";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
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
    <html lang="nl" className={`${fraunces.variable} ${plex.variable}`}>
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
