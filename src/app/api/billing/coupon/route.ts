import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Past een kortingscode toe op de zaak. Werkt het bedrag NIET meteen bij
// Mollie bij (dat gebeurt via de dagelijkse cron/billing-resync, of
// meteen als de zaak nog geen actief abonnement heeft en via
// billing/subscribe afrekent).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json(
      { error: "Alleen de eigenaar kan een kortingscode toepassen" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const code = (body?.code ?? "").trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Vul een kortingscode in" }, { status: 400 });
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Ongeldige kortingscode" }, { status: 404 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json({ error: "Deze kortingscode is verlopen" }, { status: 410 });
  }
  if (coupon.maxRedemptions !== null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return NextResponse.json({ error: "Deze kortingscode is niet meer geldig" }, { status: 410 });
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { id: membership.companyId },
      data: {
        appliedCouponId: coupon.id,
        couponMonthsRemaining: coupon.durationMonths,
      },
    }),
    prisma.coupon.update({
      where: { id: coupon.id },
      data: { timesRedeemed: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

// Kortingscode verwijderen (bv. als de eigenaar 'm per ongeluk toepaste).
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  await prisma.company.update({
    where: { id: membership.companyId },
    data: { appliedCouponId: null, couponMonthsRemaining: null },
  });

  return NextResponse.json({ ok: true });
}
