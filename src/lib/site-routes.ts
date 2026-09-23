// Handmatig bijgehouden overzicht van alle pagina's onder shiftje.nl, voor het
// adminpaneel (/admin/pages). Geen automatische detectie: dat zou de hele
// app/-map moeten inlezen op de server, wat op sommige hosting-platforms niet
// betrouwbaar werkt en losse routegroepen/dynamische segmenten niet altijd
// goed labelt. Voeg een regel toe zodra je een nieuwe pagina (page.tsx)
// toevoegt.
//
// "public": bereikbaar zonder in te loggen. Dat zegt niets over of de
// pagina ook voor iedereen zinvolle inhoud toont (zie "note" bij
// token-afhankelijke pagina's zoals uitnodigingen).

export type SiteRoute = {
  path: string;
  label: string;
  public: boolean;
  note?: string;
};

export type SiteRouteSection = {
  section: string;
  routes: SiteRoute[];
};

export const SITE_ROUTES: SiteRouteSection[] = [
  {
    section: "Marketing / publiek",
    routes: [
      { path: "/", label: "Homepage", public: true },
      { path: "/privacy", label: "Privacy & bezoekstatistieken", public: true },
      { path: "/voorwaarden", label: "Algemene voorwaarden", public: true },
    ],
  },
  {
    section: "Account & toegang",
    routes: [
      { path: "/signin", label: "Inloggen", public: true },
      { path: "/register", label: "Account registreren", public: true },
      { path: "/verify-email", label: "E-mail verifiëren", public: true, note: "Alleen bruikbaar met geldige token in de link" },
      { path: "/onboarding", label: "Eigen zaak aanmaken", public: false, note: "Vereist inloggen" },
      { path: "/accept-terms", label: "Voorwaarden accepteren", public: false, note: "Vereist inloggen" },
      { path: "/invite/[token]", label: "Uitnodiging accepteren", public: true, note: "Alleen bruikbaar met geldige, niet-verlopen uitnodigingslink" },
      { path: "/join/[slug]", label: "Join-link (zelf aansluiten)", public: true, note: "Alleen bruikbaar met de juiste zaak-link" },
      { path: "/demo-switch", label: "Demo-account inloggen", public: true, note: "Logt automatisch in op de demo-zaak met een vast wachtwoord" },
    ],
  },
  {
    section: "Dashboard (privé, per zaak)",
    routes: [
      { path: "/dashboard", label: "Overzicht", public: false },
      { path: "/dashboard/availability", label: "Beschikbaarheid", public: false },
      { path: "/dashboard/rooster", label: "Rooster", public: false },
      { path: "/dashboard/hours", label: "Uren", public: false },
      { path: "/dashboard/calendar", label: "Agenda-koppeling", public: false },
      { path: "/dashboard/notifications", label: "Meldingen", public: false },
      { path: "/dashboard/account", label: "Mijn account", public: false },
      { path: "/dashboard/settings", label: "Instellingen", public: false },
      { path: "/dashboard/settings/billing", label: "Facturering", public: false },
    ],
  },
  {
    section: "Adminportaal (privé, platform-admin)",
    routes: [
      { path: "/admin", label: "Overzicht", public: false },
      { path: "/admin/companies", label: "Zaken", public: false },
      { path: "/admin/companies/[id]", label: "Zaak-detail", public: false },
      { path: "/admin/users", label: "Gebruikers", public: false },
      { path: "/admin/support", label: "Support-chats", public: false },
      { path: "/admin/support/[id]", label: "Support-chat-detail", public: false },
      { path: "/admin/discount-codes", label: "Kortingscodes", public: false },
      { path: "/admin/demo-company", label: "Demo-zaak beheren", public: false },
      { path: "/admin/visits", label: "Bezoekers", public: false },
      { path: "/admin/pages", label: "Pagina's (dit overzicht)", public: false },
    ],
  },
];

export function countPublicRoutes() {
  const all = SITE_ROUTES.flatMap((s) => s.routes);
  return { total: all.length, public: all.filter((r) => r.public).length };
}
