import Link from "next/link";

// Logo linksboven op inlog-, registratie- en onboardingpagina's, zodat
// mensen nog terug kunnen naar de homepage. ?home=1 voorkomt dat de
// middleware ingelogde of terugkerende bezoekers direct doorstuurt.
export default function AuthLogo() {
  return (
    <Link
      href="/?home=1"
      className="absolute left-6 top-5 flex items-center gap-2.5 font-display text-xl font-bold text-ink"
    >
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
