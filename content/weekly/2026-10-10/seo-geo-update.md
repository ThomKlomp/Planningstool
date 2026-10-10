# SEO/GEO-update: author.url in Article-schema

**Wat:** in `src/app/artikel/[slug]/page.tsx` krijgen de twee auteurs (Person) in het Article-schema een `url` naar `/over-ons`, de pagina waar Thom en Daniel worden gepresenteerd.

**Waarom:** Google noemt `author.url` als aanbevolen property: een pagina die de auteur uniek identificeert (bijv. een "over mij"-pagina). Dit helpt bij het koppelen van artikelen aan de makers. Geen zichtbare wijziging.

**Bronnen (via zoekresultaten, niet op de pagina zelf geopend; alleen samenvattingen gezien, geraadpleegd 2026-10-10):**
- Google Search Central, Article structured data: https://developers.google.com/search/docs/data-types/article
- Search Engine Land, "Google adds author URL property to uniquely identify authors of articles" (aug. 2021): https://searchengineland.com/google-adds-author-url-property-to-uniquely-identify-authors-of-articles-351131

**Risico's:** klein. Het is een aanbeveling, geen vereiste; geen belofte over posities of rich results. De Google-pagina kon ik niet openen.

**Meten:** Search Console (Verbeteringen / Artikel-markup, geen fouten) en Rich Results Test op een artikel; kijk na 4 tot 8 weken. Een effect op verkeer is niet te verwachten of te garanderen.

**Terugdraaien:** de `url`-velden bij de twee Persons verwijderen of de commit reverten.
