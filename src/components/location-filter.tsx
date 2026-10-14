import Link from "next/link";

// Kiezer "Alle locaties | Centrum | Haven" boven rooster, beschikbaarheid, uren en
// medewerkers. Een gewone link met ?loc=<id>, zodat de keuze in de URL staat en
// overal hetzelfde werkt. Toont niets als er minder dan twee locaties te kiezen zijn.
export default function LocationFilter({
  basePath,
  params,
  locations,
  active,
  allowAll = true,
}: {
  basePath: string;
  params: Record<string, string | undefined>; // overige zoekparameters (week, view, ...)
  locations: { id: string; name: string; color: string }[];
  active: string;
  allowAll?: boolean;
}) {
  if (locations.length < 2) return null;

  const href = (loc: string) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "loc") q.set(k, v);
    if (loc) q.set("loc", loc);
    const qs = q.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const chip = (isActive: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${
      isActive ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink/70 hover:border-ink"
    }`;

  return (
    <div className="flex gap-1.5 overflow-x-auto" aria-label="Locatie">
      {allowAll && (
        <Link href={href("")} className={chip(active === "")}>
          Alle locaties
        </Link>
      )}
      {locations.map((l) => (
        <Link key={l.id} href={href(l.id)} className={chip(active === l.id)} scroll={false}>
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
            style={{ backgroundColor: l.color }}
            aria-hidden
          />
          {l.name}
        </Link>
      ))}
    </div>
  );
}
