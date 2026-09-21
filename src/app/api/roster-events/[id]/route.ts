import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

async function requireManagerEvent(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Niet ingelogd" }, { status: 401 }) };
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return { error: NextResponse.json({ error: "Geen rechten" }, { status: 403 }) };
  }
  const event = await prisma.rosterEvent.findUnique({ where: { id } });
  if (!event || event.companyId !== membership.companyId) {
    return { error: NextResponse.json({ error: "Niet gevonden" }, { status: 404 }) };
  }
  return { event };
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { event, error } = await requireManagerEvent(params.id);
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const data: {
    title?: string;
    description?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  } = {};

  if (body?.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) {
      return NextResponse.json({ error: "Geef het evenement een titel" }, { status: 400 });
    }
    data.title = title;
  }
  if (body?.description !== undefined) {
    data.description = String(body.description ?? "").trim() || null;
  }
  if (event!.date) {
    for (const field of ["startTime", "endTime"] as const) {
      if (body?.[field] !== undefined) {
        const value = body[field] ? String(body[field]) : null;
        if (value && !TIME_PATTERN.test(value)) {
          return NextResponse.json({ error: "Ongeldige tijd" }, { status: 400 });
        }
        data[field] = value;
      }
    }
  }

  const updated = await prisma.rosterEvent.update({ where: { id: params.id }, data });
  return NextResponse.json({ event: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireManagerEvent(params.id);
  if (error) return error;

  await prisma.rosterEvent.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
