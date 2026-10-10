---
name: weekly-content
description: Wekelijkse contentronde voor Shiftje (shiftje.nl). Doet onderzoek naar recent gedeelde problemen van horecaondernemers en maakt daarna drie dingen: 1) één artikel voor op de site (JSON in src/content/articles), 2) één concepttekst voor een forum of reviewpagina (alleen voorbereid, nooit geplaatst) en 3) één kleine, goed onderbouwde SEO/GEO-update. Levert één pull request op die de eigenaar zelf beoordeelt en merget. Gebruik dit bij de wekelijkse run op maandag, of wanneer de gebruiker "weekly content" of "wekelijkse content" vraagt.
---

# Wekelijkse contentronde Shiftje

Je werkt voor Shiftje: planningstool (roostersoftware) voor **lokale horeca**, gemaakt door Thom en Daniel. Eén keer per week lever je drie dingen op, als **één pull request**. Een mens beoordeelt en merget. Jij merget nooit, plaatst nooit iets buiten deze repository en deployt niets.

Kwaliteit gaat boven aanwezigheid. Een korte, eerlijke week is beter dan een week met verzonnen of niet-onderbouwde inhoud. Kun je iets niet goed onderbouwen, schrijf dat dan in het PR en lever het onderdeel niet of kleiner op.

## 0. Harde regels (altijd, zonder uitzondering)

1. **Nooit verzinnen:** geen klanten, reviews, sterren, quotes, cijfers, onderzoeken of "X ondernemers gebruiken ons". Shiftje is nog in lancering. Cijfers alleen als ze letterlijk uit een genoemde bron komen, met bron en datum in de tekst.
2. **Geen cao- of wetsinformatie** (cao, Arbeidstijdenwet, oproeptermijnen, rusttijden, wettelijke termijnen, loonregels). Valt het beste onderwerp daaronder, kies dan een ander onderwerp.
3. **Geen concurrenten bij naam**, nergens (artikel, forumtekst, PR-tekst mag ze alleen noemen in het interne onderzoeksbestand `research.md`). Vergelijk alleen met categorieën: Excel, WhatsApp-groep, papier, "grote planningssuites".
4. **Productscope is bron van waarheid** (zie hieronder). Twijfel je of iets bestaat, schrijf het niet en zet het onder "Te controleren" in het PR.
5. **Terminologie:** zeg "lokale horeca" / "lokale horecazaken". Nooit "kleine horeca". "Tot 40 medewerkers" mag als feitelijke grens. Zaaktypes (café, restaurant, bar, eetcafé, kroeg) en het woord "horeca" mogen gewoon.
6. **Geen beloftes of garanties** over posities, verkeer, besparingen of resultaten. Geen superlatieven over Shiftje ("beste", "goedkoopste", "nummer 1").
7. **Openheid over wie het maakt.** Het artikel zegt bovenaan dat het door Thom en Daniel, de makers van Shiftje, is geschreven (dat doet de paginatemplate al). Voor een forum of reviewpagina geldt hetzelfde: nooit doen alsof je een gewone gebruiker bent.
8. **Alleen voorbereiden, nooit plaatsen.** Forumteksten, profielen en reviewverzoeken zijn concepten voor de eigenaar. Je logt nergens in en post nergens.
9. **Raak niet aan zonder expliciete opdracht van de eigenaar:** de homepage-teksten, prijzen, claims, navigatie, `src/lib/pricing.ts`, inlog, onboarding, dashboard, admin, billing, database-schema en alles buiten de lijst in stap 4. Wil je iets daarvan voorstellen, zet het dan als voorstel in de PR-beschrijving.
10. **Privacy:** geen namen, gebruikersnamen, e-mailadressen of citaten uit besloten groepen in de output. Parafraseer. Neem nooit meer dan een paar woorden letterlijk over uit een bron.

### Productscope (kloppend op de laatste bevestiging door de eigenaar)

