import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateToken() {
  return crypto.randomBytes(24).toString("base64url");
}

function toUrls(token: string | null) {
  if (!token) return { url: null, webcalUrl: null };
  const baseUrl = process.env.NEXTAUTH_URL ?? "";
  const url = `${baseUrl}/api/calendar/${token}`;
  return { url, webcalUrl: url.replace(/^https?:\/\//, "webcal://") };
}

// Haalt de bestaande agenda-link op zonder er een nieuwe aan te maken —
// handig bij het laden van de instellingenpagina.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const current = await prisma.membership.findUnique({
    where: { id: membership.membershipId },
    select: { calendarToken: true },
  });

  return NextResponse.json(toUrls(current?.calendarToken ?? null));
}

// Maakt een agenda-link aan als die er nog niet is, of vervangt 'm als
// { regenerate: true } is meegegeven (bv. als de link gelekt is).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const regenerate = body?.regenerate === true;

  const current = await prisma.membership.findUnique({
    where: { id: membership.membershipId },
    select: { calendarToken: true },
  });

  let token = current?.calendarToken ?? null;
  if (!token || regenerate) {
    token = generateToken();
    await prisma.membership.update({
      where: { id: membership.membershipId },
      data: { calendarToken: token },
    });
  }

  return NextResponse.json(toUrls(token));
}
