import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOCATION_PALETTE, listLocations } from "@/lib/locations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }
  return NextResponse.json({ locations: await listLocations(membership.companyId) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim().slice(0, 60);
  const color = LOCATION_PALETTE.includes(body?.color) ? body.color : LOCATION_PALETTE[0];
  if (!name) {
    return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
  }
  const existing = await prisma.location.findMany({
    where: { companyId: membership.companyId },
    select: { name: true, order: true },
  });
  if (existing.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "Er is al een locatie met die naam" }, { status: 409 });
  }

  const location = await prisma.location.create({
    data: {
      companyId: membership.companyId,
      name,
      color,
      order: existing.reduce((max, l) => Math.max(max, l.order + 1), 0),
    },
  });
  return NextResponse.json({ location });
}
