import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";
import { getWeekDates, toDateParam } from "@/lib/week";
import { filterVisibleForEmployee } from "@/lib/roster-publish";

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buttonHtml(url: string, label: string) {
  return `<p style="margin-top: 20px;">
    <a href="${url}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
      ${label}
    </a>
  </p>`;
}

/**
 * Iemands eigen aankomende diensten als HTML-lijst, voor in de ruilmail.
 * Alleen diensten die de ontvanger ook in het rooster kan zien (dus geen
 * concept-weken), anders lekt een ruilmail een nog niet gepubliceerd rooster.
 */
async function ownUpcomingShiftsHtml(
  companyId: string,
  membershipId: string,
  excludeShiftId: string
) {
  const upcoming = await prisma.shift.findMany({
    where: {
      membershipId,
      id: { not: excludeShiftId },
      date: { gte: new Date(new Date().toDateString()) },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 30,
  });
  const shifts = await filterVisibleForEmployee(companyId, upcoming);

  if (shifts.length === 0) {
    return `<p style="margin-top: 12px; color: #666;">Deze persoon heeft verder geen aankomende diensten in het rooster staan om voor terug te ruilen.</p>`;
  }

  const items = shifts
    .map((s) => {
      const label = s.date.toLocaleDateString("nl-NL", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      return `<li>${escapeHtml(label)}, ${escapeHtml(s.startTime)}–${escapeHtml(s.endTime)}${
        s.role ? ` (${escapeHtml(s.role)})` : ""
      }</li>`;
    })
    .join("");

  return `
    <p style="margin-top: 16px;">Het rooster van deze persoon (diensten waar eventueel voor teruggeruild kan worden):</p>
    <ul style="margin: 8px 0; padding-left: 20px;">${items}</ul>
  `;
}

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
  const note = typeof body?.note === "string" ? body.note.trim() : "";

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
  const claimerNameHtml = escapeHtml(claimerName);

  // Link naar de week van de dienst zelf, zodat je op de juiste plek landt.
  const shiftWeekStart = getWeekDates(swapRequest.shift.date)[0];
  const rosterLink = `/dashboard/rooster?week=${toDateParam(shiftWeekStart)}`;
  const rosterUrl = `${process.env.NEXTAUTH_URL ?? ""}${rosterLink}`;

  // ------------------------------------------------------------------
  // RUILEN: een voorstel aan de aanbieder, géén overname en géén
  // goedkeuring door de manager. Aanbieder en voorsteller spreken onderling
  // af; de manager past daarna het rooster aan.
  // ------------------------------------------------------------------
  if (asSwap) {
    const already = await prisma.shiftSwapProposal.findUnique({
      where: {
        swapRequestId_proposedById: {
          swapRequestId: swapRequest.id,
          proposedById: membership.membershipId,
        },
      },
    });
    if (already) {
      return NextResponse.json(
        { error: "Je hebt al een ruilverzoek voor deze dienst gestuurd" },
        { status: 409 }
      );
    }

    const proposal = await prisma.shiftSwapProposal.create({
      data: {
        swapRequestId: swapRequest.id,
        proposedById: membership.membershipId,
        note: note || null,
      },
    });

    await notify(membership.companyId, [swapRequest.offeredById], {
      title: `${claimerName} wil ruilen voor je dienst`,
      body: `${timeLabel} op ${dateLabel}. Neem onderling contact op om af te spreken wat je ruilt.`,
      link: rosterLink,
    });

    if (offerer?.user.email) {
      const claimerShiftsHtml = await ownUpcomingShiftsHtml(
        membership.companyId,
        membership.membershipId,
        swapRequest.shiftId
      );

      await sendEmail({
        to: offerer.user.email,
        subject: `${claimerName} wil ruilen voor je dienst op ${dateLabel}`,
        html: emailLayout(
          "Er is een ruilverzoek",
          `
            <p><strong>${claimerNameHtml}</strong> wil ruilen voor je dienst op
            <strong>${escapeHtml(dateLabel)}</strong> (${timeLabel}).</p>
            ${
              note
                ? `<p style="margin-top: 12px;"><strong>Voorstel van ${claimerNameHtml}:</strong> ${escapeHtml(note)}</p>`
                : ""
            }
            ${claimerShiftsHtml}
            <p style="margin-top: 16px; padding: 12px 14px; background: #F4EFE6; border-radius: 8px;">
              <strong>Neem onderling contact op.</strong> Shiftje wisselt niet
              automatisch: spreek zelf met ${claimerNameHtml} af welke dienst je
              terugkrijgt, en laat daarna je manager het rooster aanpassen.
            </p>
            ${buttonHtml(rosterUrl, "Bekijken in het rooster")}
          `
        ),
      });
    }

    return NextResponse.json({ proposal, swapProposed: true });
  }

  // ------------------------------------------------------------------
  // OVERNEMEN
  // ------------------------------------------------------------------

  // Een manager/eigenaar heeft sowieso goedkeuringsrecht, dus die hoeft niet
  // via de wachtrij: dat zou anders betekenen dat ze hun eigen overname aan
  // zichzelf moeten goedkeuren.
  const isManager = membership.role === "OWNER" || membership.role === "MANAGER";

  if (isManager || company?.autoApproveShiftSwaps) {
    const updated = await reassignShift(swapRequest, membership.membershipId);

    await notify(membership.companyId, [swapRequest.offeredById], {
      title: "Je aangeboden dienst is overgenomen",
      body: `${claimerName} nam je dienst over: ${timeLabel} op ${dateLabel}.`,
      link: rosterLink,
    });

    if (offerer?.user.email) {
      await sendEmail({
        to: offerer.user.email,
        subject: `Je dienst op ${dateLabel} is overgenomen`,
        html: emailLayout(
          "Je dienst is overgenomen",
          `
            <p><strong>${claimerNameHtml}</strong> heeft je dienst op
            <strong>${escapeHtml(dateLabel)}</strong> (${timeLabel}) overgenomen. Je staat
            hier zelf niet meer voor ingepland.</p>
            ${buttonHtml(rosterUrl, "Bekijken in het rooster")}
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
      claimedAsSwap: false,
    },
  });

  // De aanbieder weet nu dat iemand de dienst wil overnemen.
  await notify(membership.companyId, [swapRequest.offeredById], {
    title: `${claimerName} wil je dienst overnemen`,
    body: `${timeLabel} op ${dateLabel}. Je manager moet dit nog goedkeuren.`,
    link: rosterLink,
  });

  const managers = await prisma.membership.findMany({
    where: { companyId: membership.companyId, role: { in: ["OWNER", "MANAGER"] } },
    include: { user: true },
  });

  await notify(
    membership.companyId,
    managers.map((m) => m.id),
    {
      title: "Overname wacht op jouw goedkeuring",
      body: `${claimerName}: ${timeLabel} op ${dateLabel}.`,
      link: rosterLink,
    }
  );

  const managerEmails = managers.map((m) => m.user.email).filter((e): e is string => Boolean(e));
  if (managerEmails.length > 0) {
    await sendEmail({
      to: `${membership.companySlug}@shiftje.nl`,
      bcc: managerEmails,
      subject: `Overname wacht op goedkeuring, ${dateLabel}`,
      html: emailLayout(
        "Wacht op jouw goedkeuring",
        `
          <p><strong>${claimerNameHtml}</strong> wil de dienst van
          <strong>${escapeHtml(offerer?.user.name ?? offerer?.user.email ?? "een collega")}</strong>
          op <strong>${escapeHtml(dateLabel)}</strong> (${timeLabel}) overnemen.</p>
          ${buttonHtml(rosterUrl, "Bekijken in het rooster")}
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
  newMembershipId: string
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
      claimedAsSwap: false,
      reviewedAt: new Date(),
    },
  });
}
