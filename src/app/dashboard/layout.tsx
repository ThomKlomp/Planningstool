import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { companyOrigin, rootDomain } from "@/lib/company-url";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/sign-out-button";
import RememberCompany from "@/components/remember-company";
import CancellationCountdown from "./cancellation-countdown";
import DashboardNav, { type DashboardNavItem } from "./dashboard-nav";

// Geen zoekresultaat: ingelogde of token-afhankelijke pagina. De standaardtitel
// is de naam van de zaak ("<Zaaknaam> - Shiftje"), zodat de browsergeschiedenis
// en bladwijzers de zaak herkennen. Pagina's met een eigen titel overschrijven dit.
export async function generateMetadata(): Promise<Metadata> {
  const session = await getServerSession(authOptions).catch(() => null);
  const companyId = session?.user?.memberships?.[0]?.companyId;
  const company = companyId
    ? await prisma.company.findUnique({ where: { id: companyId }, select: { name: true } })
    : null;
  return {
    title: company ? { absolute: `${company.name} - Shiftje` } : undefined,
    robots: { index: false, follow: false },
  };
}

// Zonder dit blijft Next.js de vorige render van deze layout (en dus het
// aantal ongelezen meldingen) een tijdje hergebruiken bij client-side
// navigatie, ook nadat een melding al als gelezen is gemarkeerd. Force-
// dynamic zorgt dat unreadCount bij elke navigatie binnen /dashboard opnieuw
// wordt opgehaald.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, membership } = await requireMembership();

  // Subdomeinen per zaak: het dashboard hoort op <zaak>.shiftje.nl. Wie het
  // via het hoofdadres opent (bv. een link uit een e-mail) gaat daarheen door,
  // met behoud van het pad.
  if (rootDomain()) {
    const h = headers();
    const expected = new URL(companyOrigin(membership.companySlug));
    if (h.get("host")?.toLowerCase() !== expected.host) {
      redirect(`${expected.origin}${h.get("x-url") ?? "/dashboard"}`);
    }
  }

  const [unreadCount, company] = await Promise.all([
    prisma.notification.count({
      where: { membershipId: membership.membershipId, read: false },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { subscriptionStatus: true, trialEndsAt: true, currentPeriodEnd: true },
    }),
  ]);

  const trialDaysLeft = company?.trialEndsAt
    ? Math.ceil((company.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  const navItems: DashboardNavItem[] = [
    { href: "/dashboard", label: "Overzicht" },
    { href: "/dashboard/availability", label: "Beschikbaarheid" },
    { href: "/dashboard/rooster", label: "Rooster" },
    { href: "/dashboard/hours", label: "Uren" },
    { href: "/dashboard/calendar", label: "Agenda-koppeling" },
    { href: "/dashboard/notifications", label: "Meldingen", badge: unreadCount },
    ...(membership.role === "OWNER" || membership.role === "MANAGER"
      ? [{ href: "/dashboard/settings", label: "Instellingen" }]
      : []),
    { href: "/dashboard/account", label: "Mijn account" },
    ...(session.user.isPlatformAdmin ? [{ href: "/admin", label: "Adminportaal" }] : []),
  ];

  return (
    <div className="min-h-screen bg-paper text-ink sm:flex">
      <RememberCompany slug={membership.companySlug} />
      <aside className="sticky top-0 z-40 border-b border-line bg-white sm:flex sm:h-screen sm:w-60 sm:flex-col sm:justify-between sm:overflow-y-auto sm:border-b-0 sm:border-r">
        <div>
          <div className="h-1.5 bg-orange" aria-hidden />
          <div className="relative">
            <div className="px-4 py-4 pr-28 sm:px-4 sm:py-6 sm:pr-4">
              <p className="font-display text-lg sm:truncate">{membership.companyName}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-orange-deep">
                {roleLabel(membership.role)}
              </p>
            </div>
            <DashboardNav items={navItems} />
          </div>
        </div>
        <div className="hidden border-t border-line px-4 py-3 sm:block sm:px-4 sm:py-6">
          <p className="min-w-0 truncate text-xs text-ink/50 sm:mb-2">
            {session.user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1">
        {(() => {
          const periodEnd = company?.currentPeriodEnd;
          const withinCancellationWindow =
            membership.role === "OWNER" &&
            company?.subscriptionStatus === "CANCELED" &&
            periodEnd &&
            periodEnd.getTime() - Date.now() <= 48 * 60 * 60 * 1000;

          if (withinCancellationWindow && periodEnd) {
            // Laatste 48 uur van een opgezegd abonnement: een echt aftellende
            // melding i.p.v. de gewone statische tekst. Alleen de eigenaar
            // kan dit oplossen, dus alleen die krijgt 'm te zien (net als de
            // gewone gele banner hieronder).
            return <CancellationCountdown periodEndIso={periodEnd.toISOString()} />;
          }

          if (
            membership.role === "OWNER" &&
            company &&
            (company.subscriptionStatus === "PAST_DUE" ||
              company.subscriptionStatus === "CANCELED" ||
              (company.subscriptionStatus === "TRIALING" &&
                trialDaysLeft !== null &&
                trialDaysLeft <= 3))
          ) {
            return (
              <div className="border-b border-amber/40 bg-amber/10 px-4 py-2.5 text-sm sm:px-8">
                <Link href="/dashboard/settings/billing" className="text-amber-dark hover:underline">
                  {company.subscriptionStatus === "PAST_DUE"
                    ? "De laatste betaling is mislukt, regel dit om toegang te houden →"
                    : company.subscriptionStatus === "CANCELED"
                    ? "Je abonnement is opgezegd, kies een plan om door te gaan →"
                    : trialDaysLeft !== null && trialDaysLeft <= 0
                    ? "Je proefperiode is afgelopen, kies een abonnement →"
                    : `Happy hour bijna voorbij: nog ${trialDaysLeft} ${trialDaysLeft === 1 ? "dag" : "dagen"} proefperiode, kies alvast een abonnement →`}
                </Link>
              </div>
            );
          }

          return null;
        })()}
        <main className="app-main px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function roleLabel(role: string) {
  switch (role) {
    case "OWNER":
      return "Eigenaar";
    case "MANAGER":
      return "Manager";
    default:
      return "Medewerker";
  }
}
