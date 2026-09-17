import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";
import { computeSubscriptionAmount } from "@/lib/billing";

// Bedoeld om 1x per dag aangeroepen te worden door een externe cron-dienst
// (bv. cron-job.org, zelfde patroon als /api/cron/open-weeks), met header:
// Authorization: Bearer <CRON_SECRET>.
//
// Herberekent voor elke actieve zaak de juiste staffelprijs (o.b.v. het
// actuele aantal medewerkers) plus een eventuele kortingscode, en werkt het
// bedrag bij Mollie bij als dat is gewijzigd sinds de vorige keer. Dit is
// de plek waar staffelwijzigingen (op- én neerwaarts) daadwerkelijk worden
// doorgevoerd — niet meteen bij het toevoegen/verwijderen van een
// medewerker, om tussentijdse deelbetalingen te vermijden.
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
  });

  let updated = 0;
  const errors: string[] = [];

  for (const company of companies) {
    try {
      const interval = company.billingInterval ?? "MONTHLY";
      const { excl, incl, tier } = await computeSubscriptionAmount(company.id, interval);

      const drifted =
        company.lastBilledAmountExcl === null ||
        company.lastBilledAmountExcl === undefined ||
        Math.abs(company.lastBilledAmountExcl - excl) > 0.001;

      if (drifted) {
        await mollie.subscriptions.update(
          company.mollieCustomerId as string,
          company.mollieSubscriptionId as string,
          { amount: { currency: "EUR", value: incl.toFixed(2) } }
        );
        await prisma.company.update({
          where: { id: company.id },
          data: { lastBilledAmountExcl: excl, currentTierId: tier.id },
        });
        updated += 1;
      }
    } catch (err) {
      console.error("[cron/billing-resync] fout bij zaak", company.id, err);
      errors.push(company.id);
    }
  }

  return NextResponse.json({ ok: true, checked: companies.length, updated, errors });
}
