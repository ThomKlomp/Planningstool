import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";
const PATH = "/rooster-oproepkrachten-horeca";

const TITLE = "Oproepkrachten inplannen in de horeca";
const DESCRIPTION =
  "Oproepkrachten en flexkrachten inplannen in de horeca: zo houd je overzicht met wisselende beschikbaarheid, een vaste kern en een duidelijke reserve-route.";
const OG_IMAGE = "/api/og?eyebrow=Artikel&title=Oproepkrachten%20inplannen%20in%20de%20horeca";

// Pas deze datums aan wanneer de inhoud van de pagina echt wijzigt.
const PUBLISHED = "2026-10-09";
const LAST_UPDATED = "2026-10-09";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  // Een openGraph/twitter in een pagina vervangt die van de layout als geheel,
  // dus de overige velden staan hier opnieuw.
  openGraph: {
    type: "article",
    locale: "nl_NL",
    siteName: "Shiftje",
    url: PATH,
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    publishedTime: PUBLISHED,
    modifiedTime: LAST_UPDATED,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | Shiftje`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": `${SITE_URL}${PATH}#article`,
  headline: TITLE,
  description: DESCRIPTION,
  inLanguage: "nl-NL",
  datePublished: PUBLISHED,
  dateModified: LAST_UPDATED,
  mainEntityOfPage: `${SITE_URL}${PATH}`,
  author: [
    { "@type": "Person", name: "Thom" },
    { "@type": "Person", name: "Daniel" },
  ],
  publisher: { "@id": `${SITE_URL}/#organization` },
  isPartOf: { "@id": `${SITE_URL}/#website` },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Shiftje", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: TITLE, item: `${SITE_URL}${PATH}` },
  ],
};

const H2 = "mt-12 font-display text-2xl font-bold tracking-tight md:text-3xl";
const P = "mt-3 leading-relaxed text-ink/80";
const LIST = "mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink/80";

