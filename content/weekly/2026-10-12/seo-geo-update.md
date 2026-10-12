# SEO/GEO-update — 2026-10-12

**Wat:** in `src/app/artikel/[slug]/page.tsx` krijgt het Article-schema een `image`-property (dezelfde OG-afbeelding als in de metadata).
**Waarom:** Google noemt `image` bij Article-markup als aanbevolen eigenschap; het artikelschema had die niet.
**Bronnen:**
- Google Search Central, Article structured data, https://developers.google.com/search/docs/data-types/article (geraadpleegd 2026-10-12; alleen via zoekresultaat gezien, niet de volledige tabel — controleer).
- schema.org/Article en `image` (CreativeWork): https://schema.org/Article — NIET geopend in deze run (WebFetch geblokkeerd); controleer.
**Risico's:** laag; alleen extra JSON-LD, zichtbare inhoud ongewijzigd. Onzeker: of de dynamische `/api/og`-URL als afbeelding geaccepteerd wordt.
**Verwachting:** geen belofte; hooguit een completere markup/kans op rijkere weergave.
**Meten:** Search Console → Verbeteringen/rich results-test voor `/artikel/...`, na 4–8 weken; verkeer via `/admin/visits`.
**Terugdraaien:** de `image`-regel uit het schema verwijderen.
