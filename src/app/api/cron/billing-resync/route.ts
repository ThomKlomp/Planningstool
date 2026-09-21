import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";
import { computeSubscriptionAmount, isDiscountCurrentlyActive } from "@/lib/billing";
import { sendEmail, emailLayout } from "@/lib/email";
import { chargeYearlyTierUpgrade } from "@/lib/tier-upgrade";

// Bedoeld om 1x per dag aangeroepen te worden door een externe cron-dienst
// (zelfde patroon als /api/cron/open-weeks), met header:
// Authorization: Bearer <CRON_SECRET>.
//
// Combineert twee taken die voorheen apart waren (cron/billing-resync en
// cron/discount-expiry — dat laatste bestaat niet meer, dit vervangt het):
//  1. Een verlopen kortingscode (LIMITED_MONTHS, op) verwijderen en de
//     eigenaar daarover mailen.
//  2. De Mollie-prijs bijwerken als de staffel of het kortingsbedrag sinds
//     de vorige run is veranderd.
// Eén cron in plaats van twee voorkomt dat ze elkaars werk tegenspreken
// (allebei het Mollie-bedrag proberen bij te werken op basis van een net
// wel/niet verlopen korting).
//
// Veilig om op elk moment te draaien: Mollie past een bijgewerkt bedrag pas
// toe op de eerstvolgende betaling, nooit met terugwerkende kracht.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    where: {
      subscriptionStatus: "ACTIVE",
      mollieCustomerId: { not: null },
      mollieSubscriptionId: { not: null },
    },
    include: { discount: true },
  });

  let priceUpdated = 0;
  let discountsExpired = 0;
  let upgradesCharged = 0;
  const errors: string[] = [];

  for (const company of companies) {
    try {
      // Stap 1: een lopende, aftellende korting die nu op is → verwijderen
      // en de eigenaar informeren. computeSubscriptionAmount hieronder
      // negeert een verlopen korting toch al, maar we ruimen 'm hier ook
      // echt op zodat 'm niet blijft "hangen" in de instellingenpagina.
      let discountJustExpired = false;
      if (
        company.discount &&
        company.discount.duration === "LIMITED_MONTHS" &&
        company.discount.monthsRemaining !== null &&
        !isDiscountCurrentlyActive(company.discount, company.billingInterval)
      ) {
        await prisma.companyDiscount.delete({ where: { id: company.discount.id } });
        discountJustExpired = true;
      }

      const interval = company.billingInterval ?? "MONTHLY";
      const { incl, tier } = await computeSubscriptionAmount(company.id, interval);

      // Jaarabonnement en een hogere staffel dan waarvoor betaald is: eerst het
      // verschil naar rato incasseren. Mislukt dat (bv. Mollie-fout), dan
      // gaat de rest van deze zaak niet door en probeert de cron het morgen
      // opnieuw; de prijs van de volgende verlenging wordt pas daarna bijgewerkt.
      if (interval === "YEARLY") {
        const result = await chargeYearlyTierUpgrade(company, tier.id);
        if (result.charged) upgradesCharged += 1;
      }

      const drifted =
        company.lastBilledAmountIncl === null ||
        company.lastBilledAmountIncl === undefined ||
        Math.abs(company.lastBilledAmountIncl - incl) > 0.001;

      if (drifted) {
        await mollie.subscriptions.update(
          company.mollieCustomerId as string,
          company.mollieSubscriptionId as string,
          { amount: { currency: "EUR", value: incl.toFixed(2) } }
        );
        await prisma.company.update({
          where: { id: company.id },
          data: { lastBilledAmountIncl: incl, currentTierId: tier.id },
        });
        priceUpdated += 1;
      }

      if (discountJustExpired) {
        discountsExpired += 1;
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
                <p>De kortingsperiode op je Shiftje-abonnement is voorbij.
                Vanaf de volgende termijn wordt weer het volledige bedrag van
                €${incl.toFixed(2)} in rekening gebracht (staffel ${tier.label}).</p>
              `
            ),
          });
        }
      }
    } catch (err) {
      console.error("[cron/billing-resync] fout bij zaak", company.id, err);
      errors.push(company.id);
    }
  }

  return NextResponse.json({
    ok: true,
    checked: companies.length,
    priceUpdated,
    discountsExpired,
    upgradesCharged,
    errors,
  });
}
