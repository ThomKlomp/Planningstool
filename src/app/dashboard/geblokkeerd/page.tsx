import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";

// Losse, neutrale pagina (geen requireActiveSubscription-check!) waar zowel
// eigenaar als medewerker mag komen als de betaalde periode na opzeggen is
// afgelopen. Alleen de eigenaar mag naar Instellingen > Abonnement, dus die
// krijgt daar een knop naartoe; een medewerker of manager kan dat niet
// oplossen en krijgt alleen de boodschap.
export default async function BlockedPage() {
  const { membership } = await requireMembership();

  const company = await prisma.company.findUnique({
    where: { id: membership.companyId },
    select: { subscriptionStatus: true, currentPeriodEnd: true, name: true },
  });

  // Niet (meer) geblokkeerd? Dan hoort niemand hier te zitten.
  const stillBlocked =
    company?.subscriptionStatus === "CANCELED" &&
    company.currentPeriodEnd &&
    company.currentPeriodEnd.getTime() <= Date.now();
  if (!stillBlocked) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Geen toegang
      </span>
      <h1 className="mt-5 font-display text-2xl">
        Het abonnement van {company?.name} is opgezegd
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink/60">
        De betaalde periode is afgelopen. Alle gegevens (rooster, uren, medewerkers) blijven
        gewoon bewaard, maar niemand kan er op dit moment bij.
      </p>

      {membership.role === "OWNER" ? (
        <Link
          href="/dashboard/settings/billing"
          className="mt-6 rounded-full bg-orange px-5 py-2.5 text-sm font-medium text-ink hover:bg-orange-dark"
        >
          Kies een abonnement om door te gaan
        </Link>
      ) : (
        <p className="mt-6 max-w-md rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber-dark">
          Vraag de eigenaar van {company?.name} om een nieuw abonnement te kiezen.
        </p>
      )}
    </div>
  );
}
