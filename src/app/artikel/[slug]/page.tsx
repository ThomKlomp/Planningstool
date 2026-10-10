import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";
import { getArticle, listArticles, type ArticleBlock } from "@/lib/articles";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";

// Alleen bestaande artikelen; alles anders is een 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return listArticles().map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = getArticle(params.slug);
  if (!a) return {};
  const path = `/artikel/${a.slug}`;
  const og = `/api/og?eyebrow=Artikel&title=${encodeURIComponent(a.title)}`;
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: path },
    // Een openGraph/twitter in een pagina vervangt die van de layout als geheel.
    openGraph: {
      type: "article",
      locale: "nl_NL",
      siteName: "Shiftje",
      url: path,
      title: `${a.title} | Shiftje`,
      description: a.description,
      publishedTime: a.published,
      modifiedTime: a.updated,
      images: [{ url: og, width: 1200, height: 630, alt: a.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${a.title} | Shiftje`,
      description: a.description,
      images: [og],
    },
  };
}

const H2 = "mt-12 font-display text-2xl font-bold tracking-tight md:text-3xl";
const P = "mt-3 leading-relaxed text-ink/80";
const LIST = "mt-3 space-y-2 pl-5 leading-relaxed text-ink/80";

// **vet** is de enige opmaak die in de tekst is toegestaan.
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 className={H2}>{block.text}</h2>;
    case "p":
      return (
        <p className={P}>
          <Inline text={block.text} />
        </p>
      );
    case "ul":
      return (
        <ul className={`${LIST} list-disc`}>
          {block.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className={`${LIST} list-decimal`}>
          {block.items.map((it, i) => (
            <li key={i}>
              <Inline text={it} />
            </li>
          ))}
        </ol>
      );
    case "checklist":
      return (
        <div className="mt-4 rounded-2xl bg-white p-5">
          {block.title ? <p className="font-display text-lg font-bold">{block.title}</p> : null}
          <ul className={`${block.title ? "mt-3 " : ""}space-y-2 text-ink/80`}>
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 rounded border-2 border-ink/40" />
                <span>
                  <Inline text={it} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "table":
      return (
        <div className="mt-5 overflow-hidden rounded-2xl bg-white">
          <p className="border-b border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink/50">
            {block.label}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line">
                <tr>
                  {block.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left text-xs font-bold text-ink/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2.5 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
  }
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  });
}

export default function ArtikelPage({ params }: { params: { slug: string } }) {
  const a = getArticle(params.slug);
  if (!a) notFound();

  const url = `${SITE_URL}/artikel/${a.slug}`;
  const schemas: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${url}#article`,
      headline: a.title,
      description: a.description,
      inLanguage: "nl-NL",
      datePublished: a.published,
      dateModified: a.updated,
      mainEntityOfPage: url,
      author: [
        { "@type": "Person", name: "Thom" },
        { "@type": "Person", name: "Daniel" },
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
      citation: a.sources.map((s) => s.url),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Shiftje", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: a.title, item: url },
      ],
    },
  ];
  if (a.faqs?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: a.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <main className="page-sage min-h-screen text-ink">
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {/* Losstaand artikel: alleen het logo, geen menu, chat of footerlinks. */}
      <SiteHeader minimal homeTrack="link-artikel" />

      <article className="mx-auto max-w-2xl px-6 pb-20 pt-10 md:pt-14">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {a.title}
        </h1>
        <p className="mt-3 text-sm text-ink/55">
          Door Thom en Daniel, de makers van Shiftje. Laatst bijgewerkt:{" "}
          <time dateTime={a.updated}>{formatDate(a.updated)}</time>.
        </p>

        <p className="mt-6 text-lg leading-relaxed text-ink/85">
          <Inline text={a.intro} />
        </p>

        {a.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}

        {a.faqs?.length ? (
          <>
            <h2 className={H2}>Veelgestelde vragen</h2>
            <div className="mt-4 flex flex-col gap-2.5">
              {a.faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl bg-white px-6 py-1.5">
                  <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-4 py-2 font-display text-lg font-bold">
                    {f.q}
                    <span aria-hidden className="text-xl text-terra transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-4 leading-relaxed text-ink/70">{f.a}</p>
                </details>
              ))}
            </div>
          </>
        ) : null}

        <h2 className={H2}>Bronnen</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink/70">
          {a.sources.map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="noopener noreferrer" target="_blank" className="underline hover:text-ink">
                {s.title}
              </a>{" "}
              <span className="text-ink/50">(geraadpleegd op {formatDate(s.accessed)})</span>
            </li>
          ))}
        </ul>
      </article>

      <SiteFooter minimal />
    </main>
  );
}
