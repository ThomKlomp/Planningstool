import { SITE_ROUTES, countPublicRoutes } from "@/lib/site-routes";
import { listArticles } from "@/lib/articles";

// Pagina's die we bewust niet als link tonen: ze doen iets zodra je ze opent
// (/demo-switch logt je in als demo-account en vervangt dus je eigen sessie) of
// ze werken alleen met een token/id uit een echte link.
const NO_LINK = new Set(["/demo-switch", "/verify-email", "/invite/[token]", "/admin/companies/[id]", "/admin/support/[id]"]);

/** Voorbeeldadres voor een pad met een dynamisch deel, of null als er geen is. */
function exampleFor(path: string, firstArticleSlug: string | null): string | null {
  if (path === "/artikel/[slug]") return firstArticleSlug ? `/artikel/${firstArticleSlug}` : null;
  if (path === "/join/[slug]") return "/join/demo";
  if (path === "/z/[slug]") return "/z/demo";
  return null;
}

export default function AdminPagesOverview() {
  const { total, public: publicCount } = countPublicRoutes();
  const firstArticleSlug = listArticles()[0]?.slug ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Pagina's</h1>
        <p className="text-sm text-ink/50">
          {publicCount} van de {total} pagina's onder shiftje.nl staan openbaar.
        </p>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-ink/60">
        Handmatig bijgehouden overzicht (src/lib/site-routes.ts). Wordt niet automatisch
        gesynchroniseerd met de code. "Openbaar" betekent bereikbaar zonder in te loggen; sommige
        openbare pagina's zijn alleen bruikbaar met een geldige link of token, zie de toelichting.
      </p>

      <div className="mt-8 space-y-8">
        {SITE_ROUTES.map((section) => (
          <div key={section.section}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
              {section.section}
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink text-paper">
                  <tr>
                    <th className="px-4 py-2 font-medium">Pad</th>
                    <th className="px-4 py-2 font-medium">Naam</th>
                    <th className="px-4 py-2 font-medium">Openbaar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {section.routes.map((route) => (
                    <tr key={route.path}>
                      <td className="px-4 py-2 font-mono text-xs text-ink/70">
                        <RouteLink path={route.path} firstArticleSlug={firstArticleSlug} />
                      </td>
                      <td className="px-4 py-2">
                        {route.label}
                        {route.note && (
                          <p className="mt-0.5 text-xs text-ink/40">{route.note}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {route.public ? (
                          <span className="rounded-full bg-awning/10 px-2 py-0.5 text-xs font-medium text-awning">
                            Ja
                          </span>
                        ) : (
                          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium text-ink/60">
                            Nee
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pad als klikbare link die in een nieuw tabblad opent, tenzij er geen veilige link voor is. */
function RouteLink({ path, firstArticleSlug }: { path: string; firstArticleSlug: string | null }) {
  const isDynamic = path.includes("[");
  const href = NO_LINK.has(path) ? null : isDynamic ? exampleFor(path, firstArticleSlug) : path;
  if (!href) return <span>{path}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={isDynamic ? `Opent een voorbeeld: ${href}` : `Opent ${href} in een nieuw tabblad`}
      className="text-awning hover:underline"
    >
      {path} <span aria-hidden>↗</span>
    </a>
  );
}
