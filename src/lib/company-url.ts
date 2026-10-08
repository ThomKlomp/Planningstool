// Subdomein per zaak (bv. cafedepub.shiftje.nl). Staat uit zolang ROOT_DOMAIN
// niet is ingesteld: dan werkt alles zoals voorheen op één adres.
//
// Edge-veilig (geen Prisma o.i.d.): wordt ook door de middleware gebruikt.

/** Subdomeinen die geen zaak zijn. */
export const RESERVED_SUBDOMAINS = [
  "www", "app", "admin", "api", "mail", "smtp", "ftp", "static", "assets",
  "status", "support", "help", "blog", "docs", "dev", "test", "staging", "demo",
];

export function rootDomain(): string | null {
  const root = process.env.ROOT_DOMAIN?.trim().toLowerCase();
  return root || null;
}

function mainUrl(): URL {
  return new URL(process.env.NEXTAUTH_URL || "http://localhost:3000");
}

/** Hoofdadres, bv. https://shiftje.nl */
export function mainOrigin(): string {
  return mainUrl().origin;
}

/** Adres van een zaak, bv. https://cafedepub.shiftje.nl (zonder ROOT_DOMAIN: hoofdadres). */
export function companyOrigin(slug: string): string {
  if (!rootDomain()) return mainOrigin();
  const main = mainUrl();
  return `${main.protocol}//${slug}.${main.host}`;
}

/** Zaak-slug uit een hostnaam ("cafedepub.shiftje.nl" -> "cafedepub"), of null voor het hoofdadres. */
export function slugFromHost(host: string | null | undefined): string | null {
  const root = rootDomain();
  if (!root || !host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (!hostname.endsWith(`.${root}`)) return null;
  const sub = hostname.slice(0, -(root.length + 1));
  if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.includes(sub)) return null;
  return sub;
}

/**
 * Laat alleen relatieve paden of adressen binnen het eigen domein door, zodat
 * ?callbackUrl= nooit naar een vreemde site kan sturen.
 */
export function safeCallbackUrl(url: string | null | undefined, fallback = "/dashboard"): string {
  if (!url) return fallback;
  if (url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) return url;
  try {
    const u = new URL(url);
    const main = mainUrl();
    const root = rootDomain();
    if (u.origin === main.origin) return url;
    if (root && u.protocol === main.protocol && u.hostname.endsWith(`.${root}`) && u.port === main.port) {
      return url;
    }
  } catch {
    // ongeldige URL: terugvallen
  }
  return fallback;
}
