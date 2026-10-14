import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOCATION_PALETTE } from "@/lib/locations";

async function load(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Niet ingelogd" }, { status: 401 }) };
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return { error: NextResponse.json({ error: "Geen rechten" }, { status: 403 }) };
  }
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location || location.companyId !== membership.companyId) {
    return { error: NextResponse.json({ error: "Niet gevonden" }, { status: 404 }) };
  }
  return { membership, location };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if (r.error) return r.error;
  const body = await req.json().catch(() => ({}));
  const data: { order?: number; name?: string; color?: string } = {};
  if (body.order !== undefined) data.order = Number(body.order) || 0;
  if (body.name !== undefined) {
    const name = String(body.name).trim().slice(0, 60);
    if (!name) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
    data.name = name;
  }
  if (body.color !== undefined && LOCATION_PALETTE.includes(body.color)) data.color = body.color;
  const location = await prisma.location.update({ where: { id: params.id }, data });
  return NextResponse.json({ location });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if (r.error) return r.error;
  // Diensten en uren verliezen hun locatie (onDelete: SetNull); de koppelingen van
  // medewerkers verdwijnen (Cascade). Niets anders wordt verwijderd.
  await prisma.location.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
