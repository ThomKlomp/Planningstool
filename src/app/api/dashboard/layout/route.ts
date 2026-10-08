import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allowedBlocks } from "@/lib/dashboard-blocks";

// Eigen indeling van het overzicht opslaan: een geordende lijst blok-id's,
// of null om terug te gaan naar de standaardindeling.
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const membership = session?.user?.memberships[0];
  if (!session?.user || !membership) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const blocks: unknown = body?.blocks;

  if (blocks === null) {
    await prisma.membership.update({
      where: { id: membership.membershipId },
      data: { dashboardLayout: null as never },
    });
    return NextResponse.json({ ok: true });
  }

  if (!Array.isArray(blocks) || !blocks.every((b) => typeof b === "string")) {
    return NextResponse.json({ error: "Ongeldige indeling" }, { status: 400 });
  }
  const allowed = new Set(allowedBlocks(membership.role).map((b) => b.id as string));
  const clean = Array.from(new Set(blocks as string[])).filter((id) => allowed.has(id));

  await prisma.membership.update({
    where: { id: membership.membershipId },
    data: { dashboardLayout: clean },
  });
  return NextResponse.json({ ok: true, blocks: clean });
}
