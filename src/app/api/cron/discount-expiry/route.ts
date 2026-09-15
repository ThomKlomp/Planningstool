import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";
import { PRICE_MONTHLY_INCL, PRICE_YEARLY_INCL } from "@/lib/billing";
import { sendEmail, emailLayout } from "@/lib/email";

// Bedoeld om 1x per dag aangeroepen te worden door een externe cron-dienst,
// met header: Authorization: Bearer <CRON_SECRET>. Zelfde beveiliging als
// de andere cron-routes.
//
// Telt bij elke termijnbetaling van een tijdelijke (LIMITED_MONTHS)
// korting een maand af. Zodra de korting op is, wordt het Mollie-abonnement
// teruggezet naar de volle prijs en wordt de korting van de zaak verwijderd.
//
// We tellen af op basis van currentPeriodEnd (elke keer dat er een nieuwe
// termijn is ingegaan), niet simpelweg 1x per dag, dus deze cron kan
// gerust vaker draaien dan er daadwerkelijk iets gebeurt.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const discounts = await prisma.companyDiscount.findMany({
    where: { duration: "LIMITED_MONTHS", monthsRemaining: { not: null } },
    include: { company: true },
  });

  let expired = 0;

  for (const discount of discounts) {
    const company = discount.company;
    if (!company.mollieSubscriptionId || !company.mollieCustomerId) continue;
    // Nog geen betaalde termijn geweest sinds het inwisselen: nog niets af te tellen.
    if (!company.currentPeriodEnd || company.currentPeriodEnd < discount.redeemedAt) continue;

    // Hoeveel termijnen zijn er inmiddels verstreken sinds het inwisselen?
    const monthsSinceRedeemed =
      company.billingInterval === "YEARLY"
        ? 12 *
          Math.floor(
            (Date.now() - discount.redeemedAt.getTime()) / (365 * 24 * 60 * 60 * 1000)
          )
        : Math.floor(
            (Date.now() - discount.redeemedAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
          );

    const monthsRemaining = Math.max(0, (discount.monthsRemaining ?? 0) - monthsSinceRedeemed);

    if (monthsRemaining > 0) continue; // korting loopt nog, niets te doen

    // Korting op: abonnement terugzetten naar de volle prijs.
    const baseAmount =
      company.billingInterval === "YEARLY" ? PRICE_YEARLY_INCL : PRICE_MONTHLY_INCL;

    try {
      await mollie.subscriptions.update(company.mollieCustomerId, company.mollieSubscriptionId, {
        amount: { currency: "EUR", value: baseAmount.toFixed(2) },
      });
    } catch (err) {
      console.error("[cron/discount-expiry] kon Mollie-abonnement niet bijwerken", err);
      continue; // niet de korting weghalen als het bij Mollie niet gelukt is
    }

    await prisma.companyDiscount.delete({ where: { id: discount.id } });
    expired += 1;

    const owner = await prisma.membership.findFirst({
      where: { companyId: company.id, role: "OWNER" },
      include: { user: true },
    });
    if (owner?.user.email) {
      await sendEmail({
        to: owner.user.email,
        subject: "Je kortingsperiode is afgelopen",
        html: emailLayout(
          "Je kortingsperiode is afgelopen",
          `
            <p>De kortingsperiode op je Shiftje-abonnement is voorbij. Vanaf
            de volgende termijn wordt weer het volledige bedrag van
            €${baseAmount.toFixed(2)} in rekening gebracht.</p>
          `
        ),
      });
    }
  }

  return NextResponse.json({ ok: true, expired });
}
