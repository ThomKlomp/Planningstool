# Shiftje — planningstool voor kleine horeca

Starter-project: beschikbaarheid ("datumprikker"), een rooster-tool die
beschikbaarheid direct toont, bedrijfsomgevingen (multi-tenant) met een
intern adminportaal, medewerkers uitnodigen met Google-login, en
urenregistratie met goedkeuring door de manager.

**Stack:** Next.js (App Router) · TypeScript · Prisma · PostgreSQL ·
NextAuth (Google) · Tailwind CSS. Gebouwd om zonder gedoe op GitHub +
Render te draaien.

## Hoe alles in elkaar zit

- **Company** = een zaak/tenant. Elke gebruiker hoort via een `Membership`
  bij een company, met een rol: `OWNER`, `MANAGER` of `EMPLOYEE`.
- **PlatformAdmin** is jou: los van een company, geeft toegang tot `/admin`.
- **Availability** = de datumprikker: per medewerker, per dag, een status.
- **Shift** = een roosterregel, gekoppeld aan een company en (optioneel) een
  membership.
- **Invite** = uitnodiging per e-mail; bij het volgen van de link + inloggen
  met Google wordt automatisch een `Membership` aangemaakt.
- **TimeEntry** = ingevulde uren van een medewerker, met status
  `SUBMITTED` / `APPROVED` / `REJECTED`.

Zie `prisma/schema.prisma` voor het volledige datamodel — dat is het beste
startpunt om de app te begrijpen.

## 1. Lokaal draaien

### Vereisten
- Node.js 18+
- Een PostgreSQL-database (lokaal via Docker, of gratis via Render/Neon/Supabase)

### Stappen

```bash
npm install
cp .env.example .env
```

Vul `.env` in:
- `DATABASE_URL` — je Postgres-connectiestring
- `NEXTAUTH_SECRET` — genereer met `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — zie stap 2 hieronder

Database-schema uitrollen:

```bash
npm run db:push
```

Development-server starten:

```bash
npm run dev
```

App draait nu op `http://localhost:3000`.

### Jezelf platform-admin maken

Log eerst één keer in via de app (met Google), en run dan:

```bash
npm run db:seed -- jouw@email.nl
```

Je hebt nu toegang tot `/admin`.

## 2. Google OAuth instellen

1. Ga naar de [Google Cloud Console](https://console.cloud.google.com/) →
   maak een project aan (of gebruik een bestaand project).
2. **APIs & Services → OAuth consent screen** → stel in als "External",
   vul app-naam en contactgegevens in.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   → Type: "Web application".
4. Voeg als **Authorized redirect URI** toe:
   - Lokaal: `http://localhost:3000/api/auth/callback/google`
   - Productie: `https://jouw-domein.onrender.com/api/auth/callback/google`
5. Kopieer de Client ID en Client Secret naar je `.env` (en straks naar de
   environment variables op Render).

## 3. Naar GitHub pushen

```bash
git init
git add .
git commit -m "Initial commit: Shiftje starter"
git branch -M main
git remote add origin https://github.com/<jouw-gebruikersnaam>/<repo-naam>.git
git push -u origin main
```

## 4. Deployen op Render

**Optie A — Blueprint (aanbevolen, sneller):**

1. Push dit project naar GitHub (zie hierboven). Het bevat al een
   `render.yaml`.
2. Ga in Render naar **New → Blueprint**, kies je GitHub-repo.
3. Render maakt automatisch een web service + een gratis Postgres-database
   aan, en koppelt `DATABASE_URL` vanzelf.
4. Vul de overige environment variables in (Render vraagt hierom omdat ze
   `sync: false` hebben, zodat je geen geheimen in git zet):
   - `NEXTAUTH_URL` → je Render-URL, bv. `https://shiftje.onrender.com`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
5. Deploy. Render draait automatisch `prisma migrate deploy` als onderdeel
   van de build (zie `buildCommand` in `render.yaml`).

**Optie B — Handmatig:**

1. **New → PostgreSQL** → maak een database aan, kopieer de
   "Internal Database URL".
2. **New → Web Service** → koppel je GitHub-repo.
   - Build command: `npm install && npx prisma migrate deploy && npm run build`
   - Start command: `npm run start`
3. Zet de environment variables zoals hierboven.
4. Deploy.

Vergeet niet de Google OAuth redirect-URI aan te vullen met je definitieve
Render-domein (stap 2 hierboven).

## Volgende stappen (nog niet in deze starter)

- **Migraties**: dit project gebruikt `prisma db push` voor lokaal
  itereren. Zodra het schema stabieler is, stap over op
  `prisma migrate dev` / `prisma migrate deploy` voor nette
  migratiehistorie (het `render.yaml`-buildcommand draait al
  `migrate deploy`, dus zorg dat je migraties committed hebt).
- **E-mail versturen bij uitnodigingen** — nu wordt alleen een link
  gegenereerd (zie `TODO` in `src/app/api/invites/route.ts`). Koppel
  bijvoorbeeld Resend of Postmark.
- **Company-switcher** — huidige aanname is één zaak per gebruiker; zie
  comment in `src/lib/current-membership.ts`.
- **Weeknavigatie** — beschikbaarheid en rooster tonen nu alleen de huidige
  week; volgende/vorige week toevoegen is een kleine uitbreiding van
  `src/lib/week.ts` + de paginas die het gebruiken.
- **Bugmonitoring in het adminportaal** — koppel bijvoorbeeld Sentry en
  toon recente errors op `/admin`.
