import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { boundaryWeekFor, sendOpenWeekMail } from "@/lib/open-week-mail";
import { topUpAllRecurringShifts } from "@/lib/recurring-shifts";

// Bedoeld om 1x per dag aangeroepen te worden door een externe cron-dienst
// (bv. cron-job.org), met header: Authorization: Bearer <CRON_SECRET>.
// Idempotent: gebruikt WeekStatus.notifiedAt om te voorkomen dat dezelfde
// week twee keer gemaild wordt, ook als de cron vaker draait dan nodig.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({
    include: { memberships: { include: { user: true } } },
  });

  let notifiedCompanies = 0;
  const failed: { company: string; reason: string }[] = [];

  // Elke zaak apart: een fout bij één zaak mag de rest niet laten mislukken.
  for (const company of companies) {
    try {
      if (company.autoOpenWeeks <= 0) continue;

      // De "nieuwste" week die nu binnen het automatisch-open-venster valt.
      const boundaryWeekStart = boundaryWeekFor(company.autoOpenWeeks);

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
      if (company.emailWeekOpenToEmployees) {
        const { sent, problems } = await sendOpenWeekMail(company, boundaryWeekStart);
        const hasRecipients = company.memberships.some((m) => m.user.email);

        // Is er niets verstuurd, dan de week NIET als gemeld markeren: de volgende
        // run probeert het opnieuw, en de fout staat in de log en in het antwoord.
        if (hasRecipients && sent === 0) {
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
    } catch (err) {
      console.error(`[cron/open-weeks] fout bij ${company.name}`, err);
      failed.push({ company: company.name, reason: err instanceof Error ? err.message : "onbekende fout" });
    }
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
