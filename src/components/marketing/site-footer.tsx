import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-ink/50">
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
          <Link href="/signin" className="hover:text-ink">
            Inloggen
          </Link>
        </nav>
        <span>© {new Date().getFullYear()} Shiftje — gemaakt voor kleine horecazaken</span>
      </div>
    </footer>
  );
}
