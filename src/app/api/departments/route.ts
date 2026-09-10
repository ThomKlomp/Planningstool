import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const departments = await prisma.department.findMany({
    where: { companyId: membership.companyId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ departments });
}

const PALETTE = [
  "#3F6E5B", // groen (huisstijl)
  "#C9821F", // amber
  "#2563EB", // blauw
  "#7C3AED", // paars
  "#DB2777", // roze
  "#0D9488", // teal
  "#92400E", // bruin
  "#475569", // slate
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const body = await req.json();
  const name = (body?.name ?? "").trim();
  const color = PALETTE.includes(body?.color) ? body.color : PALETTE[0];
  if (!name) {
    return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
  }

  const department = await prisma.department.create({
    data: { companyId: membership.companyId, name, color },
  });

  return NextResponse.json({ department });
}
