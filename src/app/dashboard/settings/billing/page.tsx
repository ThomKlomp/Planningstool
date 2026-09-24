import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/current-membership";
import { prisma } from "@/lib/prisma";
import BillingActions from "../billing-actions";
import DiscountCodeForm from "../discount-code-form";
import { describeDiscount } from "@/lib/discount";
import {
  PRICE_TIERS,
  computeSubscriptionAmount,
  countBillableMembers,
  formatEuro,
  getTierForMemberCount,
  isDiscountCurrentlyActive,
  exceedsStandardTiers,
  MAX_STANDARD_MEMBERS,
} from "@/lib/billing";
import ContactButton from "@/components/contact-button";

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
      discount: true,
    },
  });

  const status = company?.subscriptionStatus ?? "TRIALING";
  const trialDaysLeft = company?.trialEndsAt
    ? Math.max(0, Math.ceil((company.trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const memberCount = await countBillableMembers(membership.companyId);
  const currentTier = getTierForMemberCount(memberCount);
  const monthly = await computeSubscriptionAmount(membership.companyId, "MONTHLY");
  const yearly = await computeSubscriptionAmount(membership.companyId, "YEARLY");

  const discountActive =
    company?.discount &&
    isDiscountCurrentlyActive(company.discount, company.billingInterval ?? null);

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

      <section className="mt-8">
        <h2 className="font-display text-xl">Jouw staffel</h2>
        <p className="mt-1 text-sm text-ink/60">
          {memberCount} {memberCount === 1 ? "medewerker" : "medewerkers"} → staffel{" "}
          <span className="font-medium text-ink">{currentTier.label}</span>. De prijs past
          zich automatisch aan als het aantal medewerkers structureel verandert (bij de
          eerstvolgende betaling, niet met terugwerkende kracht).
        </p>
        {status === "ACTIVE" && company?.billingInterval === "YEARLY" && (
          <p className="mt-2 text-sm text-ink/60">
            Groeit je team tijdens het jaar naar een hogere staffel? Dan betaal je het verschil
            naar rato van de resterende maanden bij (resterende maanden × prijsverschil ×
            10/12, excl. btw). Dit wordt automatisch afgeschreven via je machtiging. Bij een
            lagere staffel wordt niets terugbetaald; de lagere prijs geldt bij de verlenging.
          </p>
        )}
        <div className="mt-4 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase text-ink/50">
              <tr>
                <th className="px-4 py-2">Medewerkers</th>
                <th className="px-4 py-2">Per maand (excl. btw)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PRICE_TIERS.map((tier) => (
                <tr
                  key={tier.id}
                  className={tier.id === currentTier.id ? "bg-awning/5 font-medium" : undefined}
                >
                  <td className="px-4 py-2">{tier.label}</td>
                  <td className="px-4 py-2">{formatEuro(tier.monthlyExcl)}</td>
                </tr>
              ))}
              <tr className={exceedsStandardTiers(memberCount) ? "bg-awning/5 font-medium" : undefined}>
                <td className="px-4 py-2">Meer dan {MAX_STANDARD_MEMBERS} medewerkers</td>
                <td className="px-4 py-2">Op maat</td>
              </tr>
            </tbody>
          </table>
        </div>
        {exceedsStandardTiers(memberCount) && (
          <div className="mt-3 rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber-dark">
            Je hebt meer dan {MAX_STANDARD_MEMBERS} medewerkers. Neem contact met ons op om
            de mogelijkheden te bespreken.
            <ContactButton
              message={`Hoi! Wij hebben ${memberCount} medewerkers en willen graag weten wat de mogelijkheden zijn.`}
              className="ml-2 font-medium underline hover:no-underline"
            >
              Neem contact op
            </ContactButton>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl">Kortingscode</h2>
        {discountActive && company?.discount ? (
          <p className="mt-1 text-sm text-ink/60">
            {describeDiscount(company.discount)}, actief sinds{" "}
            {company.discount.redeemedAt.toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink/60">Heb je een kortingscode?</p>
            <div className="mt-3">
              <DiscountCodeForm />
            </div>
          </>
        )}
      </section>

      {(status === "TRIALING" || status === "CANCELED" || status === "PAST_DUE") && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Kies je abonnement</h2>
          <p className="mt-1 text-sm text-ink/60">
            Gebaseerd op je huidige staffel ({currentTier.label}).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PlanCard
              title="Maandelijks"
              price={`${formatEuro(monthly.excl)} / maand`}
              originalPrice={monthly.discountApplied ? `${formatEuro(monthly.baseExcl)} / maand` : undefined}
              subtext={`${formatEuro(monthly.incl)} incl. btw${
                monthly.discountApplied ? " · korting toegepast" : ""
              }`}
              interval="MONTHLY"
            />
            <PlanCard
              title="Jaarlijks"
              price={`${formatEuro(yearly.excl)} / jaar`}
              originalPrice={yearly.discountApplied ? `${formatEuro(yearly.baseExcl)} / jaar` : undefined}
              subtext={`${formatEuro(yearly.incl)} incl. btw · 2 maanden gratis${
                yearly.discountApplied ? " · korting toegepast" : ""
              }`}
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
  originalPrice,
  subtext,
  interval,
  highlight = false,
}: {
  title: string;
  price: string;
  originalPrice?: string;
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
      <p className="mt-1 font-display text-2xl">
        {originalPrice && (
          <span className="mr-2 text-base font-normal text-ink/40 line-through">
            {originalPrice}
          </span>
        )}
        {price}
      </p>
      <p className="text-xs text-ink/50">{subtext}</p>
      <div className="mt-4">
        <BillingActions mode="subscribe" interval={interval} />
      </div>
    </div>
  );
}
