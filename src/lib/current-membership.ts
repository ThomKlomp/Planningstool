import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

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

  if (session.user.memberships.length === 0) {
    redirect("/onboarding");
  }

  return {
    session,
    membership: session.user.memberships[0],
  };
}
