import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyShiftChanges, describeShift, shiftDateLabel, type ShiftChange } from "@/lib/roster-change";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const shift = await prisma.shift.findUnique({ where: { id: params.id } });
  if (!shift || shift.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const data: {
    startTime?: string;
    endTime?: string;
    role?: string | null;
    membershipId?: string | null;
  } = {};

  if (body?.startTime !== undefined) {
    if (!timePattern.test(body.startTime)) {
      return NextResponse.json({ error: "Ongeldige starttijd" }, { status: 400 });
    }
    data.startTime = body.startTime;
  }
  if (body?.endTime !== undefined) {
    if (!timePattern.test(body.endTime)) {
      return NextResponse.json({ error: "Ongeldige eindtijd" }, { status: 400 });
    }
    data.endTime = body.endTime;
  }
  if (body?.role !== undefined) {
    const role = String(body.role ?? "").trim();
    data.role = role || null;
  }

  let newMembershipId: string | null | undefined = undefined;
  if (body?.membershipId !== undefined) {
    const requested = body.membershipId || null;
    if (requested) {
      const target = await prisma.membership.findUnique({ where: { id: requested } });
      if (!target || target.companyId !== membership.companyId) {
        return NextResponse.json({ error: "Ongeldige medewerker" }, { status: 400 });
      }
    }
    data.membershipId = requested;
    newMembershipId = requested;
  }

  const updated = await prisma.shift.update({
    where: { id: shift.id },
    data,
  });

  // Als de toegewezen medewerker wijzigt: een eventueel openstaand
  // ruilverzoek voor deze shift klopt niet meer, dus die trekken we in.
  // En een concept-urenregel verhuist mee naar de nieuwe medewerker (of
  // wordt losgekoppeld als de shift nu weer open staat).
  if (newMembershipId !== undefined && newMembershipId !== shift.membershipId) {
    await prisma.shiftSwapRequest
      .delete({ where: { shiftId: shift.id } })
      .catch(() => null); // was toch al geen actief ruilverzoek

    const timeEntry = await prisma.timeEntry.findUnique({ where: { shiftId: shift.id } });
    if (timeEntry) {
      if (newMembershipId && timeEntry.status === "DRAFT") {
        await prisma.timeEntry.update({
          where: { id: timeEntry.id },
          data: { membershipId: newMembershipId },
        });
      } else if (!newMembershipId) {
        await prisma.timeEntry.update({
          where: { id: timeEntry.id },
          data: { shiftId: null },
        });
      }
    } else if (newMembershipId) {
      await prisma.timeEntry.create({
        data: {
          companyId: shift.companyId,
          membershipId: newMembershipId,
          shiftId: shift.id,
          date: shift.date,
          startTime: updated.startTime,
          endTime: "",
          status: "DRAFT",
        },
      });
    }
  }

  // Medewerkers laten weten wat er aan hun diensten veranderd is (alleen als
  // het rooster van die week al online staat, zie lib/roster-change).
  const changes: ShiftChange[] = [];
  if (shift.membershipId !== updated.membershipId) {
    if (shift.membershipId) {
      changes.push({
        membershipId: shift.membershipId,
        title: `Je dienst op ${shiftDateLabel(shift.date)} is vervallen`,
        body: `Je staat niet meer ingepland op ${describeShift(shift)}.`,
      });
    }
    if (updated.membershipId) {
      changes.push({
        membershipId: updated.membershipId,
        title: "Je bent ingeroosterd",
        body: `Je staat ingepland op ${describeShift(updated)}.`,
      });
    }
  } else if (
    updated.membershipId &&
    (shift.startTime !== updated.startTime ||
      shift.endTime !== updated.endTime ||
      (shift.role ?? null) !== (updated.role ?? null))
  ) {
    changes.push({
      membershipId: updated.membershipId,
      title: `Je dienst op ${shiftDateLabel(updated.date)} is gewijzigd`,
      body: `Was: ${describeShift(shift)}. Nu: ${describeShift(updated)}.`,
    });
  }
  if (changes.length > 0) {
    await notifyShiftChanges({
      companyId: membership.companyId,
      companyName: membership.companyName,
      actorMembershipId: membership.membershipId,
      shiftDate: updated.date,
      changes,
    });
  }

  return NextResponse.json({ shift: updated });
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
  if (!membership || (membership.role !== "OWNER" && membership.role !== "MANAGER")) {
    return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
  }

  const shift = await prisma.shift.findUnique({ where: { id: params.id } });
  if (!shift || shift.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  // Een eventuele urenregel blijft gewoon bestaan (raakt alleen ontkoppeld
  // van de shift, via onDelete: SetNull), een eventueel ruilverzoek wordt
  // automatisch mee opgeruimd (onDelete: Cascade).
  await prisma.shift.delete({ where: { id: shift.id } });

  if (shift.membershipId) {
    await notifyShiftChanges({
      companyId: membership.companyId,
      companyName: membership.companyName,
      actorMembershipId: membership.membershipId,
      shiftDate: shift.date,
      changes: [
        {
          membershipId: shift.membershipId,
          title: `Je dienst op ${shiftDateLabel(shift.date)} is vervallen`,
          body: `Je staat niet meer ingepland op ${describeShift(shift)}.`,
        },
      ],
    });
  }

  return NextResponse.json({ ok: true });
}
