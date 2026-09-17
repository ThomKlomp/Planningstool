# Shiftje — fix: staffelprijzen + agenda-koppeling samengevoegd met je bestaande kortingscodesysteem

## Wat er mis was

Ik kon je repo nu inzien (raw.githubusercontent.com, nu hij publiek staat) en
zag dat er al een **eigen, volwaardig kortingscodesysteem** in zat —
`DiscountCode` / `CompanyDiscount`, admin-beheer op `/admin/discount-codes`,
een eigen cron voor verlopen kortingen — van vóór dit gesprek. De zip die ik
eerder gaf botste daarmee: die verwees naar velden die niet bestaan
(`Company.appliedCouponId`) en de bestaande discount-expiry-cron gebruikte
prijsconstanten die ik had verwijderd. Kortom: zoals het er nu bij staat
zou de build breken.

Dit pakket lost dat op door mijn staffelprijzen-logica **in** je bestaande
kortingscodesysteem te verwerken, in plaats van er een tweede naast te
zetten.

---

## 1. Bestanden overschrijven (compleet, direct te uploaden)

```
prisma/schema.prisma                              — je eigen bestand + 3 nieuwe velden (zie hieronder)
src/lib/billing.ts                                 — staffelprijzen, rekent nu met jouw CompanyDiscount
src/app/api/billing/subscribe/route.ts              — gebruikt de staffelprijs
src/app/api/webhooks/mollie/route.ts                — gebruikt de staffelprijs
src/app/api/cron/billing-resync/route.ts            — combineert staffel-sync mét korting-verloop (zie punt 3)
src/app/dashboard/settings/billing/page.tsx          — staffeltabel + je bestaande DiscountCodeForm
src/app/dashboard/layout.tsx                        — jouw huidige layout + 1 nav-link naar Agenda-koppeling
src/app/api/invites/route.ts                        — jouw huidige route + staffel-waarschuwing
src/app/dashboard/invite-form.tsx                   — jouw huidige form + die waarschuwing zichtbaar
```

`prisma/schema.prisma` is nu je **eigen, volledige** bestand met alleen deze
3 regels toegevoegd (verder niets gewijzigd — ik heb het gediffed om dat te
garanderen):
- `Membership.calendarToken` (voor de agenda-feature)
- `Company.currentTierId` en `Company.lastBilledAmountIncl` (voor de staffel-sync)

Er is dus geen apart `Coupon`-model meer nodig — dat gebruikte ik in de
vorige versie, maar dat was overbodig naast je bestaande `DiscountCode`/
`CompanyDiscount`.

Daarna: `npx prisma db push`.

---

## 2. Bestanden verwijderen uit je repo

Deze zijn overbodig geworden of botsten met je bestaande systeem:

```
src/app/api/billing/coupon/route.ts              — vervangen door je bestaande /api/billing/redeem-discount
src/app/dashboard/settings/billing/coupon-form.tsx — vervangen door je bestaande discount-code-form.tsx
src/app/api/cron/discount-expiry/route.ts         — samengevoegd in cron/billing-resync (zie punt 3)
prisma/schema-additions.prisma                    — was alleen een instructiebestand, niet meer nodig
```

---

## 3. Eén cron in plaats van twee

Je had al een cron voor verlopen kortingen (`cron/discount-expiry`) en ik
voegde er een tweede aan toe voor de staffelprijs (`cron/billing-resync`).
Die twee zouden elkaar tegen kunnen werken (allebei het Mollie-bedrag
proberen bij te werken op basis van een net wel/niet verlopen korting).

`cron/billing-resync` doet nu **beide** taken in één keer per zaak: eerst
checken of een aftellende korting op is (zo ja: verwijderen + eigenaar
mailen, exact zoals je oude discount-expiry-cron deed), dán pas de juiste
staffelprijs + eventuele resterende korting berekenen en bij Mollie
bijwerken als dat is veranderd.

**Actie:** als je bij cron-job.org al een taak had voor
`/api/cron/discount-expiry`, verwijder die. Je hebt er nog maar één nodig:

- **URL:** `https://<jouw-domein>/api/cron/billing-resync`
- **Header:** `Authorization: Bearer <CRON_SECRET>`
- **Interval:** 1x per dag
- **Methode:** GET

Ik heb hier geen toegang toe (geen cron-job.org-koppeling beschikbaar) — dit
moet je zelf 2 minuten instellen. Alternatief: je hebt Render als host, en
daar is wél een koppeling voor beschikbaar waarmee ik dit voor je zou kunnen
aanmaken als je die aanzet.

---

## 4. Wat ongewijzigd blijft (geen actie nodig)

Deze bestanden uit de vorige zip kloppen nog gewoon en staan al goed in je
repo:
```
src/lib/ics.ts
src/lib/mollie.ts
src/app/api/calendar/[token]/route.ts
src/app/api/calendar/token/route.ts
src/app/dashboard/calendar/page.tsx
src/app/dashboard/calendar/calendar-sync-card.tsx
```
De admin-kant van kortingscodes (`/admin/discount-codes` en de bijbehorende
API) is niet aangeraakt — die werkte al goed en heeft niets met staffels te
maken.

---

## 5. Testen

1. `npx prisma db push`, dan `npm run dev`.
2. `/dashboard/settings/billing` → check dat de staffeltabel klopt en dat
   een eventuele actieve korting nog steeds correct getoond wordt via
   `describeDiscount()`.
3. Wissel een testcode in via de bestaande flow (Instellingen → Facturering
   → kortingscode) en controleer dat `computeSubscriptionAmount` 'm
   meerekent.
4. Roep `/api/cron/billing-resync` handmatig aan met de juiste
   Authorization-header om zowel de staffel-sync als het verlopen van een
   (test-)korting te controleren.
