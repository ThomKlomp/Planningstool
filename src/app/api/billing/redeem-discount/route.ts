import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Alleen de eigenaar kan een kortingscode invoeren" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Vul een code in" }, { status: 400 });
  }

  const existingDiscount = await prisma.companyDiscount.findUnique({
    where: { companyId: membership.companyId },
  });
  if (existingDiscount) {
    return NextResponse.json(
      { error: "Er staat al een kortingscode op deze zaak" },
      { status: 409 }
    );
  }

  const discountCode = await prisma.discountCode.findUnique({ where: { code } });
  if (!discountCode || !discountCode.active) {
    return NextResponse.json({ error: "Deze code bestaat niet (meer)" }, { status: 404 });
  }
  if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
    return NextResponse.json({ error: "Deze code is verlopen" }, { status: 410 });
  }
  if (discountCode.maxRedemptions && discountCode.timesRedeemed >= discountCode.maxRedemptions) {
    return NextResponse.json(
      { error: "Deze code is al het maximaal aantal keer gebruikt" },
      { status: 410 }
    );
  }

  // Bijzonder geval: 100% korting voor een beperkt aantal maanden = die
  // maanden gewoon helemaal gratis. Mollie vereist een echte, niet-nul
  // eerste betaling om een incassomachtiging vast te leggen, dus dit lopen
  // we niet via Mollie: we verlengen simpelweg de proefperiode. Alle
  // bestaande trial-schermen (banners, "kies een abonnement") werken dan
  // vanzelf door tot de nieuwe datum, zonder dat daar iets voor hoeft te
  // veranderen.
  const isFreeMonths =
    discountCode.type === "PERCENTAGE" &&
    discountCode.value === 100 &&
    discountCode.duration === "LIMITED_MONTHS" &&
    discountCode.durationMonths;

  if (isFreeMonths) {
    const company = await prisma.company.findUnique({ where: { id: membership.companyId } });
    const base =
      company?.trialEndsAt && company.trialEndsAt > new Date() ? company.trialEndsAt : new Date();
    const newTrialEnd = new Date(base);
    newTrialEnd.setMonth(newTrialEnd.getMonth() + discountCode.durationMonths!);

    await prisma.$transaction([
      prisma.company.update({
        where: { id: membership.companyId },
        data: { subscriptionStatus: "TRIALING", trialEndsAt: newTrialEnd },
      }),
      prisma.companyDiscount.create({
        data: {
          companyId: membership.companyId,
          discountCodeId: discountCode.id,
          type: discountCode.type,
          value: discountCode.value,
          duration: discountCode.duration,
          durationMonths: discountCode.durationMonths,
          applicableInterval: discountCode.applicableInterval,
          monthsRemaining: null, // al direct volledig verwerkt, niets meer af te tellen
        },
      }),
      prisma.discountCode.update({
        where: { id: discountCode.id },
        data: { timesRedeemed: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      message: `Gelukt! Je proefperiode is verlengd met ${discountCode.durationMonths} ${
        discountCode.durationMonths === 1 ? "maand" : "maanden"
      }.`,
    });
  }

  // Normaal geval: korting op het te betalen bedrag, verwerkt zodra de
  // eigenaar daadwerkelijk een abonnement kiest (zie /api/billing/subscribe
  // en de Mollie-webhook).
  await prisma.$transaction([
    prisma.companyDiscount.create({
      data: {
        companyId: membership.companyId,
        discountCodeId: discountCode.id,
        type: discountCode.type,
        value: discountCode.value,
        duration: discountCode.duration,
        durationMonths: discountCode.durationMonths,
        applicableInterval: discountCode.applicableInterval,
        monthsRemaining: discountCode.duration === "LIMITED_MONTHS" ? discountCode.durationMonths : null,
      },
    }),
    prisma.discountCode.update({
      where: { id: discountCode.id },
      data: { timesRedeemed: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "Kortingscode toegepast." });
}
