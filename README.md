# Shiftje — update: agenda-koppeling + staffelprijzen

Deze map bevat alle nieuwe en gewijzigde bestanden voor twee features,
gebouwd op je bestaande architectuur (Next.js App Router, Prisma,
PostgreSQL, Mollie, NextAuth Google). Kopieer de bestanden naar dezelfde
paden in `ThomKlomp/Planningstool` en volg onderstaande stappen.

---

## 1. Database-schema bijwerken

Open `prisma/schema-additions.prisma` in deze map — dat is **geen bestand
dat je erbij zet**, maar een uitleg van de 3 wijzigingen die je handmatig in
je bestaande `prisma/schema.prisma` doorvoert:

1. Nieuw model `Coupon` (+ enum `CouponType`)
2. Vier nieuwe velden op `Company` (kortingscode-koppeling + laatst-gefactureerde staffel/bedrag)
3. Eén nieuw veld op `Membership` (`calendarToken`)

Daarna:

```bash
npx prisma db push
```

---

## 2. Bestanden kopiëren

**Nieuwe bestanden** (gewoon toevoegen):

```
src/lib/ics.ts
src/app/api/calendar/[token]/route.ts
src/app/api/calendar/token/route.ts
src/app/api/billing/coupon/route.ts
src/app/api/cron/billing-resync/route.ts
src/app/dashboard/calendar/page.tsx
src/app/dashboard/calendar/calendar-sync-card.tsx
src/app/dashboard/settings/billing/coupon-form.tsx
```

**Bestaande bestanden om te vervangen** (volledig herschreven, zelfde
conventies als het origineel):

```
src/lib/billing.ts              — was vaste prijs, nu staffelprijzen + coupon-logica
src/lib/mollie.ts               — subscriptions.update() toegevoegd
src/app/api/billing/subscribe/route.ts   — gebruikt nu de staffelprijs
src/app/api/webhooks/mollie/route.ts     — gebruikt nu de staffelprijs, telt coupon-termijnen af
src/app/dashboard/settings/billing/page.tsx  — toont staffeltabel + kortingscode
```

---

## 3. Kleine handmatige aanpassingen (bestanden die ik niet volledig kon zien)

**Navigatie** — voeg ergens in je dashboard-navigatie (waarschijnlijk
`src/app/dashboard/layout.tsx`) een link toe naar `/dashboard/calendar`,
zodat medewerkers 'm kunnen vinden. Zelfde patroon als je andere
nav-links.

**Waarschuwing bij uitnodigen** (optioneel maar aanbevolen) — in de route
die een `Invite` aanmaakt (`src/app/api/invites/route.ts` of vergelijkbaar)
kun je vóór het aanmaken van de uitnodiging het volgende aanroepen:

```ts
import { getNextMemberTierWarning } from "@/lib/billing";

const tierWarning = await getNextMemberTierWarning(membership.companyId);
// geef dit terug in de response, bv. { invite, tierWarning }
// en toon in de UI: "Met deze medewerker ga je naar staffel {toLabel}, €{newMonthlyExcl}/maand."
```

Dit is puur een waarschuwing vooraf — de daadwerkelijke afrekening gebeurt
altijd via de cron (zie hieronder), dus een medewerker die deze melding
negeert kan niets "omzeilen".

---

## 4. Cron-job toevoegen

Je hebt al `cron-job.org` voor `/api/cron/open-weeks`. Voeg daar een tweede
taak aan toe:

- **URL:** `https://<jouw-domein>/api/cron/billing-resync`
- **Header:** `Authorization: Bearer <CRON_SECRET>` (dezelfde secret als de bestaande cron)
- **Interval:** 1x per dag (tijdstip maakt niet uit — zie uitleg in het bestand)

Geen nieuwe environment variables nodig — alles hergebruikt bestaande
env vars (`CRON_SECRET`, `MOLLIE_API_KEY`, `NEXTAUTH_URL`).

---

## 5. Hoe het samen werkt

**Agenda-koppeling:** elke medewerker krijgt op `/dashboard/calendar` een
unieke, geheime abonnementslink. Die link geeft een live `.ics`-feed van
hun shifts terug; Google Agenda en Apple Agenda halen 'm zelf periodiek
opnieuw op (reken op een paar uur vertraging, geen instant push). Geen
OAuth, geen Google-verificatietraject nodig.

**Staffelprijzen:** de prijs wordt **niet** live bijgewerkt zodra iemand
wordt toegevoegd of verwijderd — dat gebeurt bewust pas bij de
eerstvolgende afrekening, via de dagelijkse cron. Die cron:

1. Telt per actieve zaak het huidige aantal medewerkers.
2. Bepaalt de bijbehorende staffel + verrekent een eventuele kortingscode.
3. Vergelijkt dat met het laatst doorgevoerde bedrag (`lastBilledAmountExcl`).
4. Stuurt bij een verschil een `PATCH` naar Mollie — dat geldt voor de
   eerstvolgende betaling, nooit met terugwerkende kracht.

Dit voorkomt tussentijdse deelbetalingen en is de "bron van waarheid":
zelfs als iemand tijdelijk veel medewerkers toevoegt en ze voor de
volgende afrekening weer verwijdert, telt gewoon het aantal op het moment
dat de cron draait.

**Kortingscodes:** eigen tabel (`Coupon`), los van Mollie. Een code is
percentage- of vast-bedrag-korting, met optioneel een looptijd in aantal
termijnen (`durationMonths`) en/of een maximum aantal keer te gebruiken.
Toegepast via `/dashboard/settings/billing` (`CouponForm`) of programmatisch
via `POST /api/billing/coupon`. Zelf codes aanmaken kan vooralsnog alleen
rechtstreeks in de database (`prisma studio` of een script) — er is geen
admin-UI voor gebouwd; zeg het als je die ook wilt.

---

## 6. Testen

1. `npx prisma db push` lokaal, dan `npm run dev`.
2. Log in, ga naar `/dashboard/calendar`, maak een agenda-link aan, open
   de `.ics`-URL direct in de browser om te checken dat er geldige
   iCalendar-inhoud terugkomt.
3. Maak in Mollie test mode een coupon aan in je database (via Prisma
   Studio: `npx prisma studio`) en test `/dashboard/settings/billing`.
4. Roep `/api/cron/billing-resync` handmatig aan met de juiste
   Authorization-header (bv. met `curl`) om de sync-logica te testen
   zonder op de dagelijkse cron te wachten.
