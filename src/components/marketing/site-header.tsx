import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-xl">
          Shiftje
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/signin" className="hover:text-awning">
            Inloggen
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-ink px-4 py-2 text-paper hover:bg-awning transition-colors"
          >
            Start met je zaak
          </Link>
        </nav>
      </div>
    </header>
  );
}