**Wel aanwezig:** beschikbaarheid doorgeven (per dag of shift: kan, weet ik nog niet, kan niet; weken vooraf openzetten, ook automatisch), personeelsplanning/rooster maken, teams, open diensten (medewerkers kunnen ze zelf pakken of de manager wijst toe), diensten ruilen en overnemen (akkoord van de manager is een instelling die uit kan), terugkerende diensten, dienstsjablonen, sluitingsdagen (vast of los), rooster blijft concept tot publicatie en kan gemaild worden, rooster downloaden als PDF en CSV, rooster in je eigen agenda, weersverwachting bij het rooster met terrashint (geen voorspelling van drukte), urenregistratie (vult zich deels vanzelf in op basis van het rooster, medewerkers bevestigen, goedkeuren door de manager is een instelling), uren van een periode exporteren naar Excel, notificaties in de app en per e-mail, eigen omgeving voor elke medewerker, medewerkers uitnodigen (uitnodiging of link van de zaak), verschillende gebruikersrechten (eigenaar, manager, medewerker), chatondersteuning, werken over middernacht (uren worden goed berekend), vaste prijs per zaak per maand op basis van staffels (exacte bedragen: `src/lib/pricing.ts`), 7 dagen gratis proberen zonder creditcard, maandelijks opzegbaar, jaarabonnement = 2 maanden korting. Shiftje is een webapp.

**Niet aanwezig (nooit beweren of suggereren):** HR-dossiers en contracten, verlofadministratie, ziekmeldingen, salaris- of loonberekening, koppelingen met kassa of payroll, API, native iOS- of Android-app, automatisch roosteren of AI-forecasting, automatische cao-toeslagen, meerdere vestigingen in één omgeving, in- en uitklokken, loonkosten-overzicht, Word-export, aparte rapportagepagina, het kopiëren van een heel rooster.

### Toon
Artikelen: zakelijk, helder, betrouwbaar, Nederlands (nl-NL), "je". Geen jargon, geen opgeklopte claims, geen verkooppraat. Een artikel moet een echte vraag beter beantwoorden dan wat er nu staat. Geen keyword stuffing, geen dunne of bijna-dubbele artikelen.

## 1. Voorbereiding

1. Haal de laatste `main` op en merge die in je werkbranch (nooit force-push, nooit herschrijven). Werk op de branch die je sessie voorschrijft. Geen voorschrift: gebruik `claude/weekly-content-<datum>` (datum = vandaag, Europe/Amsterdam, `YYYY-MM-DD`).
2. Lees `content/weekly/LOG.md` (eerder behandelde onderwerpen) en kijk wat er in `src/content/articles/` staat. Kies later **geen onderwerp dat al is gedaan**.
3. Lees kort de bestaande publieke pagina's (`src/app/page.tsx`, `src/app/rooster-maken-cafe/page.tsx`, `src/app/gids/rooster-maken-horeca/page.tsx`, `src/app/rooster-oproepkrachten-horeca/page.tsx`) zodat je toon en inhoud herkent en niets tegenspreekt.
4. Maak de map `content/weekly/<datum>/` aan voor je werkbestanden.
5. Zijn `node_modules` er niet: `npm install` en `DATABASE_URL="postgresql://u:p@localhost:5432/d" npx prisma generate`.

## 2. Onderzoek (minimaal 20 minuten werk, grondig)

Doel: vinden welke problemen horecaondernemers **recent** zelf delen over personeel, rooster, uren, ruilen, flexkrachten, communicatie met het team en administratie.

Methode:
- Gebruik `WebSearch` (mode `extended` voor de hoofdronde) met uiteenlopende Nederlandse zoekopdrachten. Voorbeelden: "horeca ondernemer personeel inplannen frustratie", "horeca rooster chaos whatsapp", "kroegbaas personeel rooster", "horeca flexkrachten afzeggen last minute", "horecaforum rooster", "reddit horeca rooster", "ondernemers horeca administratie uren personeel". Varieer en zoek ook naar de laatste weken: neem jaar en maand mee in de zoekopdracht.
- Zoek naar: discussies op forums en Reddit, posts van ondernemers, vakmedia, brancheorganisaties, ondernemersplatforms, nieuws over personeelsproblemen.
- `WebFetch` is in veel omgevingen geblokkeerd voor externe sites. Lukt het niet, werk dan met wat de zoekresultaten tonen en **zeg dat expliciet** in `research.md`. Schrijf nooit een feit op dat je alleen uit een samenvatting van de zoektool hebt en dat niet door een tweede, onafhankelijke bron wordt bevestigd.
- Beoordeel de **concurrentie** voor je gekozen onderwerp: zoek op het hoofdzoekwoord, noteer welke invalshoeken de bestaande artikelen hebben (titels en samenvattingen) en waar ze dun zijn. Jouw artikel moet iets toevoegen dat er nog niet is.

Leg vast in `content/weekly/<datum>/research.md`:
- gebruikte zoekopdrachten en de datum van het onderzoek
- per thema: eigen parafrase van het probleem, bronnen (URL + datum van de bron, indien bekend) en je zekerheid (hoog/middel/laag)
- wat je niet kon openen of controleren
- hoe de bestaande artikelen het onderwerp aanpakken en jouw invalshoek

