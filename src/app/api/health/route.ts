import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Simpel endpoint dat de database aanraakt. Bedoeld om door een uptime-
// monitor (bv. UptimeRobot) elke paar minuten aangeroepen te worden, zodat
// de Neon-database niet steeds in slaap valt na 5 minuten inactiviteit.
export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}
