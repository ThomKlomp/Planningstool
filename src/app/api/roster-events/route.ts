import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { weekStartOf } from "@/lib/roster-publish";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Nieuw evenement op het rooster: bij een dag (`date`) of een hele week
// (`weekStart`). Alleen eigenaar/manager.
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
  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Geef het evenement een titel" }, { status: 400 });
  }
  if (Boolean(body?.date) === Boolean(body?.weekStart)) {
    return NextResponse.json(
      { error: "Kies een dag of een week (niet beide)" },
      { status: 400 }
    );
  }

  const startTime = body?.startTime ? String(body.startTime) : null;
  const endTime = body?.endTime ? String(body.endTime) : null;
  if ((startTime && !TIME_PATTERN.test(startTime)) || (endTime && !TIME_PATTERN.test(endTime))) {
    return NextResponse.json({ error: "Ongeldige tijd" }, { status: 400 });
  }

  let date: Date | null = null;
  let weekStart: Date | null = null;
  if (body.date) {
    date = new Date(String(body.date).slice(0, 10));
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
    }
  } else {
    const parsed = new Date(body.weekStart);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Ongeldige week" }, { status: 400 });
    }
    weekStart = weekStartOf(parsed);
  }

  const event = await prisma.rosterEvent.create({
    data: {
      companyId: membership.companyId,
      date,
      weekStart,
      title,
      description: String(body?.description ?? "").trim() || null,
      // Tijden zijn alleen zinvol bij een evenement op een losse dag.
      startTime: date ? startTime : null,
      endTime: date ? endTime : null,
    },
  });

  return NextResponse.json({ event });
}
