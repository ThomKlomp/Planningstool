import Link from "next/link";

// minimal: geen links, alleen een regel tekst (voor losse artikelen).
export default function SiteFooter({ minimal = false }: { minimal?: boolean }) {
  if (minimal) {
    return (
      <footer className="border-t border-line">
        <p className="mx-auto max-w-6xl px-6 py-8 text-sm text-ink/50">
          © {new Date().getFullYear()} Shiftje
        </p>
      </footer>
    );
  }
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-ink/60">
        <Link href="/" className="font-display text-base text-ink">
          Shiftje
        </Link>
        <nav className="flex flex-wrap items-center gap-5">
          <Link href="/#functies" className="hover:text-ink">
            Functies
          </Link>
          <Link href="/#prijs" className="hover:text-ink">
            Prijzen
          </Link>
          <Link href="/over-ons" className="hover:text-ink">
            Over ons
          </Link>
          <Link href="/signin" className="hover:text-ink">
            Inloggen
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/voorwaarden" className="hover:text-ink">
            Voorwaarden
          </Link>
        </nav>
        <span>© {new Date().getFullYear()} Shiftje, gemaakt voor lokale horecazaken</span>
      </div>
    </footer>
  );
}
