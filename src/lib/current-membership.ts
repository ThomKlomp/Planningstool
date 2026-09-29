import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { requireAcceptedTerms } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

/**
 * Haalt de sessie op en de "actieve" membership (bedrijf + rol) van de gebruiker.
 *
 * MVP-aanname: iemand werkt bij één zaak, dus we pakken gewoon de eerste
 * membership. Wil je straks meerdere zaken per gebruiker ondersteunen
 * (bv. een freelance bediening die bij meerdere cafés werkt), voeg dan een
 * company-switcher toe die de actieve companyId in een cookie zet.
 */
export async function requireMembership() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin?callbackUrl=/dashboard");
  }

  requireAcceptedTerms(session, "/dashboard");

  if (session.user.memberships.length === 0) {
    redirect("/onboarding");
  }

  return {
    session,
    membership: session.user.memberships[0],
  };
}

/**
 * Blokkeert toegang tot een pagina zodra een opgezegd abonnement (CANCELED)
 * ook echt over de datum heen is waar al voor betaald was (currentPeriodEnd).
 * Vóór die datum blijft de zaak gewoon werken: die periode is al betaald.
 * Alleen CANCELED, bewust niet PAST_DUE of een verlopen proefperiode; dat
 * zijn losse productbeslissingen die niet in deze aanpassing zaten.
 *
 * Aanroepen in élke dashboardpagina behalve /dashboard/settings/billing (die
 * moet juist bereikbaar blijven om opnieuw te abonneren) en
 * /dashboard/geblokkeerd zelf (anders een oneindige redirect).
 *
 * Bewuste beperking: dit blokkeert de pagina's, niet de losse API-routes
 * (/api/shifts, /api/availability, enz.). Iemand die een pagina al open had
 * staan kan een actie dus nog laten slagen totdat de pagina herlaadt. Wil je
 * dit ook op API-niveau afdwingen, dan is dat een aparte, grotere aanpassing
 * (elke schrijvende route zou dezelfde check moeten doen).
 */
export async function requireActiveSubscription(membership: { companyId: string }) {
  const company = await prisma.company.findUnique({
    where: { id: membership.companyId },
    select: { subscriptionStatus: true, currentPeriodEnd: true },
  });

  if (
    company?.subscriptionStatus === "CANCELED" &&
    company.currentPeriodEnd &&
    company.currentPeriodEnd.getTime() <= Date.now()
  ) {
    redirect("/dashboard/geblokkeerd");
  }
}

