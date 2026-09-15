import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";
import { getWeekDates, toDateParam } from "@/lib/week";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id: params.id },
    include: { swapRequest: true },
  });
  if (!shift || shift.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (shift.membershipId !== membership.membershipId) {
    return NextResponse.json({ error: "Dit is niet jouw dienst" }, { status: 403 });
  }
  if (shift.swapRequest) {
    return NextResponse.json({ error: "Deze dienst is al aangeboden" }, { status: 409 });
  }

  // Meld het bij iedereen die die dag beschikbaar staat (niet UNAVAILABLE),
  // behalve de aanbieder zelf.
  const availableThatDay = await prisma.availability.findMany({
    where: {
      date: shift.date,
      status: { not: "UNAVAILABLE" },
      membership: { companyId: membership.companyId },
      membershipId: { not: membership.membershipId },
    },
    select: { membershipId: true },
  });
  const recipientIds = [...new Set(availableThatDay.map((a) => a.membershipId))];

  const swapRequest = await prisma.shiftSwapRequest.create({
    data: {
      companyId: membership.companyId,
      shiftId: shift.id,
      offeredById: membership.membershipId,
      notifiedMembershipIds: recipientIds,
    },
  });

  // Link naar de week van de shift zelf, niet naar de huidige week: anders
  // land je op de roosterpagina zonder de aangeboden dienst te zien als
  // die in een andere week valt.
  const shiftWeekStart = getWeekDates(shift.date)[0];
  const rosterLink = `/dashboard/roster?week=${toDateParam(shiftWeekStart)}`;

  await notify(membership.companyId, recipientIds, {
    title: `Dienst aangeboden op ${shift.date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}`,
    body: `${shift.startTime}–${shift.endTime}${shift.role ? ` · ${shift.role}` : ""}, beschikbaar voor overname of ruil.`,
    link: rosterLink,
  });

  // E-mail naar de collega's die 'm kunnen overnemen, en naar
  // managers/eigenaren zodat zij ook weten dat er een dienst openstaat.
  const [recipientMembers, managerMembers] = await Promise.all([
    prisma.membership.findMany({
      where: { id: { in: recipientIds } },
      include: { user: true },
    }),
    prisma.membership.findMany({
      where: {
        companyId: membership.companyId,
        role: { in: ["OWNER", "MANAGER"] },
        id: { not: membership.membershipId },
      },
      include: { user: true },
    }),
  ]);

  const notifyEmails = new Set<string>();
  for (const m of [...recipientMembers, ...managerMembers]) {
    if (m.user.email) notifyEmails.add(m.user.email);
  }

  if (notifyEmails.size > 0) {
    const dateLabel = shift.date.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const rosterUrl = `${process.env.NEXTAUTH_URL ?? ""}${rosterLink}`;
    const offeredByName = session.user.name ?? "Een collega";

    await sendEmail({
      to: session.user.email ?? Array.from(notifyEmails)[0],
      bcc: Array.from(notifyEmails),
      subject: `Dienst aangeboden, ${dateLabel} bij ${membership.companyName}`,
      html: emailLayout(
        "Er staat een dienst open",
        `
          <p>${offeredByName} biedt een dienst aan op <strong>${dateLabel}</strong>
          (${shift.startTime}–${shift.endTime}${shift.role ? `, ${shift.role}` : ""}).</p>
          <p style="margin-top: 20px;">
            <a href="${rosterUrl}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
              Bekijken in het rooster
            </a>
          </p>
        `
      ),
    });
  }

  return NextResponse.json({ swapRequest });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id: params.id },
    include: { swapRequest: true },
  });
  if (!shift?.swapRequest || shift.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (shift.swapRequest.offeredById !== membership.membershipId) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }
  if (shift.swapRequest.status !== "OPEN") {
    return NextResponse.json(
      { error: "Dit aanbod is al geclaimd, intrekken kan niet meer" },
      { status: 409 }
    );
  }

  await prisma.shiftSwapRequest.delete({ where: { id: shift.swapRequest.id } });
  return NextResponse.json({ ok: true });
}
