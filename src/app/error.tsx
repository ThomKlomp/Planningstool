"use client";

import Link from "next/link";

// Next.js App Router error boundary: vangt onverwachte crashes op elke
// pagina op (het "500"-scherm). Moet "use client" zijn en mag geen andere
// server-only imports gebruiken.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center text-ink">
      <span className="rounded-full bg-amber/20 px-3 py-1 text-xs font-medium text-amber-dark">
        Er ging iets mis
      </span>
      <h1 className="mt-5 font-display text-3xl">We zijn even in de keuken bezig.</h1>
      <p className="mt-4 max-w-md text-ink/70">
        Er ging iets mis aan onze kant. Probeer het nog eens, of kom over een minuutje terug.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-amber px-6 py-3 font-medium text-ink hover:bg-amber-dark transition-colors"
        >
          Probeer opnieuw
        </button>
        <Link
          href="/"
          className="rounded-full border border-line px-6 py-3 font-medium hover:border-ink transition-colors"
        >
          Naar de homepage
        </Link>
      </div>
    </main>
  );
}
