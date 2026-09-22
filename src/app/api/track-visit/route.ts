import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Legt één paginabezoek vast: welk pad, waar de bezoeker vandaan kwam
 * (referrer-hostname of UTM-parameters) en, als de bezoeker is ingelogd, bij
 * welke zaak en met welke rol. Geen cookie, geen IP-adres: elke aanroep is
 * een los, anoniem event tenzij er toevallig al een sessie is. Faalt
 * geruisloos (een trackingfout mag de pagina van de bezoeker nooit breken).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body?.path === "string" ? body.path.slice(0, 300) : null;
    if (!path) return NextResponse.json({ ok: false }, { status: 400 });

    // Alleen de hostname van de referrer bewaren (niet de volledige URL: die
    // kan zelf al persoonsgegevens of zoektermen bevatten).
    let referrer: string | null = null;
    if (typeof body?.referrer === "string" && body.referrer) {
      try {
        referrer = new URL(body.referrer).hostname || null;
      } catch {
        referrer = null;
      }
    }

    const session = await getServerSession(authOptions).catch(() => null);
    const membership = session?.user?.memberships?.[0];

    await prisma.pageView.create({
      data: {
        path,
        referrer,
        utmSource: typeof body?.utmSource === "string" ? body.utmSource.slice(0, 100) : null,
        utmMedium: typeof body?.utmMedium === "string" ? body.utmMedium.slice(0, 100) : null,
        utmCampaign: typeof body?.utmCampaign === "string" ? body.utmCampaign.slice(0, 100) : null,
        companyId: membership?.companyId,
        companyName: membership?.companyName,
        role: membership?.role,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track-visit] loggen mislukt", err);
    return NextResponse.json({ ok: false });
  }
}
