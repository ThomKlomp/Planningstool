import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { sendEmail, emailLayout } from "@/lib/email";
import { getWeekDates, toDateParam } from "@/lib/week";
import { isRosterPublished, weekStartOf } from "@/lib/roster-publish";

type ShiftLike = {
  date: Date;
  startTime: string;
  endTime: string;
  role: string | null;
};

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function shiftDateLabel(date: Date) {
  return date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
}

export function describeShift(s: ShiftLike) {
  return `${shiftDateLabel(s.date)}, ${s.startTime}–${s.endTime}${s.role ? ` (${s.role})` : ""}`;
}

export type ShiftChange = { membershipId: string; title: string; body: string };

/**
 * Laat medewerkers weten dat een manager/eigenaar iets aan hun diensten heeft
 * veranderd (melding in Shiftje + e-mail). Alleen zodra het rooster van die
 * week gepubliceerd is (bij een concept-rooster mag niemand iets zien) en
 * alleen voor diensten die nog moeten komen. De persoon die de wijziging zelf
 * doet krijgt geen melding. Faalt nooit: een mislukte mail mag het wijzigen
 * van het rooster niet blokkeren.
 */
export async function notifyShiftChanges(opts: {
  companyId: string;
  companyName: string;
  actorMembershipId: string;
  shiftDate: Date;
  changes: ShiftChange[];
}) {
  try {
    const today = new Date(new Date().toDateString());
    if (opts.shiftDate < today) return;

    const weekStart = weekStartOf(opts.shiftDate);
    if (!(await isRosterPublished(opts.companyId, weekStart))) return;

    const changes = opts.changes.filter((c) => c.membershipId !== opts.actorMembershipId);
    if (changes.length === 0) return;

    const link = `/dashboard/rooster?week=${toDateParam(getWeekDates(opts.shiftDate)[0])}`;
    const url = `${process.env.NEXTAUTH_URL ?? ""}${link}`;

    const members = await prisma.membership.findMany({
      where: { id: { in: changes.map((c) => c.membershipId) }, companyId: opts.companyId },
      include: { user: { select: { email: true } } },
    });
    const emailById = new Map(members.map((m) => [m.id, m.user.email]));

    for (const change of changes) {
      if (!emailById.has(change.membershipId)) continue;

      await notify(opts.companyId, [change.membershipId], {
        title: change.title,
        body: change.body,
        link,
      });

      const to = emailById.get(change.membershipId);
      if (to) {
        await sendEmail({
          to,
          subject: `${change.title} (${opts.companyName})`,
          html: emailLayout(
            escapeHtml(change.title),
            `
              <p>${escapeHtml(change.body)}</p>
              <p style="margin-top: 12px; color: #666;">Aangepast door je manager bij ${escapeHtml(opts.companyName)}.</p>
              <p style="margin-top: 20px;">
                <a href="${url}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
                  Bekijk het rooster
                </a>
              </p>
            `
          ),
        });
      }
    }
  } catch (err) {
    console.error("[roster-change] melding versturen mislukt", err);
  }
}

/**
 * Laat de leden van een team weten dat er een open dienst is die ze kunnen
 * oppakken (melding in Shiftje + e-mail). Zonder team: iedereen in de zaak.
 * Mensen die die dag als niet beschikbaar staan krijgen niets. Net als bij
 * andere roosterwijzigingen alleen voor diensten die nog moeten komen en
 * alleen als het rooster van die week gepubliceerd is. Faalt nooit.
 */
export async function notifyOpenShift(opts: {
  companyId: string;
  companyName: string;
  companySlug: string;
  actorMembershipId: string;
  shift: ShiftLike & { departmentId: string | null };
}) {
  try {
    const { shift } = opts;
    const today = new Date(new Date().toDateString());
    if (shift.date < today) return;
    if (!(await isRosterPublished(opts.companyId, weekStartOf(shift.date)))) return;

    const [members, unavailable] = await Promise.all([
      prisma.membership.findMany({
        where: {
          companyId: opts.companyId,
          id: { not: opts.actorMembershipId },
          ...(shift.departmentId
            ? {
                OR: [
                  { departmentId: shift.departmentId },
                  { extraDepartments: { some: { departmentId: shift.departmentId } } },
                ],
              }
            : {}),
        },
        include: { user: { select: { email: true } } },
      }),
      prisma.availability.findMany({
        where: { date: shift.date, status: "UNAVAILABLE", membership: { companyId: opts.companyId } },
        select: { membershipId: true, daypart: true },
      }),
    ]);

    // Alleen wie de hele dag (of via het sjabloon "hele dag") niet kan, valt af;
    // een losse "kan niet 12–14" betekent niet dat iemand de dag niet kan.
    const blocked = new Set(unavailable.filter((a) => a.daypart === "").map((a) => a.membershipId));
    const recipients = members.filter((m) => !blocked.has(m.id));
    if (recipients.length === 0) return;

    const link = `/dashboard/rooster?week=${toDateParam(getWeekDates(shift.date)[0])}`;
    const url = `${process.env.NEXTAUTH_URL ?? ""}${link}`;
    const title = `Open dienst op ${shiftDateLabel(shift.date)}`;
    const body = `${shift.startTime}–${shift.endTime}${shift.role ? ` · ${shift.role}` : ""}. Wie pakt 'm op?`;

    await notify(
      opts.companyId,
      recipients.map((m) => m.id),
      { title, body, link }
    );

    const emails = recipients.map((m) => m.user.email).filter((e): e is string => Boolean(e));
    if (emails.length > 0) {
      await sendEmail({
        // Alleen bcc kan niet zonder "aan"-veld: een adres dat nergens aankomt.
        to: `${opts.companySlug}@shiftje.nl`,
        bcc: emails,
        subject: `${title} (${opts.companyName})`,
        html: emailLayout(
          "Er is een open dienst",
          `
            <p>Er staat een open dienst bij ${escapeHtml(opts.companyName)}: <strong>${escapeHtml(
              describeShift(shift)
            )}</strong>.</p>
            <p style="margin-top: 12px;">Kun je en wil je 'm doen? Pak 'm zelf op in het rooster. Wie het eerst klikt, heeft 'm.</p>
            <p style="margin-top: 20px;">
              <a href="${url}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
                Bekijk het rooster
              </a>
            </p>
          `
        ),
      });
    }
  } catch (err) {
    console.error("[roster-change] open-dienst melding mislukt", err);
  }
}
