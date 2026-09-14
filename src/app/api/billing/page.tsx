import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import BillingActions from "../billing-actions";
import {
  PRICE_MONTHLY_EXCL,
  PRICE_MONTHLY_INCL,
  PRICE_YEARLY_EXCL,
  PRICE_YEARLY_INCL,
  formatEuro,
} from "@/lib/billing";

export default async function BillingPage() {
  const { membership } = await requireMembership();

  if (membership.role !== "OWNER") {
    redirect("/dashboard/settings");
  }

  const company = await prisma.company.findUnique({
    where: { id: membership.companyId },
    select: {
      subscriptionStatus: true,
      billingInterval: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  });

  const status = company?.subscriptionStatus ?? "TRIALING";
  const trialDaysLeft = company?.trialEndsAt
    ? Math.max(0, Math.ceil((company.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl">Facturering</h1>
      <p className="mt-1 text-sm text-ink/60">Je abonnement voor Shiftje.</p>

      <div className="mt-6 rounded-xl border border-line bg-white p-5">
        <StatusBanner
          status={status}
          trialDaysLeft={trialDaysLeft}
          billingInterval={company?.billingInterval ?? null}
          currentPeriodEnd={company?.currentPeriodEnd ?? null}
        />
      </div>

      {(status === "TRIALING" || status === "CANCELED" || status === "PAST_DUE") && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Kies je abonnement</h2>
          <p className="mt-1 text-sm text-ink/60">
            Eén vast bedrag per zaak, ongeacht het aantal medewerkers.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PlanCard
              title="Maandelijks"
              price={`${formatEuro(PRICE_MONTHLY_EXCL)} / maand`}
              subtext={`${formatEuro(PRICE_MONTHLY_INCL)} incl. btw`}
              interval="MONTHLY"
            />
            <PlanCard
              title="Jaarlijks"
              price={`${formatEuro(PRICE_YEARLY_EXCL)} / jaar`}
              subtext={`${formatEuro(PRICE_YEARLY_INCL)} incl. btw · 2 maanden gratis`}
              interval="YEARLY"
              highlight
            />
          </div>
        </section>
      )}

      {status === "ACTIVE" && (
        <section className="mt-8">
          <BillingActions mode="cancel" />
        </section>
      )}
    </div>
  );
}

function StatusBanner({
  status,
  trialDaysLeft,
  billingInterval,
  currentPeriodEnd,
}: {
  status: string;
  trialDaysLeft: number;
  billingInterval: string | null;
  currentPeriodEnd: Date | null;
}) {
  if (status === "ACTIVE") {
    return (
      <div>
        <p className="text-sm font-medium text-awning">Actief abonnement</p>
        <p className="mt-1 text-sm text-ink/60">
          {billingInterval === "YEARLY" ? "Jaarlijks" : "Maandelijks"} abonnement.
          {currentPeriodEnd && (
            <>
              {" "}
              Volgende betaling rond{" "}
              {currentPeriodEnd.toLocaleDateString("nl-NL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </>
          )}
        </p>
      </div>
    );
  }

  if (status === "PAST_DUE") {
    return (
      <div>
        <p className="text-sm font-medium text-red-600">Betaling mislukt</p>
        <p className="mt-1 text-sm text-ink/60">
          De laatste automatische betaling is niet gelukt. Kies hieronder
          opnieuw een abonnement om weer toegang te krijgen.
        </p>
      </div>
    );
  }

  if (status === "CANCELED") {
    return (
      <div>
        <p className="text-sm font-medium text-ink/60">Abonnement opgezegd</p>
        <p className="mt-1 text-sm text-ink/60">
          Kies hieronder een abonnement om Shiftje weer te gebruiken.
        </p>
      </div>
    );
  }

  // TRIALING
  return (
    <div>
      <p className="text-sm font-medium text-amber-dark">
        {trialDaysLeft > 0
          ? `Nog ${trialDaysLeft} ${trialDaysLeft === 1 ? "dag" : "dagen"} proefperiode`
          : "Proefperiode afgelopen"}
      </p>
      <p className="mt-1 text-sm text-ink/60">
        {trialDaysLeft > 0
          ? "Kies hieronder alvast een abonnement, of gebruik Shiftje nog even gratis verder."
          : "Kies een abonnement om Shiftje te blijven gebruiken."}
      </p>
    </div>
  );
}

function PlanCard({
  title,
  price,
  subtext,
  interval,
  highlight = false,
}: {
  title: string;
  price: string;
  subtext: string;
  interval: "MONTHLY" | "YEARLY";
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "border-awning bg-awning/5" : "border-line bg-white"
      }`}
    >
      <p className="font-display text-lg">{title}</p>
      <p className="mt-1 text-2xl font-display">{price}</p>
      <p className="text-xs text-ink/50">{subtext}</p>
      <div className="mt-4">
        <BillingActions mode="subscribe" interval={interval} />
      </div>
    </div>
  );
}
