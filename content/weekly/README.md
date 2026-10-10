# Wekelijkse content

Elke maandag maakt een geplande sessie (skill `weekly-content`, die in het Claude-account staat en niet in deze repository) drie dingen en zet die in één pull request:

1. een artikel in `src/content/articles/<slug>.json` (wordt `/artikel/<slug>`),
2. een concepttekst voor een forum of reviewpagina in `content/weekly/<datum>/forum-of-review.md`
   (voorbereid, **nooit geplaatst**: jij plaatst dit zelf),
3. een kleine SEO/GEO-update, uitgelegd in `content/weekly/<datum>/seo-geo-update.md`.

Het onderzoek staat per week in `content/weekly/<datum>/research.md`.
Een mens beoordeelt en merget het PR. Wat niet onderbouwd is, hoort niet in het PR.

Controleer artikelen lokaal met: `node scripts/check-articles.mjs`
