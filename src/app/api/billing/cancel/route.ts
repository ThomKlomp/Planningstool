import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mollie } from "@/lib/mollie";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Alleen de eigenaar kan het abonnement opzeggen" },
      { status: 403 }
    );
  }

  const company = await prisma.company.findUnique({ where: { id: membership.companyId } });
  if (!company?.mollieCustomerId || !company.mollieSubscriptionId) {
    return NextResponse.json({ error: "Geen actief abonnement gevonden" }, { status: 404 });
  }

  try {
    await mollie.subscriptions.cancel(company.mollieCustomerId, company.mollieSubscriptionId);
  } catch (err) {
    console.error("[billing/cancel]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Opzeggen bij Mollie mislukt" },
      { status: 502 }
    );
  }

  await prisma.company.update({
    where: { id: company.id },
    data: { subscriptionStatus: "CANCELED" },
  });

  return NextResponse.json({ ok: true });
}
