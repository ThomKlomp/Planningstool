import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";
import { computeSubscriptionAmount } from "@/lib/billing";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Alleen de eigenaar kan het abonnement beheren" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const interval = body?.interval === "YEARLY" ? "YEARLY" : "MONTHLY";

  const company = await prisma.company.findUnique({ where: { id: membership.companyId } });
  if (!company) {
    return NextResponse.json({ error: "Zaak niet gevonden" }, { status: 404 });
  }

  // Staffelprijs o.b.v. het actuele aantal medewerkers, met een eventuele
  // al ingewisselde kortingscode verrekend (zie /api/billing/redeem-discount).
  const { incl, tier } = await computeSubscriptionAmount(company.id, interval);

  try {
    let customerId = company.mollieCustomerId;
    if (!customerId) {
      const customer = await mollie.customers.create({
        name: company.name,
        email: session.user.email ?? "",
        metadata: { companyId: company.id },
      });
      customerId = customer.id;
      await prisma.company.update({
        where: { id: company.id },
        data: { mollieCustomerId: customerId },
      });
    }
    if (!customerId) {
      return NextResponse.json(
        { error: "Kon geen Mollie-klant aanmaken" },
        { status: 502 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const payment = await mollie.payments.create({
      customerId,
      amount: { currency: "EUR", value: incl.toFixed(2) },
      description: `Shiftje — ${company.name} (${
        interval === "YEARLY" ? "jaarlijks" : "maandelijks"
      })`,
      redirectUrl: `${baseUrl}/dashboard/settings/billing?status=pending`,
      webhookUrl: `${baseUrl}/api/webhooks/mollie`,
      sequenceType: "first",
      metadata: { companyId: company.id, interval },
    });

    await prisma.company.update({
      where: { id: company.id },
      data: {
        billingInterval: interval,
        currentTierId: tier.id,
        lastBilledAmountIncl: incl,
      },
    });

    const checkoutUrl = payment._links?.checkout?.href;
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Kon geen betaallink aanmaken" }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[billing/subscribe]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Er ging iets mis bij Mollie" },
      { status: 502 }
    );
  }
}
