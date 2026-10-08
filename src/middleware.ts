import { NextResponse, type NextRequest } from "next/server";
import { mainOrigin, rootDomain, slugFromHost } from "@/lib/company-url";

// Op een zaak-subdomein (cafedepub.shiftje.nl) horen alleen het dashboard, de
// inlogpagina van de zaak en de API thuis. Alle andere (marketing)pagina's
// staan op het hoofdadres; dat voorkomt dubbele kopieën voor Google.
const SUBDOMAIN_PATHS = ["/dashboard", "/z/", "/api/", "/_next/", "/icon", "/favicon", "/accept-terms", "/demo-switch"];

// NextAuth-sessiecookie (met en zonder __Secure-prefix).
const SESSION_COOKIES = ["__Secure-next-auth.session-token", "next-auth.session-token"];

export function middleware(req: NextRequest) {
  if (!rootDomain()) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  const slug = slugFromHost(req.headers.get("host"));

  // Het volledige pad meegeven, zodat het dashboard bij een redirect naar het
  // juiste subdomein de diepe link (bv. /dashboard/rooster?week=...) behoudt.
  const headers = new Headers(req.headers);
  headers.set("x-url", `${pathname}${search}`);

  if (slug) {
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = `/z/${slug}`;
      return NextResponse.rewrite(url, { request: { headers } });
    }
    if (!SUBDOMAIN_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
      return NextResponse.redirect(`${mainOrigin()}${pathname}${search}`);
    }
    return NextResponse.next({ request: { headers } });
  }

  // Hoofdadres: wie al is ingelogd, krijgt bij het openen van de homepage
  // direct het dashboard (dat stuurt door naar het subdomein van de zaak).
  // Alleen op aanwezigheid van het cookie; de dashboard-pagina controleert
  // zelf of de sessie nog geldig is.
  if (pathname === "/" && SESSION_COOKIES.some((c) => req.cookies.has(c))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Geen statische bestanden en afbeeldingen.
  matcher: ["/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]+$).*)"],
};

