import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";
import { sendEmail, emailLayout } from "@/lib/email";
import { supportRecipients } from "@/lib/support-notify";
import { PRICE_TIERS, getTierById, round2, formatEuro } from "@/lib/pricing";
import { yearlyInclForTier } from "@/lib/billing";
import type { Company, CompanyDiscount } from "@prisma/client";

// Groeit een zaak met een JAARabonnement tijdens het jaar naar een hogere
// staffel, dan betaalt ze het verschil bij, naar rato van de resterende
// maanden:
//
//   bijbetaling = (jaarprijs nieuwe staffel − jaarprijs betaalde staffel) × resterende maanden / 12
//
// (zonder korting: resterende maanden × maandverschil × 10/12, excl. btw).
// Resterende maanden = tot de volgende verlengdatum bij Mollie, naar boven
// afgerond op hele maanden. Wordt geïncasseerd via de bestaande Mollie-
// machtiging (sequenceType "recurring"), zonder dat de klant iets hoeft te doen.
// Bij een lagere staffel wordt niets terugbetaald; de nieuwe (lagere) prijs
// geldt bij de eerstvolgende verlenging. Betaald wordt nooit twee keer voor
// dezelfde staffel in dezelfde periode (zie TierUpgradeCharge).

const MONTH_MS = (365.25 / 12) * 24 * 60 * 60 * 1000;

export function tierRank(id: string | null | undefined): number {
  return PRICE_TIERS.findIndex((t) => t.id === id);
}

/** Resterende hele maanden (naar boven afgerond, 0–12) tot `end`. */
export function monthsRemaining(end: Date, now = new Date()): number {
  const months = Math.ceil((end.getTime() - now.getTime()) / MONTH_MS);
  return Math.min(12, Math.max(0, months));
}

/** Bijbetaling in euro's incl. btw. Puur rekenwerk, los getest. */
export function computeUpgradeAmount(
  fromYearlyIncl: number,
  toYearlyIncl: number,
  months: number
): number {
  return round2(Math.max(0, toYearlyIncl - fromYearlyIncl) * (months / 12));
}

async function ownerEmail(companyId: string) {
  const owner = await prisma.membership.findFirst({
    where: { companyId, role: "OWNER" },
    include: { user: true },
  });
  return owner?.user.email ?? null;
}

export type UpgradeResult =
  | { charged: false; reason: string }
  | { charged: true; amountIncl: number; months: number };

