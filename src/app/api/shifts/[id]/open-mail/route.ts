import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planOpenShiftMail, sendOpenShiftMail, toSummary } from "@/lib/open-shift-mail";

async function load(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Niet ingelogd" }, { status: 401 }) };
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return { error: NextResponse.json({ error: "Geen rechten" }, { status: 403 }) };
  }
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift || shift.companyId !== membership.companyId) {
    return { error: NextResponse.json({ error: "Niet gevonden" }, { status: 404 }) };
  }
  if (shift.membershipId) {
    return { error: NextResponse.json({ error: "Deze dienst is niet open" }, { status: 400 }) };
  }
  return { membership, shift };
}

/** Voorbeeld: wie zou er gemaild worden en waarom. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if (r.error) return r.error;
  const plan = await planOpenShiftMail({
    companyId: r.membership!.companyId,
    shift: r.shift!,
    actorMembershipId: r.membership!.membershipId,
    includeManagers: new URL(req.url).searchParams.get("includeManagers") === "1",
  });
  return NextResponse.json({ summary: toSummary(plan) });
}

/** Verstuurt de mail echt. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if (r.error) return r.error;
  const body = await req.json().catch(() => ({}));
  const summary = await sendOpenShiftMail({
    companyId: r.membership!.companyId,
    companyName: r.membership!.companyName,
    companySlug: r.membership!.companySlug,
    actorMembershipId: r.membership!.membershipId,
    shift: r.shift!,
    includeManagers: body?.includeManagers === true,
  });
  return NextResponse.json({ summary });
}
