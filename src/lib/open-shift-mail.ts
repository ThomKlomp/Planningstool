import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { emailLayout } from "@/lib/email";
import { getWeekDates, toDateParam } from "@/lib/week";
import { isRosterPublished, weekStartOf } from "@/lib/roster-publish";
import { sendBccInBatches } from "@/lib/open-week-mail";
import { shiftDateLabel } from "@/lib/roster-change";

// Wie krijgt een mail als er een open dienst is, en waarom (of waarom niet)?
//
// - Alleen als het rooster van die week gepubliceerd is (of "altijd gepubliceerd" aanstaat)
//   en de dienst nog moet komen.
// - Ontvangers zijn de leden van het team van de dienst (hoofd- of extra team; zonder team:
//   iedereen), niet de persoon die de dienst zelf aanmaakt. Managers/eigenaren alleen als de zaak
//   dat heeft aangezet.
// - Wie die dag al een soortgelijke dienst heeft (overlap, of dezelfde standaardshift) krijgt
//   geen mail; wie bijvoorbeeld 12-17 werkt mag wel een mail voor een avonddienst krijgen.
// - Binnen 7 dagen: iedereen in het team (wat de beschikbaarheid ook is). Verder weg: alleen wie
//   beschikbaar is of "weet ik nog niet" heeft ingevuld voor die tijden. Is er niemand: dan
//   iedereen in het team, met de vraag of ze toch kunnen.

export const SOON_DAYS = 7;

type ShiftInput = {
  id?: string;
  date: Date;
  startTime: string;
  endTime: string;
  role: string | null;
  departmentId: string | null;
};

export type PlannedPerson = {
  membershipId: string;
  name: string;
  email: string | null;
  reason: string;
};

export type OpenShiftPlan =
  | { eligible: false; reason: string }
  | {
      eligible: true;
      /** SOON = binnen 7 dagen, AVAILABLE = alleen beschikbaren, NOBODY_AVAILABLE = niemand stond beschikbaar. */
      mode: "SOON" | "AVAILABLE" | "NOBODY_AVAILABLE";
      daysAhead: number;
      nobodyAvailable: boolean;
      recipients: PlannedPerson[];
      skipped: PlannedPerson[];
    };

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** [begin, eind] in minuten; een dienst die na middernacht eindigt loopt door tot na 24:00. */
function windowOf(start: string, end: string): [number, number] {
  const s = toMin(start);
  let e = toMin(end);
  if (e <= s) e += 24 * 60;
  return [s, e];
}

function overlapMinutes(a: [number, number], b: [number, number]) {
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
}

type Template = { id: string; name: string; startTime: string; endTime: string; weekdays: number[] };

// Als er geen standaardshifts zijn ingesteld: ochtend/middag/avond.
const FALLBACK_PARTS: { id: string; name: string; win: [number, number] }[] = [
  { id: "part:ochtend", name: "ochtend", win: [0, 12 * 60] },
  { id: "part:middag", name: "middag", win: [12 * 60, 17 * 60] },
  { id: "part:avond", name: "avond", win: [17 * 60, 48 * 60] },
];

