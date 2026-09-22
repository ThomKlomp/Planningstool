import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function countInPeriod(days: number) {
  return prisma.pageView.count({ where: { createdAt: { gte: since(days) } } });
}

export default async function VisitsPage() {
  const periodDays = 30;
  const from = since(periodDays);

  const [total24h, total7d, total30d, views, distinctCompanies] = await Promise.all([
    countInPeriod(1),
    countInPeriod(7),
    countInPeriod(periodDays),
    prisma.pageView.findMany({
      where: { createdAt: { gte: from } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: from }, companyId: { not: null } },
      select: { companyId: true },
      distinct: ["companyId"],
    }),
  ]);

  const withCompany = views.filter((v) => v.companyId);
  const anonymous = views.length - withCompany.length;

  const topPages = topCounts(views.map((v) => v.path));
  const topReferrers = topCounts(
    views.map((v) => v.referrer || (v.utmSource ? `utm: ${v.utmSource}` : "Direct / onbekend"))
  );
  const topCountries = topCounts(views.map((v) => countryLabel(v.country)));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Bezoekers</h1>
        <p className="text-sm text-ink/50">
          Publieke pagina's (homepage, inloggen, onboarding). Geen cookies, geen IP-adressen.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Laatste 24 uur" value={total24h} />
        <Stat label="Laatste 7 dagen" value={total7d} />
        <Stat label="Laatste 30 dagen" value={total30d} />
        <Stat label="Zaken die langskwamen (30 dgn)" value={distinctCompanies.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="Meest bezochte pagina's (30 dgn)">
          <CountList items={topPages} />
        </Panel>
        <Panel title="Verwijzende site (30 dgn)">
          <CountList items={topReferrers} />
        </Panel>
        <Panel title="Land van herkomst (30 dgn)">
          <CountList items={topCountries} />
        </Panel>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-white p-5">
        <p className="text-sm text-ink/60">
          Van de laatste {views.length} bezoeken (max. 500 getoond) kwamen er{" "}
          <strong className="text-ink">{withCompany.length}</strong> van iemand die al bij een zaak hoort,
          en <strong className="text-ink">{anonymous}</strong> van een anonieme bezoeker.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="px-4 py-2 font-medium">Tijd</th>
              <th className="px-4 py-2 font-medium">Pagina</th>
              <th className="px-4 py-2 font-medium">Verwijzer</th>
              <th className="px-4 py-2 font-medium">Land</th>
              <th className="px-4 py-2 font-medium">Zaak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {views.slice(0, 100).map((v) => (
              <tr key={v.id}>
                <td className="whitespace-nowrap px-4 py-2 text-ink/60">
                  {v.createdAt.toLocaleString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{v.path}</td>
                <td className="px-4 py-2 text-ink/60">
                  {v.referrer || (v.utmSource ? `utm: ${v.utmSource}` : "—")}
                </td>
                <td className="px-4 py-2 text-ink/60">{countryLabel(v.country)}</td>
                <td className="px-4 py-2">
                  {v.companyName ? (
                    <span className="rounded-full bg-awning/10 px-2 py-0.5 text-xs text-awning">
                      {v.companyName}
                      {v.role ? ` (${v.role === "OWNER" ? "eigenaar" : v.role === "MANAGER" ? "manager" : "medewerker"})` : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-ink/30">anoniem</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {views.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-ink/40">
            Nog geen bezoeken geregistreerd.
          </p>
        )}
      </div>
    </div>
  );
}

// Landcode -> leesbare naam voor Nederlandse gebruikers; onbekend/leeg apart
// gelabeld zodat het niet als "0 bezoekers" verdwijnt in de lijst.
const COUNTRY_NAMES: Record<string, string> = {
  NL: "Nederland",
  BE: "België",
  DE: "Duitsland",
  GB: "Verenigd Koninkrijk",
  US: "Verenigde Staten",
  FR: "Frankrijk",
};

function countryLabel(code: string | null) {
  if (!code) return "Onbekend";
  return COUNTRY_NAMES[code] ?? code;
}

function topCounts(values: string[], limit = 8) {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs text-ink/50">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function CountList({ items }: { items: [string, number][] }) {
  if (items.length === 0) return <p className="text-sm text-ink/40">Nog geen data.</p>;
  const max = items[0][1];
  return (
    <ul className="space-y-2">
      {items.map(([label, count]) => (
        <li key={label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate font-mono text-xs text-ink/70" title={label}>
            {label}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-awning" style={{ width: `${(count / max) * 100}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right text-ink/50">{count}</span>
        </li>
      ))}
    </ul>
  );
}
