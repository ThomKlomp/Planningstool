import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRICE_TIERS } from "@/lib/pricing";

async function requirePlatformAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isPlatformAdmin) return null;
  return session;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requirePlatformAdmin();
  if (!session) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: {
    type?: "PERCENTAGE" | "FIXED_AMOUNT";
    value?: number;
    duration?: "FOREVER" | "LIMITED_MONTHS";
    durationMonths?: number | null;
    applicableInterval?: "MONTHLY" | "YEARLY" | "BOTH";
    applicableTiers?: string[];
    maxRedemptions?: number | null;
    expiresAt?: Date | null;
    active?: boolean;
  } = {};

  if (body?.type !== undefined) {
    if (body.type !== "PERCENTAGE" && body.type !== "FIXED_AMOUNT") {
      return NextResponse.json({ error: "Ongeldig type" }, { status: 400 });
    }
    data.type = body.type;
  }
  if (body?.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Ongeldige waarde" }, { status: 400 });
    }
    if ((data.type ?? body?.currentType) === "PERCENTAGE" && value > 100) {
      return NextResponse.json({ error: "Percentage kan niet boven 100 zijn" }, { status: 400 });
    }
    data.value = value;
  }
  if (body?.duration !== undefined) {
    if (body.duration !== "FOREVER" && body.duration !== "LIMITED_MONTHS") {
      return NextResponse.json({ error: "Ongeldige duur" }, { status: 400 });
    }
    data.duration = body.duration;
  }
  if (body?.durationMonths !== undefined) {
    data.durationMonths = body.durationMonths ? Number(body.durationMonths) : null;
  }
  if (body?.applicableInterval !== undefined) {
    if (!["MONTHLY", "YEARLY", "BOTH"].includes(body.applicableInterval)) {
      return NextResponse.json({ error: "Ongeldig interval" }, { status: 400 });
    }
    data.applicableInterval = body.applicableInterval;
  }
  if (body?.applicableTiers !== undefined) {
    const validTierIds = PRICE_TIERS.map((t) => t.id);
    if (!Array.isArray(body.applicableTiers)) {
      return NextResponse.json({ error: "Ongeldige staffels" }, { status: 400 });
    }
    const tiers: string[] = body.applicableTiers.filter(
      (id: unknown) => typeof id === "string" && validTierIds.includes(id)
    );
    data.applicableTiers = tiers.length === validTierIds.length ? [] : tiers;
  }
  if (body?.maxRedemptions !== undefined) {
    data.maxRedemptions = body.maxRedemptions ? Number(body.maxRedemptions) : null;
  }
  if (body?.expiresAt !== undefined) {
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Ongeldige einddatum" }, { status: 400 });
    }
    data.expiresAt = expiresAt;
  }
  if (body?.active !== undefined) {
    data.active = Boolean(body.active);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Niets om aan te passen" }, { status: 400 });
  }

  // Belangrijk: dit past alleen de code zelf aan, niet lopende kortingen
  // die al ergens zijn ingewisseld (die staan als snapshot vast op
  // CompanyDiscount), dus dit is altijd veilig, ook nadat de code al
  // gebruikt is.
  const discountCode = await prisma.discountCode.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ discountCode });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await requirePlatformAdmin();
  if (!session) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  // Code zelf verwijderen mag alleen als hij nog nooit is ingewisseld,
  // anders verliest een zaak met een lopende korting de verwijzing.
  // "Uitzetten" (PATCH active: false) is de veiligere route voor codes
  // die al gebruikt zijn.
  const discountCode = await prisma.discountCode.findUnique({
    where: { id: params.id },
    select: { timesRedeemed: true },
  });
  if (discountCode && discountCode.timesRedeemed > 0) {
    return NextResponse.json(
      { error: "Deze code is al gebruikt, zet 'm uit in plaats van verwijderen" },
      { status: 409 }
    );
  }

  await prisma.discountCode.delete({ where: { id: params.id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
