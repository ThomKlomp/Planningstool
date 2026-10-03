import { prisma } from "@/lib/prisma";

/** Slug voor een zaak: accenten worden gewone letters (é -> e), de rest wordt een streepje. */
export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Zoals slugify vroeger werkte: accenten vielen weg als streepje ("Eetcafé" werd "eetcaf").
function legacySlugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type SlugFix = { id: string; name: string; from: string; to: string };

/**
 * Zoekt zaken waarvan de slug door de oude slugify is afgekapt. Een zaak waarvan
 * de slug niet (meer) uit de naam komt, bv. na hernoemen, blijft ongemoeid. De
 * demo-zaak ook. Nieuwe slugs zijn uniek, ook ten opzichte van elkaar.
 */
export async function planSlugFixes(): Promise<SlugFix[]> {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });
  const taken = new Set(companies.map((c) => c.slug));
  const fixes: SlugFix[] = [];

  for (const c of companies) {
    if (c.slug === "demo") continue;
    const oldBase = legacySlugify(c.name) || "zaak";
    const newBase = slugify(c.name) || "zaak";
    if (oldBase === newBase) continue;
    if (c.slug !== oldBase && !new RegExp(`^${oldBase}-\\d+$`).test(c.slug)) continue;

    let candidate = newBase;
    let attempt = 1;
    while (taken.has(candidate)) {
      attempt += 1;
      candidate = `${newBase}-${attempt}`;
    }
    taken.delete(c.slug);
    taken.add(candidate);
    fixes.push({ id: c.id, name: c.name, from: c.slug, to: candidate });
  }
  return fixes;
}
