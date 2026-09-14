import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";
import { PRICE_MONTHLY_INCL, PRICE_YEARLY_INCL } from "@/lib/billing";

// Mollie stuurt hier een POST met alleen { id: "tr_..." } naartoe — de rest
// van de betaalinformatie halen we zelf op bij Mollie (nooit vertrouwen op
// wat in de webhook-body zelf staat, dat is bewust minimaal).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const paymentId = body?.id;
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

  if (payment.status === "paid" && payment.sequenceType === "first") {
    // Eerste betaling geslaagd (en het mandaat is nu bekend bij Mollie) —
    // zet 'm om in een terugkerend abonnement.
    const interval = payment.metadata?.interval === "YEARLY" ? "YEARLY" : "MONTHLY";
    const amountValue = interval === "YEARLY" ? PRICE_YEARLY_INCL : PRICE_MONTHLY_INCL;
    const baseUrl = process.env.NEXTAUTH_URL ?? "";

    try {
      const subscription = await mollie.subscriptions.create(payment.customerId, {
        amount: { currency: "EUR", value: amountValue.toFixed(2) },
        interval: interval === "YEARLY" ? "12 months" : "1 month",
        description: `Shiftje abonnement — ${company.name}`,
        webhookUrl: `${baseUrl}/api/webhooks/mollie`,
        metadata: { companyId: company.id, interval },
      });

      const periodMs =
        (interval === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000;

      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: "ACTIVE",
          billingInterval: interval,
          mollieSubscriptionId: subscription.id,
          currentPeriodEnd: new Date(Date.now() + periodMs),
        },
      });
    } catch (err) {
      console.error("[webhooks/mollie] kon abonnement niet aanmaken", err);
    }
  } else if (payment.status === "paid" && payment.sequenceType === "recurring") {
    // Een volgende, automatische termijnbetaling is gelukt.
    const interval = company.billingInterval ?? "MONTHLY";
    const periodMs = (interval === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000;

    await prisma.company.update({
      where: { id: company.id },
      data: {
        subscriptionStatus: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + periodMs),
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
