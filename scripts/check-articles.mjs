// Controleert alle artikelen in src/content/articles op structuur en op de
// vaste spelregels van Shiftje. Gebruik: node scripts/check-articles.mjs
// Stopt met exitcode 1 als er iets mis is (zo faalt ook een foutief artikel
// vóór het live gaat).
import fs from "node:fs";
import path from "node:path";

const DIR = path.join(process.cwd(), "src", "content", "articles");
const BLOCK_TYPES = new Set(["h2", "p", "ul", "ol", "checklist", "table"]);

// Nooit in teksten: omschrijving van onze doelgroep als "kleine horeca",
// cao- en wetsinformatie, concurrenten bij naam, beloftes en verzonnen klanten.
const FORBIDDEN = [
  [/kleine horeca/i, 'gebruik "lokale horeca", niet "kleine horeca"'],
  [/\bcao\b|arbeidstijdenwet|oproeptermijn|wet arbeidsmarkt in balans/i, "geen cao- of wetsinformatie"],
  [
    /shiftbase|planday|werktijden\.nl|fooks|horeko|catermonkey|snelplan|get-?sides|deputy|7shifts|when i work|humanity|m\+? ?kassa|nedap|tamigo|papershift/i,
    "geen concurrenten bij naam",
  ],
  [/gegarandeerd|garantie|\bgarandeer/i, "geen beloftes of garanties"],
  [/goedkoopste|\bde beste\b|nummer 1|marktleider/i, "geen superlatieven over Shiftje"],
  [/onze klanten|klanten zeggen|gebruikers zeggen|klanten vertellen|tevreden klanten/i, "geen echte klanten of reviews claimen"],
  [/https?:\/\//i, "geen losse URL's in de tekst (alleen in sources)"],
];

const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const isDate = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));

let files = [];
try {
  files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
} catch {
  /* geen map = geen artikelen */
}

const slugs = new Set();
for (const f of files) {
  let a;
  try {
    a = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
  } catch (e) {
    err(f, `ongeldige JSON (${e.message})`);
    continue;
  }
  if (typeof a.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug)) err(f, "slug ontbreekt of is niet kebab-case");
  if (a.slug !== f.replace(/\.json$/, "")) err(f, "slug moet gelijk zijn aan de bestandsnaam");
  if (slugs.has(a.slug)) err(f, "dubbele slug");
  slugs.add(a.slug);
  if (typeof a.title !== "string" || a.title.length < 10 || a.title.length > 70) err(f, "title ontbreekt of is niet 10-70 tekens");
  if (typeof a.description !== "string" || a.description.length < 80 || a.description.length > 155) err(f, "description ontbreekt of is niet 80-155 tekens");
  if (!isDate(a.published)) err(f, "published is geen datum (YYYY-MM-DD)");
  if (!isDate(a.updated)) err(f, "updated is geen datum (YYYY-MM-DD)");
  if (typeof a.intro !== "string" || a.intro.length < 120) err(f, "intro ontbreekt of is te kort (antwoord eerst, minstens 120 tekens)");
  if (!Array.isArray(a.blocks) || a.blocks.length < 6) err(f, "blocks ontbreekt of heeft minder dan 6 onderdelen");
  else {
    let words = String(a.intro || "").split(/\s+/).length;
    for (const [i, b] of a.blocks.entries()) {
      if (!b || !BLOCK_TYPES.has(b.type)) {
        err(f, `blocks[${i}] heeft een onbekend type`);
        continue;
      }
      const t = JSON.stringify(b);
      words += t.split(/\s+/).length;
      if ((b.type === "h2" || b.type === "p") && typeof b.text !== "string") err(f, `blocks[${i}].text ontbreekt`);
      if (["ul", "ol", "checklist"].includes(b.type) && (!Array.isArray(b.items) || !b.items.length)) err(f, `blocks[${i}].items ontbreekt`);
      if (b.type === "table" && (!b.label || !Array.isArray(b.headers) || !Array.isArray(b.rows) || !b.rows.length)) err(f, `blocks[${i}] (table) is onvolledig`);
    }
    if (words < 600) err(f, `artikel is erg kort (${words} woorden, minimaal ongeveer 600)`);
  }
  if (a.faqs !== undefined && (!Array.isArray(a.faqs) || a.faqs.some((q) => !q.q || !q.a))) err(f, "faqs is ongeldig");
  if (!Array.isArray(a.sources) || a.sources.length < 3) err(f, "minstens 3 sources vereist (title, url, accessed)");
  else
    for (const [i, s] of a.sources.entries()) {
      if (!s.title || !/^https:\/\//.test(s.url || "")) err(f, `sources[${i}] mist title of https-url`);
      if (!isDate(s.accessed)) err(f, `sources[${i}].accessed is geen datum`);
    }
  // Spelregels op alle zichtbare tekst (zonder sources).
  const text = JSON.stringify({ ...a, sources: undefined });
  for (const [re, why] of FORBIDDEN) {
    const m = text.match(re);
    if (m) err(f, `verboden "${m[0]}": ${why}`);
  }
}

if (errors.length) {
  console.error(`Artikelcontrole mislukt (${errors.length}):\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`Artikelcontrole OK (${files.length} artikel${files.length === 1 ? "" : "en"}).`);