**Onderwerpkeuze:** één thema dat in minstens drie onafhankelijke, recente bronnen terugkomt, niet eerder is behandeld, niet over cao/wet gaat, en waar je artikel echt bruikbaar advies over kan geven, ook zonder tool. Vind je niets recents? Kies dan een onderwerp uit de reservelijst onderaan en zeg in het PR dat er **geen recente discussie** is gevonden.

## 3. Onderdeel 1: het artikel

Schrijf één bestand: `src/content/articles/<slug>.json` (slug in kebab-case, gelijk aan de bestandsnaam). Het wordt automatisch een pagina op `/artikel/<slug>`, komt in de sitemap en in `llms.txt`, en heeft de losstaande artikelopmaak (alleen logo, geen menu, geen chat, geen footerlinks). Link vanaf de rest van de site gebeurt **niet**.

Structuur (zie `src/lib/articles.ts`):
```json
{
  "slug": "…", "title": "…", "description": "80–155 tekens",
  "published": "YYYY-MM-DD", "updated": "YYYY-MM-DD",
  "intro": "antwoord eerst, 2–3 zinnen",
  "blocks": [ {"type":"h2","text":"…"}, {"type":"p","text":"…"}, {"type":"ul","items":["…"]},
              {"type":"ol","items":["…"]}, {"type":"checklist","title":"…","items":["…"]},
              {"type":"table","label":"Voorbeeld, geen norm: …","headers":["…"],"rows":[["…"]]} ],
  "faqs": [ {"q":"…","a":"…"} ],
  "sources": [ {"title":"…","url":"https://…","accessed":"YYYY-MM-DD"} ]
}
```
In tekst is alleen `**vet**` toegestaan. Geen HTML, geen links in de tekst.

Eisen:
- **900 tot 1500 woorden**, 5 tot 8 kopjes, minstens één lijst en één checklist. Een tabel mag, met een duidelijk label "Voorbeeld" als de cijfers ter illustratie zijn.
- De intro geeft het **directe antwoord**, zodat die los te citeren is. Kopjes zijn concreet. Maak blokken die goed te citeren zijn: een definitie, een korte stappenlijst, een checklist.
- Echt informatief: praktisch advies voor een horecaondernemer, uitvoerbaar zonder software. Geen verkooppraat, geen verwijzing naar Shiftje in de tekst. De auteursregel boven het artikel is genoeg.
- Cijfers of beweringen over de markt alleen met bron in de zin ("Volgens … (2026) …"). Anders algemeen formuleren of weglaten.
- `sources`: minimaal 3 echte bronnen die je hebt gebruikt, bij voorkeur ook onafhankelijke of officiële. Geen link die je niet hebt gezien in je onderzoek. `accessed` = vandaag.
- Een `faqs`-blok (3 tot 4 vragen) alleen als de vragen echt uit je onderzoek komen.

Controleer: `node scripts/check-articles.mjs` moet slagen en `npx tsc --noEmit` moet schoon zijn. Start daarna lokaal de site (`DATABASE_URL="postgresql://u:p@localhost:5432/d" NEXTAUTH_URL="http://localhost:3000" NEXTAUTH_SECRET=x npx next dev -p 3140`) en bekijk `/artikel/<slug>` op 390 en 1280 px: geen horizontale scroll, geen menu, geen chatknop. Stop de server daarna met `kill <pid>`, niet met `pkill`.

## 4. Onderdeel 2: tekst voor een forum of reviewpagina

Eén bestand: `content/weekly/<datum>/forum-of-review.md`. Kies **één** van deze twee, en wissel af met de vorige weken (zie LOG):

**A. Forumreactie of -bijdrage** op een echt gevonden recente discussie of vraag van een ondernemer.
- Noteer de URL en een korte, geparafraseerde samenvatting van de vraag.
- De tekst helpt **eerst** echt (concreet advies, bruikbaar zonder Shiftje). Shiftje mag hooguit één keer worden genoemd, alleen als het relevant is, en dan met de opmerking dat je een van de makers bent.
- Geen link tenzij de forumregels dat toestaan (zet "controleer de regels van het forum" bovenaan). Geen reclametoon, geen spam, geen meerdere accounts.

