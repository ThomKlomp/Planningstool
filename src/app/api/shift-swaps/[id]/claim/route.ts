import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(
  req: Request,
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

  const body = await req.json().catch(() => ({}));
  const asSwap = Boolean(body?.asSwap);

  const swapRequest = await prisma.shiftSwapRequest.findUnique({
    where: { id: params.id },
    include: { shift: true },
  });
  if (!swapRequest || swapRequest.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }
  if (swapRequest.status !== "OPEN") {
    return NextResponse.json({ error: "Deze dienst is niet meer beschikbaar" }, { status: 409 });
  }
  if (swapRequest.offeredById === membership.membershipId) {
    return NextResponse.json(
      { error: "Je kunt je eigen aangeboden dienst niet overnemen" },
      { status: 400 }
    );
  }

  const [company, offerer, claimer] = await Promise.all([
    prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { autoApproveShiftSwaps: true },
    }),
    prisma.membership.findUnique({
      where: { id: swapRequest.offeredById },
      include: { user: true },
    }),
    prisma.membership.findUnique({
      where: { id: membership.membershipId },
      include: { user: true },
    }),
  ]);

  const dateLabel = swapRequest.shift.date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeLabel = `${swapRequest.shift.startTime}–${swapRequest.shift.endTime}`;
  const claimerName = claimer?.user.name ?? claimer?.user.email ?? "Een collega";

  // Een manager/eigenaar heeft sowieso goedkeuringsrecht, dus die hoeft niet
  // via de wachtrij: dat zou anders betekenen dat ze hun eigen overname aan
  // zichzelf moeten goedkeuren.
  const isManager = membership.role === "OWNER" || membership.role === "MANAGER";

  if (isManager || company?.autoApproveShiftSwaps) {
    const updated = await reassignShift(swapRequest, membership.membershipId, asSwap);

    await notify(membership.companyId, [swapRequest.offeredById], {
      title: asSwap ? `${claimerName} wil met je ruilen` : "Je aangeboden dienst is overgenomen",
      body: `${timeLabel} op ${dateLabel}.`,
      link: "/dashboard/roster",
    });

    if (offerer?.user.email) {
      await sendEmail({
        to: offerer.user.email,
        subject: asSwap
          ? `${claimerName} wil ruilen voor je dienst op ${dateLabel}`
          : `Je dienst op ${dateLabel} is overgenomen`,
        html: emailLayout(
          asSwap ? "Er is een ruilverzoek" : "Je dienst is overgenomen",
          asSwap
            ? `
              <p><strong>${claimerName}</strong> wil met je ruilen voor je dienst op
              <strong>${dateLabel}</strong> (${timeLabel}).</p>
              <p style="margin-top: 12px;">
                Dit is nog geen kant-en-klare ruil: Shiftje wisselt niet automatisch
                een dienst terug. Spreek samen af welke dienst daarvoor terugkomt,
                en zet die eventueel zelf ook open ter overname.
              </p>
            `
            : `
              <p><strong>${claimerName}</strong> heeft je dienst op
              <strong>${dateLabel}</strong> (${timeLabel}) overgenomen. Je staat
              hier zelf niet meer voor ingepland.</p>
            `
        ),
      });
    }

    return NextResponse.json({ swapRequest: updated, autoApproved: true });
  }

  const updated = await prisma.shiftSwapRequest.update({
    where: { id: swapRequest.id },
    data: {
      status: "PENDING_APPROVAL",
      claimedById: membership.membershipId,
      claimedAt: new Date(),
      claimedAsSwap: asSwap,
    },
  });

  const managers = await prisma.membership.findMany({
    where: { companyId: membership.companyId, role: { in: ["OWNER", "MANAGER"] } },
    include: { user: true },
  });

  await notify(
    membership.companyId,
    managers.map((m) => m.id),
    {
      title: asSwap
        ? `Ruilverzoek van ${claimerName} wacht op goedkeuring`
        : "Overname wacht op jouw goedkeuring",
      body: `${timeLabel} op ${dateLabel}.`,
      link: "/dashboard/roster",
    }
  );

  const managerEmails = managers.map((m) => m.user.email).filter((e): e is string => Boolean(e));
  if (managerEmails.length > 0) {
    await sendEmail({
      bcc: managerEmails,
      subject: asSwap
        ? `Ruilverzoek wacht op goedkeuring, ${dateLabel}`
        : `Overname wacht op goedkeuring, ${dateLabel}`,
      html: emailLayout(
        "Wacht op jouw goedkeuring",
        `
          <p><strong>${claimerName}</strong> wil de dienst van
          <strong>${offerer?.user.name ?? offerer?.user.email ?? "een collega"}</strong>
          op <strong>${dateLabel}</strong> (${timeLabel}) ${asSwap ? "ruilen" : "overnemen"}.</p>
          <p style="margin-top: 20px;">
            <a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard/roster" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
              Bekijken in het rooster
            </a>
          </p>
        `
      ),
    });
  }

  return NextResponse.json({ swapRequest: updated, autoApproved: false });
}

/**
 * Wijst de shift toe aan de nieuwe medewerker en verhuist een eventuele
 * concept-urenregel mee (zelfde logica als bij handmatig herindelen).
 */
async function reassignShift(
  swapRequest: { id: string; shiftId: string },
  newMembershipId: string,
  asSwap: boolean
) {
  const shift = await prisma.shift.update({
    where: { id: swapRequest.shiftId },
    data: { membershipId: newMembershipId },
  });

  const timeEntry = await prisma.timeEntry.findUnique({ where: { shiftId: shift.id } });
  if (timeEntry && timeEntry.status === "DRAFT") {
    await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: { membershipId: newMembershipId },
    });
  } else if (!timeEntry) {
    await prisma.timeEntry.create({
      data: {
        companyId: shift.companyId,
        membershipId: newMembershipId,
        shiftId: shift.id,
        date: shift.date,
        startTime: shift.startTime,
        endTime: "",
        status: "DRAFT",
      },
    });
  }

  return prisma.shiftSwapRequest.update({
    where: { id: swapRequest.id },
    data: {
      status: "APPROVED",
      claimedById: newMembershipId,
      claimedAt: new Date(),
      claimedAsSwap: asSwap,
      reviewedAt: new Date(),
    },
  });
}
