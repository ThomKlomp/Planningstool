import Link from "next/link";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/sign-out-button";
import DashboardNav, { type DashboardNavItem } from "./dashboard-nav";

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

  const [unreadCount, company] = await Promise.all([
    prisma.notification.count({
      where: { membershipId: membership.membershipId, read: false },
    }),
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { subscriptionStatus: true, trialEndsAt: true },
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
      <aside className="sticky top-0 z-40 border-b border-line bg-white sm:flex sm:h-screen sm:w-60 sm:flex-col sm:justify-between sm:overflow-y-auto sm:border-b-0 sm:border-r">
        <div>
          <div className="px-4 py-4 sm:px-4 sm:py-6">
            <p className="truncate font-display text-lg">{membership.companyName}</p>
            <p className="text-xs uppercase tracking-wide text-ink/40">
              {roleLabel(membership.role)}
            </p>
          </div>
          <DashboardNav items={navItems} />
        </div>
        <div className="hidden border-t border-line px-4 py-3 sm:block sm:px-4 sm:py-6">
          <p className="min-w-0 truncate text-xs text-ink/50 sm:mb-2">
            {session.user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>
      <div className="flex-1">
        {membership.role === "OWNER" &&
          company &&
          (company.subscriptionStatus === "PAST_DUE" ||
            company.subscriptionStatus === "CANCELED" ||
            (company.subscriptionStatus === "TRIALING" &&
              trialDaysLeft !== null &&
              trialDaysLeft <= 3)) && (
            <div className="border-b border-amber/40 bg-amber/10 px-4 py-2.5 text-sm sm:px-8">
              <Link href="/dashboard/settings/billing" className="text-amber-dark hover:underline">
                {company.subscriptionStatus === "PAST_DUE"
                  ? "De laatste betaling is mislukt, regel dit om toegang te houden →"
                  : company.subscriptionStatus === "CANCELED"
                  ? "Je abonnement is opgezegd, kies een plan om door te gaan →"
                  : trialDaysLeft !== null && trialDaysLeft <= 0
                  ? "Je proefperiode is afgelopen, kies een abonnement →"
                  : `Nog ${trialDaysLeft} ${trialDaysLeft === 1 ? "dag" : "dagen"} proefperiode, kies alvast een abonnement →`}
              </Link>
            </div>
          )}
        <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
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
