# SEO/GEO-update 2026-10-12: auteur-url in Article-schema

**Wat:** in `src/app/artikel/[slug]/page.tsx` krijgen de twee `Person`-auteurs (Thom, Daniel) een `url` naar `/over-ons`.

**Waarom:** Google raadt voor Article-markup bij `author` sterk aan `type` en `url` (of `sameAs`) te gebruiken en elke zichtbare auteur apart op te nemen (developers.google.com/search/docs/appearance/structured-data/article, geraadpleegd 2026-10-12). Schema.org/Article (geraadpleegd 2026-10-12) bevestigt `author` als Person of Organization. Op de pagina staat al "Door Thom en Daniel"; de markup koppelt nu eenduidig aan de over-ons-pagina.

**Risico's:** minimaal, geen zichtbare wijziging. Effect op posities of AI-citaties is niet zeker en waarschijnlijk klein. `/over-ons` bestaat.

**Meten:** Rich Results Test / Search Console op een artikel-URL (direct); zichtbaarheid pas na circa 6 tot 8 weken indicatief (Search Console, `/admin/visits`).

**Terugdraaien:** de twee `url`-velden verwijderen (revert van de commit).
