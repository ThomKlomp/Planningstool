import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

export async function GET() {
  const session = await requirePlatformAdmin();
  if (!session) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ codes });
}

export async function POST(req: Request) {
  const session = await requirePlatformAdmin();
  if (!session) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim().toUpperCase();
  const type = body?.type === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
  const duration = body?.duration === "LIMITED_MONTHS" ? "LIMITED_MONTHS" : "FOREVER";
  const applicableInterval = ["MONTHLY", "YEARLY", "BOTH"].includes(body?.applicableInterval)
    ? body.applicableInterval
    : "BOTH";
  const value = Number(body?.value);
  const durationMonths = body?.durationMonths ? Number(body.durationMonths) : null;
  const maxRedemptions = body?.maxRedemptions ? Number(body.maxRedemptions) : null;
  const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : null;

  if (!code) {
    return NextResponse.json({ error: "Code is verplicht" }, { status: 400 });
  }
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
  }
  if (type === "PERCENTAGE" && value > 100) {
    return NextResponse.json({ error: "Percentage kan niet boven 100 zijn" }, { status: 400 });
  }
  if (duration === "LIMITED_MONTHS" && (!durationMonths || durationMonths < 1)) {
    return NextResponse.json(
      { error: "Vul een geldig aantal maanden in" },
      { status: 400 }
    );
  }
  if (expiresAt && isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Ongeldige einddatum" }, { status: 400 });
  }

  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Deze code bestaat al" }, { status: 409 });
  }

  const discountCode = await prisma.discountCode.create({
    data: {
      code,
      type,
      value,
      duration,
      durationMonths: duration === "LIMITED_MONTHS" ? durationMonths : null,
      applicableInterval,
      maxRedemptions,
      expiresAt,
    },
  });

  return NextResponse.json({ discountCode });
}