/** Bij welke standaardshift hoort een dienst het best (grootste overlap)? */
function standardTypeOf(win: [number, number], templates: Template[]): { id: string; name: string } | null {
  const candidates = templates.length
    ? templates.map((t) => ({ id: t.id, name: t.name, win: windowOf(t.startTime, t.endTime) }))
    : FALLBACK_PARTS;
  let best: { id: string; name: string } | null = null;
  let bestOverlap = 0;
  for (const c of candidates) {
    const o = overlapMinutes(win, c.win);
    if (o > bestOverlap) {
      bestOverlap = o;
      best = { id: c.id, name: c.name };
    }
  }
  return best;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Berekent wie er gemaild wordt (of niet) voor een open dienst, zonder iets te versturen. */
export async function planOpenShiftMail(opts: {
  companyId: string;
  shift: ShiftInput;
  actorMembershipId: string;
  /** Ook managers/eigenaren van het team mailen (kiest de manager per keer). */
  includeManagers?: boolean;
}): Promise<OpenShiftPlan> {
  const { shift } = opts;
  const today = startOfDay(new Date());
  const shiftDay = startOfDay(shift.date);
  if (shiftDay < today) return { eligible: false, reason: "De dienst ligt in het verleden." };
  if (!(await isRosterPublished(opts.companyId, weekStartOf(shift.date)))) {
    return { eligible: false, reason: "Het rooster van die week is nog concept, dus er wordt niemand gemaild." };
  }

  const daysAhead = Math.round((shiftDay.getTime() - today.getTime()) / 86400000);
  const shiftWin = windowOf(shift.startTime, shift.endTime);
  const weekday = shift.date.getDay();

  const includeManagers = opts.includeManagers ?? false;

  const [members, allTemplates, slots] = await Promise.all([
    prisma.membership.findMany({
      where: {
        companyId: opts.companyId,
        id: { not: opts.actorMembershipId },
        role: includeManagers ? { in: ["OWNER", "MANAGER", "EMPLOYEE"] } : "EMPLOYEE",
      },
      include: { user: { select: { name: true, email: true } }, extraDepartments: true },
    }),
    prisma.shiftTemplate.findMany({ where: { companyId: opts.companyId } }),
    prisma.availabilitySlot.findMany({ where: { companyId: opts.companyId, date: shift.date } }),
  ]);

  const templates = allTemplates.filter((t) => t.weekdays.length === 0 || t.weekdays.includes(weekday));

  // Team van de dienst: hoofd- of extra team. Managers (indien aangezet) horen er altijd bij.
  const candidates = members.filter((m) => {
    if (m.role !== "EMPLOYEE") return true;
    if (!shift.departmentId) return true;
    return (
      m.departmentId === shift.departmentId ||
      m.extraDepartments.some((e) => e.departmentId === shift.departmentId)
    );
  });
  if (candidates.length === 0) return { eligible: true, mode: "SOON", daysAhead, nobodyAvailable: true, recipients: [], skipped: [] };

  const ids = candidates.map((m) => m.id);
  const [otherShifts, availabilities] = await Promise.all([
    prisma.shift.findMany({
      where: { companyId: opts.companyId, date: shift.date, membershipId: { in: ids }, NOT: shift.id ? { id: shift.id } : undefined },
    }),
    prisma.availability.findMany({ where: { date: shift.date, membershipId: { in: ids } } }),
  ]);

  const nameOf = (m: (typeof candidates)[number]) => m.user.name ?? m.user.email ?? "Onbekend";
  const person = (m: (typeof candidates)[number], reason: string): PlannedPerson => ({
    membershipId: m.id,
    name: nameOf(m),
    email: m.user.email,
    reason,
  });

  const shiftType = standardTypeOf(shiftWin, templates);
  const skipped: PlannedPerson[] = [];
  const remaining: { m: (typeof candidates)[number]; note: string }[] = [];

  for (const m of candidates) {
    const mine = otherShifts.filter((s) => s.membershipId === m.id);
    let exclusion: string | null = null;
    let harmless: string | null = null;
    for (const s of mine) {
      const win = windowOf(s.startTime, s.endTime);
      const label = `${s.startTime}–${s.endTime}`;
      if (overlapMinutes(win, shiftWin) > 0) {
        exclusion = `werkt ${label}, overlapt met deze dienst`;
        break;
      }
      const type = standardTypeOf(win, templates);
      if (type && shiftType && type.id === shiftType.id) {
        exclusion = `werkt al ${label} (${type.name.toLowerCase()})`;
        break;
      }
      harmless = `werkt ${label}${type ? ` (${type.name.toLowerCase()})` : ""}, geen overlap`;
    }
    if (exclusion) skipped.push(person(m, exclusion));
    else remaining.push({ m, note: harmless ?? "staat die dag niet ingeroosterd" });
  }

  // Beschikbaarheid voor de tijden van deze dienst.
  const entryWindow = (daypart: string): { win: [number, number]; label: string } => {
    if (!daypart) return { win: [0, 48 * 60], label: "hele dag" };
    if (daypart.startsWith("slot:")) {
      const slot = slots.find((s) => `slot:${s.id}` === daypart);
      if (slot) return { win: windowOf(slot.startTime, slot.endTime), label: slot.title ?? `${slot.startTime}–${slot.endTime}` };
    } else {
      const t = allTemplates.find((x) => x.id === daypart);
      if (t) return { win: windowOf(t.startTime, t.endTime), label: t.name.toLowerCase() };
    }
    return { win: [0, 48 * 60], label: "hele dag" };
  };
  const availabilityOf = (membershipId: string) => {
    const entries = availabilities.filter((a) => a.membershipId === membershipId);
    let positive: string | null = null;
    let hasUnavailable = false;
    for (const e of entries) {
      const { win, label } = entryWindow(e.daypart);
      if (overlapMinutes(win, shiftWin) === 0) continue;
      if (e.status === "UNAVAILABLE") hasUnavailable = true;
      else if (!positive) positive = `${e.status === "AVAILABLE" ? "beschikbaar" : "weet nog niet"}, ${label}`;
    }
    const why = positive
      ? null
      : hasUnavailable
      ? "niet beschikbaar"
      : entries.length > 0
      ? "heeft alleen andere tijden doorgegeven"
      : "nog niets ingevuld";
    return { positive, why };
  };

  const availability = new Map(remaining.map(({ m }) => [m.id, availabilityOf(m.id)]));
  const available = remaining.filter(({ m }) => availability.get(m.id)!.positive);
  const nobodyAvailable = available.length === 0;

  if (daysAhead <= SOON_DAYS) {
    // Binnen 7 dagen: iedereen in het team, ongeacht beschikbaarheid.
    const recipients = remaining.map(({ m, note }) => person(m, `binnen ${SOON_DAYS} dagen, ${note}`));
    return { eligible: true, mode: "SOON", daysAhead, nobodyAvailable, recipients, skipped };
  }

  if (!nobodyAvailable) {
    const recipients = available.map(({ m }) => person(m, availability.get(m.id)!.positive!));
    for (const { m } of remaining) {
      if (!availability.get(m.id)!.positive) skipped.push(person(m, availability.get(m.id)!.why!));
    }
    return { eligible: true, mode: "AVAILABLE", daysAhead, nobodyAvailable: false, recipients, skipped };
  }

  const recipients = remaining.map(({ m }) => person(m, "niemand in het team stond beschikbaar"));
  return { eligible: true, mode: "NOBODY_AVAILABLE", daysAhead, nobodyAvailable: true, recipients, skipped };
}

export type OpenShiftMailSummary = {
  eligible: boolean;
  reason?: string;
  mode?: "SOON" | "AVAILABLE" | "NOBODY_AVAILABLE";
  daysAhead?: number;
  nobodyAvailable?: boolean;
  recipients: { name: string; reason: string }[];
  skipped: { name: string; reason: string }[];
  /** Aantal e-mailadressen waarnaar echt een mail is verstuurd (alleen na versturen). */
  mailedCount?: number;
  problems?: string[];
};

/** Plan zonder e-mailadressen en id's, voor de browser. */
export function toSummary(plan: OpenShiftPlan): OpenShiftMailSummary {
  if (!plan.eligible) return { eligible: false, reason: plan.reason, recipients: [], skipped: [] };
  return {
    eligible: true,
    mode: plan.mode,
    daysAhead: plan.daysAhead,
    nobodyAvailable: plan.nobodyAvailable,
    recipients: plan.recipients.map(({ name, reason }) => ({ name, reason })),
    skipped: plan.skipped.map(({ name, reason }) => ({ name, reason })),
  };
}

function daysLabel(days: number) {
  return days <= 0 ? "vandaag" : days === 1 ? "morgen" : `over ${days} dagen`;
}

function escapeHtml(input: string) {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Verstuurt de open-dienst-mail (en de melding in de app) volgens het plan.
 * Faalt nooit: een mislukte mail mag het aanmaken van de dienst niet blokkeren.
 */
export async function sendOpenShiftMail(opts: {
  companyId: string;
  companyName: string;
  companySlug: string;
  actorMembershipId: string;
  shift: ShiftInput;
  includeManagers?: boolean;
}): Promise<OpenShiftMailSummary> {
  try {
    const plan = await planOpenShiftMail(opts);
    const summary = toSummary(plan);
    if (!plan.eligible || plan.recipients.length === 0) return { ...summary, mailedCount: 0, problems: [] };

    const { shift } = opts;
    const link = `/dashboard/rooster?week=${toDateParam(getWeekDates(shift.date)[0])}`;
    const url = `${process.env.NEXTAUTH_URL ?? ""}${link}`;
    const title = `Open dienst op ${shiftDateLabel(shift.date)}`;
    const where = `${shift.startTime}–${shift.endTime}${shift.role ? ` · ${shift.role}` : ""}`;

    await notify(opts.companyId, plan.recipients.map((r) => r.membershipId), {
      title,
      body: `${where}. Wie pakt 'm op?`,
      link,
    });

    const emails = plan.recipients.map((r) => r.email).filter((e): e is string => Boolean(e));
    let problems: string[] = [];
    if (emails.length > 0) {
      const banner = plan.nobodyAvailable
        ? `<div style="margin-top: 12px; padding: 10px 12px; border-left: 4px solid #C9821F; background: #FDF3E1;"><strong>Niemand in het team staat beschikbaar.</strong> Kun jij toch? Geef het nu aan door de dienst op te pakken in het rooster.</div>`
        : "";
      const soon =
        plan.daysAhead <= SOON_DAYS
          ? `<p style="margin-top: 12px;">De dienst is al ${daysLabel(plan.daysAhead)}, daarom vragen we iedereen in het team.</p>`
          : "";
      const html = emailLayout(
        "Er is een open dienst",
        `
          <p>Er staat een open dienst bij ${escapeHtml(opts.companyName)}: <strong>${escapeHtml(
            `${shiftDateLabel(shift.date)}, ${where}`
          )}</strong>.</p>
          ${soon}
          ${banner}
          <p style="margin-top: 12px;">Kun je en wil je 'm doen? Pak 'm zelf op in het rooster. Wie het eerst klikt, heeft 'm.</p>
          <p style="margin-top: 20px;">
            <a href="${url}" style="display: inline-block; background: #1B1B18; color: #FAF7F2; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 500;">
              Bekijk het rooster
            </a>
          </p>
        `
      );
      const result = await sendBccInBatches({
        // Alleen bcc kan niet zonder "aan"-veld: een adres dat nergens aankomt.
        to: `${opts.companySlug}@shiftje.nl`,
        recipients: emails,
        subject: `${title} (${opts.companyName})`,
        html,
      });
      problems = result.problems;
      if (problems.length > 0) {
        console.error(`[open-dienst] mail mislukt voor ${opts.companyName}: ${problems.join("; ")}`);
      }
      return { ...summary, mailedCount: result.sent > 0 ? emails.length : 0, problems };
    }
    return { ...summary, mailedCount: 0, problems };
  } catch (err) {
    console.error("[open-dienst] melding mislukt", err);
    return { eligible: true, recipients: [], skipped: [], mailedCount: 0, problems: ["onbekende fout"] };
  }
}