export async function chargeYearlyTierUpgrade(
  company: Pick<
    Company,
    "id" | "name" | "mollieCustomerId" | "mollieSubscriptionId" | "periodTierId" | "currentTierId" | "billingInterval" | "currentPeriodEnd"
  > & { discount: CompanyDiscount | null },
  newTierId: string
): Promise<UpgradeResult> {
  const newTier = getTierById(newTierId);
  const baselineId = company.periodTierId ?? company.currentTierId;

  if (!newTier || !company.mollieCustomerId || !company.mollieSubscriptionId) {
    return { charged: false, reason: "geen actief Mollie-abonnement" };
  }
  // Nog geen bekende betaalde staffel (bv. oude zaak): dit wordt de basislijn.
  if (!baselineId) {
    await prisma.company.update({ where: { id: company.id }, data: { periodTierId: newTier.id } });
    return { charged: false, reason: "basislijn gezet" };
  }
  const baseline = getTierById(baselineId);
  if (!baseline || tierRank(newTier.id) <= tierRank(baseline.id)) {
    return { charged: false, reason: "geen hogere staffel" };
  }

  const subscription = await mollie.subscriptions.get(
    company.mollieCustomerId,
    company.mollieSubscriptionId
  );
  const nextPayment: string | undefined = subscription?.nextPaymentDate;
  const periodEnd = nextPayment
    ? new Date(`${nextPayment}T00:00:00Z`)
    : company.currentPeriodEnd;
  if (!periodEnd) {
    throw new Error("Volgende verlengdatum onbekend, bijbetaling niet berekend");
  }

  const months = monthsRemaining(periodEnd);
  const amountIncl = computeUpgradeAmount(
    yearlyInclForTier(baseline, company.discount, "YEARLY"),
    yearlyInclForTier(newTier, company.discount, "YEARLY"),
    months
  );

  // Verlenging staat (bijna) voor de deur of het verschil is te klein om te
  // incasseren: dan geldt de nieuwe prijs gewoon bij de verlenging.
  if (months === 0 || amountIncl < 0.01) {
    await prisma.company.update({ where: { id: company.id }, data: { periodTierId: newTier.id } });
    return { charged: false, reason: "niets bij te betalen" };
  }

  const periodKey = periodEnd.toISOString().slice(0, 10);
  const already = await prisma.tierUpgradeCharge.findUnique({
    where: {
      companyId_toTierId_periodKey: { companyId: company.id, toTierId: newTier.id, periodKey },
    },
  });
  if (already) return { charged: false, reason: "al in rekening gebracht" };

  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const payment = await mollie.payments.create({
    customerId: company.mollieCustomerId,
    amount: { currency: "EUR", value: amountIncl.toFixed(2) },
    description: `Shiftje bijbetaling staffel ${baseline.label} → ${newTier.label} (${months} ${
      months === 1 ? "maand" : "maanden"
    }) · ${company.name}`,
    webhookUrl: `${baseUrl}/api/webhooks/mollie`,
    sequenceType: "recurring",
    metadata: { companyId: company.id, kind: "tier_upgrade" },
  });

  await prisma.$transaction([
    prisma.tierUpgradeCharge.create({
      data: {
        companyId: company.id,
        fromTierId: baseline.id,
        toTierId: newTier.id,
        periodKey,
        monthsRemaining: months,
        amountIncl,
        molliePaymentId: payment.id,
      },
    }),
    prisma.company.update({ where: { id: company.id }, data: { periodTierId: newTier.id } }),
  ]);

  const to = await ownerEmail(company.id);
  if (to) {
    await sendEmail({
      to,
      subject: "Je Shiftje-abonnement is naar een hogere staffel gegaan",
      html: emailLayout(
        "Bijbetaling voor je nieuwe staffel",
        `
          <p>Het aantal medewerkers bij <strong>${company.name}</strong> is gegroeid: je zit nu in
          staffel <strong>${newTier.label}</strong> (was ${baseline.label}).</p>
          <p style="margin-top: 12px;">Omdat je een jaarabonnement hebt, betaal je het verschil bij voor de
          resterende <strong>${months} ${months === 1 ? "maand" : "maanden"}</strong> van dit abonnementsjaar:
          <strong>${formatEuro(amountIncl)}</strong> incl. btw. Dit bedrag wordt automatisch afgeschreven via je
          bestaande machtiging.</p>
          <p style="margin-top: 12px; color: #666;">Bij de volgende jaarlijkse verlenging geldt het volledige
          tarief van je dan actuele staffel.</p>
        `
      ),
    });
  }

  return { charged: true, amountIncl, months };
}

/**
 * Verwerkt de Mollie-webhook van een bijbetaling. Raakt bewust NIET aan
 * currentPeriodEnd of de abonnementsstatus: dit is geen verlenging.
 */
export async function handleTierUpgradePayment(payment: {
  id: string;
  status: string;
}) {
  const charge = await prisma.tierUpgradeCharge.findUnique({
    where: { molliePaymentId: payment.id },
    include: { company: { select: { id: true, name: true } } },
  });
  if (!charge) return;

  if (payment.status === "paid" && charge.status !== "PAID") {
    await prisma.tierUpgradeCharge.update({
      where: { id: charge.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    return;
  }

  if (["failed", "expired", "canceled"].includes(payment.status) && charge.status === "PENDING") {
    await prisma.tierUpgradeCharge.update({
      where: { id: charge.id },
      data: { status: "FAILED" },
    });

    const owner = await ownerEmail(charge.companyId);
    const amount = formatEuro(charge.amountIncl);
    if (owner) {
      await sendEmail({
        to: owner,
        subject: "Bijbetaling voor je Shiftje-staffel is niet gelukt",
        html: emailLayout(
          "De bijbetaling is niet gelukt",
          `<p>De afschrijving van <strong>${amount}</strong> voor je hogere staffel is niet gelukt.
          Neem contact met ons op via het chat-bolletje in Shiftje, dan regelen we het samen.</p>`
        ),
      });
    }

    // Wij moeten het ook weten: er wordt niet automatisch opnieuw geprobeerd.
    const support = await supportRecipients();
    if (support.length > 0) {
      await sendEmail({
        to: support,
        subject: `Bijbetaling mislukt: ${charge.company.name}`,
        html: emailLayout(
          "Bijbetaling staffel mislukt",
          `<p>${charge.company.name}: ${amount} (staffel ${charge.fromTierId} → ${charge.toTierId},
          ${charge.monthsRemaining} mnd). Mollie-betaling ${charge.molliePaymentId}. Handmatig opvolgen.</p>`
        ),
      });
    }
  }
}
