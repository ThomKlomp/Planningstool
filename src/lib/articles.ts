import fs from "node:fs";
import path from "node:path";

// Artikelen staan als JSON-bestanden in src/content/articles/<slug>.json en
// worden getoond op /artikel/<slug> (zie src/app/artikel/[slug]/page.tsx).
// Een nieuw artikel toevoegen = één bestand toevoegen, geen code wijzigen.
// Controleer een bestand met: node scripts/check-articles.mjs

export type ArticleBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "checklist"; title?: string; items: string[] }
  | { type: "table"; label: string; headers: string[]; rows: string[][] };

export type ArticleSource = { title: string; url: string; accessed: string };

export type Article = {
  slug: string;
  title: string;
  description: string;
  published: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
  intro: string;
  blocks: ArticleBlock[];
  faqs?: { q: string; a: string }[];
  sources: ArticleSource[];
};

const DIR = path.join(process.cwd(), "src", "content", "articles");

export function listArticles(): Article[] {
  let files: string[] = [];
  try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Article)
    .sort((a, b) => b.published.localeCompare(a.published));
}

export function getArticle(slug: string): Article | undefined {
  return listArticles().find((a) => a.slug === slug);
}
