import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";
import { computeSubscriptionAmount } from "@/lib/billing";
import { handleTierUpgradePayment } from "@/lib/tier-upgrade";

// Mollie stuurt hier een POST naartoe met de betaalinformatie ALTIJD als
// application/x-www-form-urlencoded (dus id=tr_xxx), niet als JSON — een
// veelgemaakte misvatting. We lezen 'm daarom als tekst en parsen zelf.
// De rest van de betaalinformatie halen we op bij Mollie zelf (nooit
// vertrouwen op wat er verder in de webhook-body staat).
export async function POST(req: Request) {
  const raw = await req.text();
  let paymentId: string | undefined;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    paymentId = JSON.parse(raw || "{}")?.id;
  } else {
    paymentId = new URLSearchParams(raw).get("id") ?? undefined;
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Geen payment id" }, { status: 400 });
  }

  let payment;
  try {
    payment = await mollie.payments.get(paymentId);
  } catch (err) {
    console.error("[webhooks/mollie] kon betaling niet ophalen", err);
    return NextResponse.json({ error: "Kon betaling niet ophalen" }, { status: 502 });
  }

  const companyId = payment.metadata?.companyId;
  if (!companyId) {
    // Onbekende/oude betaling, negeren.
    return NextResponse.json({ ok: true });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ ok: true });
  }

  // Bijbetaling bij groei naar een hogere staffel: geen verlenging, dus apart
  // afhandelen (mag currentPeriodEnd en de status niet aanraken).
  if (payment.metadata?.kind === "tier_upgrade") {
    await handleTierUpgradePayment({ id: payment.id, status: payment.status });
    return NextResponse.json({ ok: true });
  }

  if (payment.status === "paid" && payment.sequenceType === "first") {
    // Eerste betaling geslaagd (en het mandaat is nu bekend bij Mollie) —
    // zet 'm om in een terugkerend abonnement, tegen de actuele staffelprijs.
    const interval = payment.metadata?.interval === "YEARLY" ? "YEARLY" : "MONTHLY";
    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const { incl, tier } = await computeSubscriptionAmount(company.id, interval);

    try {
      const subscription = await mollie.subscriptions.create(payment.customerId, {
        amount: { currency: "EUR", value: incl.toFixed(2) },
        interval: interval === "YEARLY" ? "12 months" : "1 month",
        description: `Shiftje abonnement — ${company.name}`,
        webhookUrl: `${baseUrl}/api/webhooks/mollie`,
        metadata: { companyId: company.id, interval },
      });

      const periodMs = (interval === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000;

      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: "ACTIVE",
          billingInterval: interval,
          mollieSubscriptionId: subscription.id,
          currentPeriodEnd: new Date(Date.now() + periodMs),
          currentTierId: tier.id,
          periodTierId: tier.id,
          lastBilledAmountIncl: incl,
        },
      });
    } catch (err) {
      console.error("[webhooks/mollie] kon abonnement niet aanmaken", err);
    }
  } else if (payment.status === "paid" && payment.sequenceType === "recurring") {
    // Een volgende, automatische termijnbetaling is gelukt. Staffel- en
    // kortingswijzigingen worden niet hier verwerkt, maar door de
    // dagelijkse cron/billing-resync — die is de bron van waarheid voor
    // "wat zou dit bedrag nu moeten zijn" en houdt ook de
    // korting-verloopt-logica bij.
    const interval = company.billingInterval ?? "MONTHLY";
    const periodMs = (interval === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000;

    // Nieuwe betaalperiode: de zojuist betaalde staffel is de nieuwe basislijn
    // voor eventuele bijbetaling in dit jaar.
    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + periodMs),
        periodTierId: company.currentTierId,
      },
    });
  } else if (["failed", "expired", "canceled"].includes(payment.status)) {
    if (payment.sequenceType === "recurring") {
      await prisma.company.update({
        where: { id: company.id },
        data: { subscriptionStatus: "PAST_DUE" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
