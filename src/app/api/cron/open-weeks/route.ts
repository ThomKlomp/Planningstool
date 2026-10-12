import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { getWeekDates, getISOWeekNumber } from "@/lib/week";
import { topUpAllRecurringShifts } from "@/lib/recurring-shifts";

// Bedoeld om 1x per dag aangeroepen te worden door een externe cron-dienst
// (bv. cron-job.org), met header: Authorization: Bearer <CRON_SECRET>.
// Idempotent: gebruikt WeekStatus.notifiedAt om te voorkomen dat dezelfde
// week twee keer gemaild wordt, ook als de cron vaker draait dan nodig.
// Aantal bcc-ontvangers per bericht.
const BCC_BATCH_SIZE = 40;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    include: { memberships: { include: { user: true } } },
  });

  const currentWeekStart = getWeekDates(new Date())[0];
  let notifiedCompanies = 0;
  const failed: { company: string; reason: string }[] = [];

  for (const company of companies) {
    if (company.autoOpenWeeks <= 0) continue;

    // De "nieuwste" week die nu binnen het automatisch-open-venster valt.
    const boundaryWeekStart = new Date(currentWeekStart);
    boundaryWeekStart.setDate(
      boundaryWeekStart.getDate() + (company.autoOpenWeeks - 1) * 7
    );

    const existing = await prisma.weekStatus.findUnique({
      where: {
        companyId_weekStart: { companyId: company.id, weekStart: boundaryWeekStart },
      },
    });

    // Al gemaild, of expliciet dichtgezet door de manager: overslaan.
    if (existing?.notifiedAt) continue;
    if (existing && !existing.isOpen) continue;

    // De zaak kan de openingsmail uitzetten (Instellingen); de week wordt
    // dan wel gewoon als gemeld gemarkeerd, zodat er geen mail volgt.
    const recipients = company.emailWeekOpenToEmployees
      ? company.memberships
          .map((m) => m.user.email)
          .filter((e): e is string => Boolean(e))
      : [];

    if (recipients.length > 0) {
      const subject = `Beschikbaarheid week ${getISOWeekNumber(boundaryWeekStart)} staat open bij ${company.name}`;
      const html = emailLayout(
        `Nieuwe week open bij ${company.name}`,
        `<p>Je kunt nu je beschikbaarheid doorgeven voor week ${getISOWeekNumber(
          boundaryWeekStart
        )} (${boundaryWeekStart.toLocaleDateString("nl-NL", {
          day: "numeric",
          month: "long",
        })}).</p>`
      );

      // In delen versturen: mailproviders accepteren maar een beperkt aantal
      // ontvangers per bericht (Resend: 50 in totaal), en één te grote zaak
      // mag niet alle mails voor die zaak laten mislukken.
      let sentBatches = 0;
      const problems: string[] = [];
      for (let i = 0; i < recipients.length; i += BCC_BATCH_SIZE) {
        try {
          const result = (await sendEmail({
            // Iedereen in bcc, niemand ziet andermans e-mailadres. Het
            // "aan"-veld is een nep-adres van de zaak zelf, dat nergens op
            // aankomt (zelfde patroon als bij de andere groepsmails).
            to: `${company.slug}@shiftje.nl`,
            bcc: recipients.slice(i, i + BCC_BATCH_SIZE),
            subject,
            html,
          })) as { skipped?: boolean; error?: { message?: string } | null };
          if (result?.skipped) problems.push("RESEND_API_KEY ontbreekt");
          else if (result?.error) problems.push(result.error.message ?? "onbekende fout van de mailservice");
          else sentBatches += 1;
        } catch (err) {
          problems.push(err instanceof Error ? err.message : "versturen mislukt");
        }
      }

      // Is er niets verstuurd, dan de week NIET als gemeld markeren: de volgende
      // run probeert het opnieuw, en de fout staat in de log en in het antwoord.
      if (sentBatches === 0) {
        console.error(`[cron/open-weeks] geen mail verstuurd voor ${company.name}: ${problems.join("; ")}`);
        failed.push({ company: company.name, reason: problems.join("; ") });
        continue;
      }
      if (problems.length > 0) {
        console.error(`[cron/open-weeks] deels mislukt voor ${company.name}: ${problems.join("; ")}`);
        failed.push({ company: company.name, reason: `deels: ${problems.join("; ")}` });
      }
    }

    await prisma.weekStatus.upsert({
      where: {
        companyId_weekStart: { companyId: company.id, weekStart: boundaryWeekStart },
      },
      update: { notifiedAt: new Date(), isOpen: true },
      create: {
        companyId: company.id,
        weekStart: boundaryWeekStart,
        isOpen: true,
        notifiedAt: new Date(),
      },
    });

    notifiedCompanies += 1;
  }

  // Terugkerende diensten: elke dag bijvullen tot 8 weken vooruit. Zit hier
  // in zodat er geen extra cron-taak ingesteld hoeft te worden. Mag de rest
  // niet blokkeren als het misgaat.
  let recurring: { patterns: number; created: number } | null = null;
  try {
    recurring = await topUpAllRecurringShifts();
  } catch (err) {
    console.error("[cron/open-weeks] terugkerende diensten bijvullen mislukt", err);
  }

  // Bij een mislukte mail een foutstatus teruggeven, zodat de cron-dienst
  // (bv. cron-job.org) dat meldt in plaats van het als gelukt te zien.
  return NextResponse.json(
    { ok: failed.length === 0, notifiedCompanies, failed, recurring },
    { status: failed.length === 0 ? 200 : 500 }
  );
}