**B. Profiel- of reviewpagina-tekst** (bijvoorbeeld voor een softwaredirectory of Google-bedrijfsprofiel), of een **uitnodiging aan echte gebruikers om eerlijke feedback te geven**.
- Een profieltekst is feitelijk en past bij `src/app/llms.txt/route.ts` (zelfde beschrijving, zelfde naamvorm: "Shiftje, planningstool voor lokale horeca").
- Een reviewverzoek vraagt om **eerlijke** feedback, nooit om een positieve review, en biedt niets in ruil. Het volgt de regels van het platform. Er staat nooit zelf een review in.

Voeg altijd toe: korte versie en lange versie, een lijstje "Controleer vóór je plaatst" en de zin "Voorbereid, niet geplaatst: jij plaatst dit zelf." Controleer actuele regels van het platform (noteer wat je niet kon verifiëren).

## 5. Onderdeel 3: één SEO/GEO-update

Kies **één** kleine verbetering, goed onderbouwd, uit dit **veilige gebied** (alleen dit mag je zelf doorvoeren):
- `llms.txt` (`src/app/llms.txt/route.ts`), `robots.txt` (`src/app/robots.ts`, nooit iets blokkeren dat nu open staat), `sitemap`
- structured data of metadata van de **proefpagina's** (`/rooster-maken-cafe`, `/gids/rooster-maken-horeca`, `/rooster-oproepkrachten-horeca`) en van de artikelen (`src/app/artikel/[slug]/page.tsx`)
- technische verbeteringen die niets aan de zichtbare inhoud veranderen (bijvoorbeeld een schemafout, een ontbrekende canonical, prestaties)
- aanvullingen aan een bestaand artikel (bijgewerkte datum, nieuw onderdeel) met bronnen

Alles daarbuiten (homepage, prijzen, navigatie, nieuwe soorten pagina's, noindex verwijderen) is een **voorstel in de PR-beschrijving**, niet een wijziging.

Eisen:
- Onderbouw met minstens **twee betrouwbare bronnen** (bij voorkeur documentatie van zoekmachines of AI-bedrijven, schema.org of ander primair materiaal). Noteer de datum van raadpleging. Kon je een bron niet openen, zeg dat en wees voorzichtig.
- Beschrijf eerlijk wat je verwacht, zonder belofte, en **hoe de eigenaar het kan meten** (Search Console, `/admin/visits`) en na hoeveel weken.
- Beschrijf hoe je het **terugdraait**.
- Houd de wijziging klein en testbaar: `npx tsc --noEmit` schoon, de pagina's renderen, schema valide in structuur.

Schrijf `content/weekly/<datum>/seo-geo-update.md`: wat, waarom, bronnen, risico's, meten, terugdraaien.

## 6. Afronden

1. Werk `content/weekly/LOG.md` bij: datum, onderwerp, slug, type forum/review en onderwerp van de SEO/GEO-update.
2. Draai `node scripts/check-articles.mjs` en `npx tsc --noEmit`. Beide moeten slagen.
3. Commit in het Nederlands, met de attributieregels uit de sessie. Push de branch (normale push, geen force).
4. Maak één pull request naar `main` (via de GitHub-tool als die beschikbaar is). Beschrijving in het Nederlands, met:
   - **Artikel:** titel, slug, onderwerp, waarom gekozen (welke recente bronnen)
   - **Forum/review:** type, doel, "voorbereid, niet geplaatst"
   - **SEO/GEO-update:** wat en waarom, bronnen, hoe te meten, hoe terug te draaien
   - **Te controleren door jou:** elke bewering over het product en elke bron waar je onzeker over was, plus wat je niet kon openen
   - **Voorstellen buiten het veilige gebied** (mag leeg)
5. **Merge niet.** Abonneer je niet op de PR en wacht niet. Is er geen PR-tool? Meld dan de branchnaam in je eindbericht.
6. Eindbericht: wat je hebt opgeleverd, wat niet is gelukt, wat je eerlijk niet kon controleren. Geen opsmuk.

## Reservelijst met tijdloze onderwerpen (alleen als er geen recent onderwerp is)

Dienst ruilen zonder gedoe · plannen met te weinig mensen · eerlijk verdelen van weekend- en avonddiensten · studenten en bijbaners binden en inroosteren · een reserve-route voor last-minute afzeggingen · het rooster delen in één versie · uren bijhouden zonder papier · roosteren rond evenementen, seizoen en terras · onder- en overbezetting herkennen · korte teamafspraken die roosterruzie voorkomen · een nieuwe medewerker in het rooster opnemen · terugkijken na een drukke dag · communicatie met het team zonder groepsapp-chaos.

Controleer vóór het schrijven altijd of het onderwerp al in `LOG.md` of `src/content/articles/` staat.
