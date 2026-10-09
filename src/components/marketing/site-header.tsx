import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function HomeLink({ track }: { track?: string }) {
  return (
    <Link href="/" data-track={track} className="flex items-center gap-2.5 font-display text-2xl font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-terra">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 3v8a3 3 0 0 0 3 3v7M10 3v6M13 3v8a3 3 0 0 1-3 3M18 3c-2 2-2 6 0 8v10" />
            </svg>
          </span>
          Shiftje
        </Link>
  );
}

// minimal: alleen het logo (naar de homepage), voor artikelen die als losse,
// neutrale bron moeten aanvoelen. homeTrack telt de klik op het logo.
export default async function SiteHeader({
  minimal = false,
  homeTrack,
}: {
  minimal?: boolean;
  homeTrack?: string;
}) {
  if (minimal) {
    return (
      <header className="sticky top-0 z-50 border-b border-line/60 bg-sage/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <HomeLink track={homeTrack} />
        </div>
      </header>
    );
  }

  // Ingelogd? Dan gaan "Inloggen" en "Start met je zaak" direct naar je eigen
  // omgeving, in plaats van opnieuw het inlog- of aanmaakscherm te tonen.
  const session = await getServerSession(authOptions).catch(() => null);
  const loggedIn = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-sage/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <HomeLink track={homeTrack} />
        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-6">
          <Link href="/#functies" className="hidden hover:text-terra md:inline">
            Functies
          </Link>
          <Link href="/#faq" className="hidden hover:text-terra md:inline">
            Vragen
          </Link>
          <Link href="/#prijs" className="hidden hover:text-terra md:inline">
            Prijzen
          </Link>
          <Link href="/over-ons" className="hidden hover:text-terra md:inline">
            Over ons
          </Link>
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="whitespace-nowrap rounded-full bg-ink px-3 py-2.5 text-xs font-bold text-paper transition-colors hover:bg-terra sm:px-4 sm:text-sm"
            >
              Naar je zaak
            </Link>
          ) : (
            <>
              <Link href="/signin" className="px-2 py-2 hover:text-terra">
                Inloggen
              </Link>
              <Link
                href="/onboarding"
                data-track="cta-header"
                className="whitespace-nowrap rounded-full bg-ink px-3 py-2.5 text-xs font-bold text-paper transition-colors hover:bg-terra sm:px-4 sm:text-sm"
              >
                Start met je zaak
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
