import { sendEmail, emailLayout } from "@/lib/email";
import { getWeekDates, getISOWeekNumber } from "@/lib/week";

// Aantal bcc-ontvangers per bericht. Mailproviders accepteren maar een beperkt
// aantal ontvangers per bericht (Resend: 50 in totaal).
export const BCC_BATCH_SIZE = 40;

// Resend staat standaard 2 verzoeken per seconde toe. Verstuur dus rustig, ook
// over meerdere zaken heen, en probeer het bij een "te snel"-melding opnieuw.
const MIN_GAP_MS = 600;
const RETRY_WAIT_MS = 1200;
const MAX_RETRIES = 2;

let lastSendAt = 0;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function throttle() {
  const wait = lastSendAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastSendAt = Date.now();
}

type SendResult = { skipped?: boolean; error?: { name?: string; message?: string; statusCode?: number | null } | null };

/** Eén bericht versturen; geeft null bij succes, anders de reden. */
export async function sendOne(args: Parameters<typeof sendEmail>[0]): Promise<string | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await throttle();
    let result: SendResult;
    try {
      result = (await sendEmail(args)) as SendResult;
    } catch (err) {
      return err instanceof Error ? err.message : "versturen mislukt";
    }
    if (result?.skipped) return "RESEND_API_KEY ontbreekt";
    if (!result?.error) return null;
    const rateLimited =
      result.error.statusCode === 429 || result.error.name === "rate_limit_exceeded";
    if (rateLimited && attempt < MAX_RETRIES) {
      await sleep(RETRY_WAIT_MS);
      continue;
    }
    return result.error.message ?? "onbekende fout van de mailservice";
  }
  return "onbekende fout";
}

/** De week die nu als nieuwste openstaat voor beschikbaarheid (afhankelijk van "automatisch openen"). */
export function boundaryWeekFor(autoOpenWeeks: number): Date {
  const week = new Date(getWeekDates(new Date())[0]);
  week.setDate(week.getDate() + (autoOpenWeeks - 1) * 7);
  return week;
}

/**
 * Mailt alle leden van een zaak dat een week openstaat voor beschikbaarheid.
 * Verstuurt in delen en rustig; geeft terug hoeveel berichten zijn aangekomen
 * bij de mailservice en welke problemen er waren.
 */
export async function sendOpenWeekMail(
  company: { name: string; slug: string; memberships: { user: { email: string | null } }[] },
  weekStart: Date
): Promise<{ sent: number; problems: string[] }> {
  const recipients = company.memberships
    .map((m) => m.user.email)
    .filter((e): e is string => Boolean(e));
  if (recipients.length === 0) return { sent: 0, problems: [] };

  const weekNumber = getISOWeekNumber(weekStart);
  const subject = `Beschikbaarheid week ${weekNumber} staat open bij ${company.name}`;
  const html = emailLayout(
    `Nieuwe week open bij ${company.name}`,
    `<p>Je kunt nu je beschikbaarheid doorgeven voor week ${weekNumber} (${weekStart.toLocaleDateString(
      "nl-NL",
      { day: "numeric", month: "long" }
    )}).</p>`
  );

  let sent = 0;
  const problems: string[] = [];
  for (let i = 0; i < recipients.length; i += BCC_BATCH_SIZE) {
    const problem = await sendOne({
      // Iedereen in bcc, niemand ziet andermans e-mailadres. Het "aan"-veld is
      // een nep-adres van de zaak zelf, dat nergens op aankomt.
      to: `${company.slug}@shiftje.nl`,
      bcc: recipients.slice(i, i + BCC_BATCH_SIZE),
      subject,
      html,
    });
    if (problem) problems.push(problem);
    else sent += 1;
  }
  return { sent, problems };
}

/**
 * Mailt een lijst ontvangers in bcc, in delen en rustig (zie sendOne).
 * Geeft terug hoeveel berichten zijn aangekomen en welke problemen er waren.
 */
export async function sendBccInBatches(opts: {
  to: string;
  recipients: string[];
  subject: string;
  html: string;
}): Promise<{ sent: number; problems: string[] }> {
  let sent = 0;
  const problems: string[] = [];
  for (let i = 0; i < opts.recipients.length; i += BCC_BATCH_SIZE) {
    const problem = await sendOne({
      to: opts.to,
      bcc: opts.recipients.slice(i, i + BCC_BATCH_SIZE),
      subject: opts.subject,
      html: opts.html,
    });
    if (problem) problems.push(problem);
    else sent += 1;
  }
  return { sent, problems };
}
