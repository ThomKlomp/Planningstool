import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const membership = session.user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "Geen bedrijf" }, { status: 400 });
  }

  const timeEntry = await prisma.timeEntry.findUnique({ where: { id: params.id } });
  if (!timeEntry || timeEntry.companyId !== membership.companyId) {
    return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  }

  const canManage = membership.role === "OWNER" || membership.role === "MANAGER";
  const isOwnEntry = timeEntry.membershipId === membership.membershipId;
  const body = await req.json();

  // Manager keurt goed/af, of stelt een vraag met een verplichte opmerking.
  if (canManage && body.status) {
    const status = body.status;
    if (!["APPROVED", "REJECTED", "QUERIED"].includes(status)) {
      return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
    }
    if (status === "QUERIED" && !body.comment?.trim()) {
      return NextResponse.json(
        { error: "Geef aan wat je wilt weten" },
        { status: 400 }
      );
    }

    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        status,
        managerComment: status === "QUERIED" ? body.comment.trim() : timeEntry.managerComment,
        reviewedById: membership.membershipId,
        reviewedAt: new Date(),
      },
    });

    // De medewerker moet weten dat er een vraag ligt: melding in Shiftje én
    // een e-mail. Een mislukte mail mag het stellen van de vraag niet blokkeren.
    if (status === "QUERIED") {
      await notifyEmployeeOfQuery(updated, membership.companyName, membership.companySlug);
    }

    return NextResponse.json({ timeEntry: updated });
  }

  // Medewerker past een eigen, nog niet afgeronde urenregel aan (concept,
  // in behandeling, of met een vraag erbij) en dient 'm (opnieuw) in.
  const editableStatuses = ["DRAFT", "SUBMITTED", "QUERIED"];
  if (isOwnEntry && editableStatuses.includes(timeEntry.status)) {
    const company = await prisma.company.findUnique({
      where: { id: membership.companyId },
      select: { autoApproveHours: true },
    });
    const { date, startTime, endTime, breakMinutes, note } = body;
    const updated = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        breakMinutes: breakMinutes !== undefined ? Number(breakMinutes) : undefined,
        note: note ?? undefined,
        status: company?.autoApproveHours ? "APPROVED" : "SUBMITTED",
        reviewedAt: company?.autoApproveHours ? new Date() : timeEntry.reviewedAt,
      },
    });
    return NextResponse.json({ timeEntry: updated });
  }

  return NextResponse.json({ error: "Geen rechten" }, { status: 403 });
}

async function notifyEmployeeOfQuery(
  entry: { companyId: string; membershipId: string; date: Date; startTime: string; endTime: string; managerComment: string | null },
  companyName: string,
  companySlug: string
) {
  const dateLabel = entry.date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const comment = entry.managerComment ?? "";

  try {
    await notify(entry.companyId, [entry.membershipId], {
      title: "Je manager heeft een vraag over je uren",
      body: `${dateLabel}: ${comment}`,
      link: "/dashboard/hours",
    });

    const employee = await prisma.membership.findUnique({
      where: { id: entry.membershipId },
      include: { user: true },
    });
    if (!employee?.user.email) return;

    const url = `${process.env.NEXTAUTH_URL ?? ""}/dashboard/hours`;
    await sendEmail({
      to: employee.user.email,
      subject: `Vraag over je uren van ${dateLabel}`,
      html: emailLayout(
        "Je manager heeft een vraag over je uren",
        `
          <p>Bij <strong>${escapeHtml(companyName)}</strong> heeft je manager een vraag over je
          uren van <strong>${escapeHtml(dateLabel)}</strong>
          (${escapeHtml(entry.startTime)}–${escapeHtml(entry.endTime || "?")}):</p>
          <p style="margin-top: 12px; padding: 12px 14px; background: #F4EFE6; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(comment)}</p>
          <p style="margin-top: 16px;">Pas je uren aan (of licht ze toe) en dien ze opnieuw in.</p>
          <p style="margin-top: 20px;">
            <a href="${url}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
              Naar mijn uren
            </a>
          </p>
        `
      ),
    });
  } catch (err) {
    console.error(`[time-entries] melding over vraag mislukt (${companySlug})`, err);
  }
}
