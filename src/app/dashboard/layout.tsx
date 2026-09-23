import Link from "next/link";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/sign-out-button";

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

  return (
    <div className="min-h-screen bg-paper text-ink sm:flex">
      <aside className="border-b border-line bg-white sm:sticky sm:top-0 sm:flex sm:h-screen sm:w-60 sm:flex-col sm:justify-between sm:overflow-y-auto sm:border-b-0 sm:border-r">
        <div>
          <div className="px-4 py-4 sm:px-4 sm:py-6">
            <p className="truncate font-display text-lg">{membership.companyName}</p>
            <p className="text-xs uppercase tracking-wide text-ink/40">
              {roleLabel(membership.role)}
            </p>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-line px-2 py-2 text-sm sm:flex-col sm:gap-0 sm:space-y-1 sm:overflow-visible sm:border-t-0 sm:px-2 sm:py-0">
            <NavLink href="/dashboard">Overzicht</NavLink>
            <NavLink href="/dashboard/availability">Beschikbaarheid</NavLink>
            <NavLink href="/dashboard/rooster">Rooster</NavLink>
            <NavLink href="/dashboard/hours">Uren</NavLink>
            <NavLink href="/dashboard/calendar">Agenda-koppeling</NavLink>
            <NavLink href="/dashboard/notifications">
              Meldingen
              {unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber px-1 text-[10px] font-semibold text-ink">
                  {unreadCount}
                </span>
              )}
            </NavLink>
            {(membership.role === "OWNER" || membership.role === "MANAGER") && (
              <NavLink href="/dashboard/settings">Instellingen</NavLink>
            )}
            <NavLink href="/dashboard/account">Mijn account</NavLink>
            {session.user.isPlatformAdmin && (
              <NavLink href="/admin">Adminportaal</NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 sm:block sm:px-4 sm:py-6">
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-ink/70 hover:bg-paper hover:text-ink sm:w-full sm:rounded-lg sm:px-3 sm:py-2 sm:text-left sm:whitespace-normal"
    >
      {children}
    </Link>
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