export default function OproepkrachtenArtikel() {
  return (
    <main className="page-sage min-h-screen text-ink">
      {[articleSchema, breadcrumbSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <SiteHeader />

      <article className="mx-auto max-w-2xl px-6 pb-20 pt-10 md:pt-14">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {TITLE}
        </h1>
        <p className="mt-3 text-sm text-ink/55">
          Door{" "}
          <Link href="/over-ons" className="underline hover:text-ink">
            Thom en Daniel
          </Link>
          , de makers van Shiftje. Laatst bijgewerkt: <time dateTime={LAST_UPDATED}>9 oktober 2026</time>.
        </p>

        <p className="mt-6 text-lg leading-relaxed text-ink/85">
          Met oproepkrachten en wisselende werktijden werkt een rooster alleen als je een vaste kern neerzet,
          beschikbaarheid op vaste momenten ophaalt en vooraf afspreekt wat er gebeurt als iemand niet kan.
          Zonder die drie dingen wordt elke week opnieuw een puzzel.
        </p>

        <h2 className={H2}>Waarom oproepkrachten het rooster lastiger maken</h2>
        <p className={P}>
          Een rooster met vaste medewerkers en vaste dagen maak je snel. Zodra een groot deel van je team uit
          studenten, bijbaners, oproepkrachten of mensen met een nulurencontract bestaat, verandert dat. Niet
          omdat die mensen minder goed zijn, maar omdat hun beschikbaarheid elke week anders is.
        </p>
        <ul className={LIST}>
          <li>
            <strong className="text-ink">Beschikbaarheid komt los binnen.</strong> Een appje, een briefje, een
            opmerking aan de bar. Jij zet het bij elkaar tot een rooster.
          </li>
          <li>
            <strong className="text-ink">De drukte weet je laat.</strong> Het weer, een evenement of een
            reservering bepaalt hoeveel mensen je nodig hebt, terwijl je team eerder wil weten waar het aan
            toe is.
          </li>
          <li>
            <strong className="text-ink">Elke wijziging raakt meer dan één persoon.</strong> Iemand zegt af,
            een ander neemt over, en dan moet iedereen de nieuwe stand weten.
          </li>
          <li>
            <strong className="text-ink">Alles staat op meerdere plekken.</strong> Beschikbaarheid in de
            groepsapp, het rooster in een spreadsheet, de uren op papier. Je zoekt steeds waar iets staat, en
            je medewerkers ook.
          </li>
        </ul>

        <h2 className={H2}>1. Zet een vaste kern neer en plan daaromheen</h2>
        <p className={P}>
          Begin met de mensen en diensten die zekerheid geven: wie vaste dagen werkt, wie sleutelfuncties
          vervult en wie ervoor zorgt dat de zaak open en dicht kan. Daaromheen plan je de flexibele mensen.
          Hoe groter de vaste kern, hoe minder je rooster afhangt van losse antwoorden.
        </p>
        <p className={P}>
          Heb je weinig vaste mensen? Dan is een vast patroon voor degenen die er wel zijn nog waardevoller.
          Elke vaste dienst die je niet elke week opnieuw hoeft te plannen scheelt tijd en vragen.
        </p>

        <h2 className={H2}>2. Haal beschikbaarheid op vaste momenten op</h2>
        <p className={P}>
          Het grootste tijdverlies zit in het najagen van antwoorden. Maak het eenvoudiger voor jezelf en voor
          je team door het te standaardiseren:
        </p>
        <ul className={LIST}>
          <li>
            <strong className="text-ink">Eén kanaal en één vast moment.</strong> Bijvoorbeeld &ldquo;elke
            woensdag voor de week erna&rdquo;. Iedereen weet dan wanneer het gevraagd wordt en waar het
            ingevuld moet.
          </li>
          <li>
            <strong className="text-ink">Per dag of per dienst.</strong> Een oproepkracht die alleen
            weekendavonden kan, wil dat doorgeven zonder een heel verhaal te hoeven typen.
          </li>
          <li>
            <strong className="text-ink">Drie antwoorden.</strong> Kan, kan niet en weet ik nog niet. Dat
            laatste is eerlijk en voorkomt dat mensen &ldquo;ja&rdquo; zeggen terwijl ze het niet zeker weten.
          </li>
          <li>
            <strong className="text-ink">Per periode vooruit.</strong> Laat mensen bekende afwezigheid, zoals
            tentamens en vakanties, vroeg doorgeven.
          </li>
        </ul>

        <h2 className={H2}>3. Maak één plek voor het rooster en voor wijzigingen</h2>
        <p className={P}>
          Met wisselend personeel veranderen er meer dingen na publicatie. Dat is normaal, zolang het niet
          chaotisch wordt. Spreek af waar het rooster staat, wat de actuele versie is en hoe wijzigingen
          bekend worden gemaakt. Een oude versie die nog ergens rondzweeft is de snelste weg naar een
          lege bar of twee mensen op dezelfde dienst.
        </p>

        <h2 className={H2}>4. Regel een reserve-route</h2>
        <p className={P}>
          Als iemand op het laatste moment afzegt, wil je niet een kwartier lang bellen. Bepaal van tevoren
          wat er dan gebeurt:
        </p>
        <ul className={LIST}>
          <li>De dienst wordt als open dienst aan het team aangeboden op de vaste plek.</li>
          <li>Wie hem wil, meldt zich, en jij geeft akkoord.</li>
          <li>
            Heb je mensen die graag extra uren draaien? Spreek af dat zij als eerste gevraagd worden, en
            houd bij wie dat is.
          </li>
          <li>Laat bij drukke diensten bewust een plek open, zodat je minder vaak in de problemen komt.</li>
        </ul>

        <h2 className={H2}>5. Houd het voorspelbaar en eerlijk</h2>
        <p className={P}>
          Mensen met een flexibel contract plannen hun leven om het rooster heen, vaak met een studie of een
          tweede baan. Hoe eerder en vaster je het rooster deelt, hoe beter dat lukt. Verdeel daarnaast de
          lastige diensten, zoals de late vrijdag of het sluiten, zichtbaar eerlijk, en let op wie altijd
          inspringt. Dat is meestal de persoon die er binnenkort mee ophoudt.
        </p>

        <h2 className={H2}>Veelgemaakte fouten</h2>
        <ul className={LIST}>
          <li>Beschikbaarheid via meerdere kanalen ophalen en niet meer weten wat de laatste stand is.</li>
          <li>Een rooster pas laat delen, waardoor flexkrachten andere plannen maken.</li>
          <li>Wijzigingen alleen mondeling afspreken, zodat later niemand zeker weet wat er is besproken.</li>
          <li>Altijd dezelfde mensen vragen om in te vallen.</li>
          <li>Vergeten vragen wie er juist niet kan, in plaats van alleen wie wel kan.</li>
        </ul>

        <h2 className={H2}>Checklist: oproepkrachten inplannen</h2>
        <div className="mt-4 rounded-2xl bg-white p-5">
          <ul className="space-y-2 text-ink/80">
            {[
              "Er staat een vaste kern en daaromheen plan ik de flexibele mensen",
              "Beschikbaarheid komt binnen op één plek, op een vast moment",
              "Mensen kunnen kan, kan niet of weet nog niet doorgeven",
              "Het rooster staat op één plek, in één versie",
              "Wijzigingen worden bekendgemaakt, niet alleen doorgevoerd",
              "Er is een reserve-route voor een dienst die ineens openvalt",
              "Zware diensten zijn zichtbaar eerlijk verdeeld",
              "Het rooster wordt vroeg genoeg gedeeld",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 rounded border-2 border-ink/40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <h2 className={H2}>Hoe doe je dit in de praktijk?</h2>
        <p className={P}>
          Dit kan met een spreadsheet en een groepsapp, zolang je team overzichtelijk blijft en je discipline
          houdt. Wordt het meer dan dat te beheren, dan loont het om beschikbaarheid, rooster, ruilen en uren
          op één plek te regelen. Dat is waarom wij Shiftje maakten. Wil je zien hoe dat eruitziet?{" "}
          <Link href="/" data-track="link-oproep" className="underline hover:text-ink">
            Bekijk de homepage
          </Link>
          .
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
