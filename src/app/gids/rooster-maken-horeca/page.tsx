import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/marketing/site-header";
import SiteFooter from "@/components/marketing/site-footer";

const SITE_URL = process.env.NEXTAUTH_URL || "https://shiftje.nl";
const PATH = "/gids/rooster-maken-horeca";

const TITLE = "Rooster maken in de horeca: zo pak je het aan";
const DESCRIPTION =
  "Rooster maken in de horeca? Zo bepaal je de bezetting, haal je beschikbaarheid op, verdeel je diensten eerlijk en regel je ruilen. Met checklist.";
const OG_IMAGE = "/api/og?eyebrow=Gids&title=Rooster%20maken%20in%20de%20horeca%3A%20zo%20pak%20je%20het%20aan";

// Pas deze datums aan wanneer de inhoud van de pagina echt wijzigt.
const PUBLISHED = "2026-10-08";
const LAST_UPDATED = "2026-10-08";

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

const FAQS = [
  {
    q: "Hoe vaak maak je een rooster?",
    a: "Kies een vast ritme dat past bij hoe snel je zaak verandert: wekelijks als je programma elke week anders is, per paar weken als het vrij constant is. Belangrijker dan het ritme is dat het vast ligt. Medewerkers moeten weten wanneer ze beschikbaarheid doorgeven en wanneer het rooster verschijnt.",
  },
  {
    q: "Hoe plan je studenten en bijbaners in?",
    a: "Vraag hun beschikbaarheid vooraf en per periode, zodat tentamens, stages en vakanties erin zitten voordat je plant. Gebruik daarbij drie antwoorden in plaats van twee: kan, weet ik nog niet, kan niet. Zo zie je meteen waar nog onzekerheid zit.",
  },
  {
    q: "Wat doe je als iemand op het laatste moment afzegt?",
    a: "Zorg voor één vaste route: de dienst gaat als open dienst naar het team, en wie hem wil, meldt zich. Heb je mensen die graag extra uren draaien, spreek dan van tevoren af dat zij als eerste gebeld worden.",
  },
  {
    q: "Hoe voorkom je discussie over eerlijkheid?",
    a: "Houd bij hoeveel weekend- en avonddiensten iedereen heeft gedraaid, en maak die telling zichtbaar. Een rooster is eerlijk als mensen kunnen zien waarom het zo is verdeeld, niet alleen als het inhoudelijk klopt.",
  },
];

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

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
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
const TH = "px-3 py-2 text-left text-xs font-bold text-ink/60";
const TD = "px-3 py-2.5 align-top";

function Example({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl bg-white">
      <p className="border-b border-line px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink/50">
        {label}
      </p>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

// Korte, duidelijk afgebakende toelichting hoe een stap in Shiftje werkt.
// De gids blijft zonder tool bruikbaar. Houd dit gelijk aan wat de app echt doet.
function InShiftje({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border-l-4 border-terra bg-sand/40 px-4 py-3 text-sm leading-relaxed text-ink/80">
      <p className="text-xs font-bold uppercase tracking-wide text-terra">Zo doe je dat in Shiftje</p>
      <p className="mt-1">{children}</p>
    </div>
  );
}

export default function RoosterMakenHorecaGids() {
  return (
    <main className="page-sage min-h-screen text-ink">
      {[articleSchema, faqSchema, breadcrumbSchema].map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <SiteHeader />

      <article className="mx-auto max-w-2xl px-6 pb-20 pt-10 md:pt-14">
        <nav aria-label="Kruimelpad" className="text-sm text-ink/55">
          <Link href="/" className="hover:text-ink">
            Shiftje
          </Link>{" "}
          <span aria-hidden="true">›</span> <span>Gids: rooster maken in de horeca</span>
        </nav>

        <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          {TITLE}
        </h1>
        <p className="mt-3 text-sm text-ink/55">
          Door{" "}
          <Link href="/over-ons" className="underline hover:text-ink">
            Thom en Daniel
          </Link>
          , die zelf in de horeca hebben gewerkt. Laatst bijgewerkt:{" "}
          <time dateTime={LAST_UPDATED}>8 oktober 2026</time>.
        </p>

        <p className="mt-6 text-lg leading-relaxed text-ink/85">
          Een goed horecarooster maak je in vier stappen: eerst bepaal je wat je per dienst nodig hebt, dan
          haal je beschikbaarheid op, daarna plan je in en ten slotte deel je het rooster op een vast moment
          en leg je afspraken over ruilen vast. De rest van deze gids werkt die stappen uit met voorbeelden
          en een checklist.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-5">
          <p className="font-display text-lg font-bold">In het kort</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink/80">
            <li>Begin bij wat je nodig hebt per dienst, niet bij wie je hebt.</li>
            <li>Haal beschikbaarheid op vóór je gaat plannen, op één vaste plek.</li>
            <li>Plan eerst de vaste kern, dan de rest, en laat ruimte voor wijzigingen.</li>
            <li>Verdeel zware diensten zichtbaar eerlijk.</li>
            <li>Deel het rooster op een vast moment, op één plek, in één versie.</li>
            <li>Leg vast hoe ruilen werkt.</li>
            <li>Kijk elke week kort terug.</li>
          </ol>
        </div>

        <p className="mt-4 text-sm text-ink/60">
          Deze gids gaat over de praktische kant van roosteren. Over arbeidsrecht en cao-afspraken schrijven
          we hier niet.
        </p>

        <h2 className={H2}>1. Begin bij wat je nodig hebt, niet bij wie je hebt</h2>
        <p className={P}>
          Het meest gemaakte rooster-foutje is beginnen met de namen. Je schuift mensen over de week en kijkt
          daarna of het klopt. Beter is het omgekeerd: bepaal eerst per dienst hoeveel plekken je moet
          vullen, en zoek dan mensen bij die plekken.
        </p>
        <p className={P}>
          Denk in posten. In een café zijn dat bijvoorbeeld de bar, de zaal, het terras en, bij een eetcafé,
          de keuken. Per dagdeel schrijf je op hoeveel mensen je op elke post wilt hebben. Wat die aantallen
          zijn hangt af van je zaak, niet van een vaste norm.
        </p>
        <Example label="Voorbeeld, geen norm: bezetting voor een café met terras">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={TH}>Dienst</th>
                <th className={TH}>Bar</th>
                <th className={TH}>Zaal</th>
                <th className={TH}>Terras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              <tr>
                <td className={TD}>Doordeweeks middag</td>
                <td className={TD}>1</td>
                <td className={TD}>1</td>
                <td className={TD}>bij mooi weer +1</td>
              </tr>
              <tr>
                <td className={TD}>Donderdagavond</td>
                <td className={TD}>2</td>
                <td className={TD}>1</td>
                <td className={TD}>bij mooi weer +1</td>
              </tr>
              <tr>
                <td className={TD}>Vrijdag- en zaterdagavond</td>
                <td className={TD}>3</td>
                <td className={TD}>2</td>
                <td className={TD}>bij mooi weer +2</td>
              </tr>
            </tbody>
          </table>
        </Example>
        <p className={P}>Wat je erbij betrekt om de aantallen te bepalen:</p>
        <ul className={LIST}>
          <li>
            <strong className="text-ink">Wat er vorige weken op dezelfde dag gebeurde.</strong> Je eigen
            ervaring is een betere voorspeller dan een algemene richtlijn.
          </li>
          <li>
            <strong className="text-ink">Het weer, als je een terras hebt.</strong> Eén zonnige dag kan een
            rustig rooster ineens te klein maken. Een open dienst die je pas laat vullen, vangt dat op.
          </li>
          <li>
            <strong className="text-ink">Wat er in de buurt gebeurt.</strong> Een sportwedstrijd, een
            evenement of een feestdag verandert je avond.
          </li>
          <li>
            <strong className="text-ink">Reserveringen, als je die hebt.</strong> Ze geven je een ondergrens.
            Alles wat daarbovenop komt blijft een inschatting.
          </li>
        </ul>
        <InShiftje>Naast het rooster zie je de weersverwachting voor jouw plaats, met een korte terrashint per dag. Een steuntje bij het inplannen, geen voorspelling van drukte.</InShiftje>

        <h2 className={H2}>2. Haal beschikbaarheid op voordat je plant</h2>
        <p className={P}>
          Het rooster maken kost tijd, maar het najagen van antwoorden kost meer. Haal daarom de beschikbaarheid
          op vóór je begint en doe dat op een vaste manier.
        </p>
        <ul className={LIST}>
          <li>
            <strong className="text-ink">Eén kanaal.</strong> Niet de groepsapp voor de een, een briefje voor
            de ander en een mondeling antwoord voor de derde. Kies één plek.
          </li>
          <li>
            <strong className="text-ink">Een deadline.</strong> Bijvoorbeeld &ldquo;uiterlijk woensdag&rdquo;
            voor de week erna. Wie niet reageert, is gewoon beschikbaar, of juist niet: spreek één regel af en
            hou je eraan.
          </li>
          <li>
            <strong className="text-ink">Drie antwoorden in plaats van twee.</strong> Kan, kan niet en weet ik
            nog niet. Het derde antwoord voorkomt dat je bij elke onzekerheid moet terugkomen.
          </li>
          <li>
            <strong className="text-ink">Vooruit kijken.</strong> Laat studenten en bijbaners tentamens,
            stages en vakanties vroeg doorgeven. Vaste vrije dagen vraag je één keer.
          </li>
        </ul>
        <InShiftje>Medewerkers geven per dag of per shift aan of ze kunnen (✓), het nog niet weten (?) of niet kunnen (✕). Jij zet weken vooraf open, of laat Shiftje de komende weken automatisch openzetten.</InShiftje>

        <h2 className={H2}>3. Plan eerst de vaste kern, dan de rest</h2>
        <p className={P}>
          Zet de diensten neer die niet kunnen schuiven: vaste diensten, sleutelfuncties en wie een bepaalde
          taak als enige kan doen, zoals sluiten of de kassa afhandelen. Vul daarna de gaten.
        </p>
        <p className={P}>
          Laat bij de drukkere diensten één plek bewust open, ook als je iemand zou kunnen vinden. Je biedt die
          open dienst later aan het team aan, bijvoorbeeld als het weer meewerkt of als een reservering
          binnenkomt. Dat is makkelijker dan iemand afbellen en voorkomt dat je altijd te veel mensen hebt
          staan.
        </p>
        <InShiftje>Je ziet de beschikbaarheid naast het rooster terwijl je plant. Een vaste dienst stel je één keer in als terugkerende dienst, en een dienst die nog niemand heeft blijft zichtbaar als open dienst. Medewerkers kunnen hem zelf pakken, of jij wijst hem toe.</InShiftje>

        <h2 className={H2}>4. Verdeel de zware diensten zichtbaar eerlijk</h2>
        <p className={P}>
          Elke zaak heeft diensten waar niemand om vraagt: de late vrijdag, de zondagmiddag, het sluiten. Als
          die steeds bij dezelfde mensen terechtkomen, hoor je dat vroeg of laat. Een eenvoudige oplossing is
          een telling.
        </p>
        <Example label="Voorbeeld: telling van weekenddiensten over vier weken">
          <table className="w-full text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={TH}>Medewerker</th>
                <th className={TH}>Weekenddiensten</th>
                <th className={TH}>Volgende keer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              <tr>
                <td className={TD}>A</td>
                <td className={TD}>4</td>
                <td className={TD}>liever niet</td>
              </tr>
              <tr>
                <td className={TD}>B</td>
                <td className={TD}>3</td>
                <td className={TD}>neutraal</td>
              </tr>
              <tr>
                <td className={TD}>C</td>
                <td className={TD}>1</td>
                <td className={TD}>aan de beurt</td>
              </tr>
              <tr>
                <td className={TD}>D</td>
                <td className={TD}>1</td>
                <td className={TD}>aan de beurt</td>
              </tr>
            </tbody>
          </table>
        </Example>
        <p className={P}>
          Het gaat niet om perfecte gelijkheid. Mensen verschillen in wat ze willen en wat ze kunnen. Het gaat
          erom dat ze kunnen zien waarom het rooster is zoals het is. Kijk ook naar wie vaak vrij vraagt en wie
          altijd inspringt: dat laatste is een signaal dat iemand het binnenkort niet meer doet.
        </p>

        <h2 className={H2}>5. Deel het rooster op een vast moment, in één versie</h2>
        <p className={P}>
          Een rooster dat in drie versies rondgaat is erger dan geen rooster. Kies een vast moment waarop het
          verschijnt en een vaste plek waar het staat. Wijzigt er iets, pas dan dezelfde versie aan en laat
          mensen weten dát er iets is veranderd, niet alleen wat. De oude versie moet verdwijnen.
        </p>
        <p className={P}>
          Hoe eerder je het deelt, hoe meer rust het geeft, zeker voor bijbaners die er hun studie omheen
          plannen. Een vast publicatiemoment werkt beter dan &ldquo;zodra het af is&rdquo;.
        </p>
        <InShiftje>Het rooster blijft een concept tot je het publiceert: tot dan zien medewerkers het niet. Daarna kun je het mailen naar je team, en medewerkers kunnen hun diensten in hun eigen agenda zien.</InShiftje>

        <h2 className={H2}>6. Leg vast hoe ruilen werkt</h2>
        <p className={P}>
          Ruilen gaat altijd gebeuren. Het verschil zit in wat er daarna met het rooster gebeurt. Spreek een
          paar eenvoudige regels af en zet ze ergens neer waar iedereen ze kan lezen. Bijvoorbeeld:
        </p>
        <div className="mt-4 rounded-2xl bg-white p-5">
          <ol className="list-decimal space-y-1.5 pl-5 text-ink/80">
            <li>Wie een dienst niet kan, biedt hem aan het team aan op de vaste plek.</li>
            <li>Een collega neemt hem over of ruilt.</li>
            <li>De leidinggevende geeft akkoord, en pas dan telt de ruil.</li>
            <li>Het rooster wordt aangepast en de nieuwe versie is de enige die geldt.</li>
          </ol>
        </div>
        <p className={P}>
          Het akkoord van de leidinggevende is geen wantrouwen. Het zorgt ervoor dat je niet ineens twee
          mensen met onvoldoende ervaring op dezelfde dienst hebt staan.
        </p>
        <InShiftje>Een medewerker biedt de dienst aan het team aan, een collega neemt hem over en jij geeft akkoord. Dat akkoord is een instelling: je kunt het ook uitzetten.</InShiftje>

        <h2 className={H2}>7. Kijk elke week kort terug</h2>
        <p className={P}>
          Vijf minuten is genoeg. Stel jezelf drie vragen: waar waren we te dun bezet en waar te ruim? Welke
          diensten werden geruild of zijn laat ingevuld? Wat moet er in het volgende rooster anders? Wat je
          opschrijft, hoef je de week erna niet opnieuw te bedenken.
        </p>
        <InShiftje>Gewerkte uren vullen zich deels vanzelf in op basis van het rooster. Medewerkers bevestigen en jij keurt goed (ook dat kan automatisch). De goedgekeurde uren per periode kun je exporteren.</InShiftje>

        <h2 className={H2}>Veelgemaakte fouten</h2>
        <ul className={LIST}>
          <li>Plannen zonder eerst de bezetting per dienst te bepalen.</li>
          <li>
            Een dienst direct na een late dienst inplannen zonder te kijken of de tijden ertussen redelijk
            zijn.
          </li>
          <li>Beschikbaarheid ophalen via meerdere kanalen en dan niet meer weten wat de laatste stand is.</li>
          <li>Ruilen alleen mondeling afspreken, zodat later niemand zeker weet wat er is afgesproken.</li>
          <li>Een gewijzigd rooster rondsturen zonder te zeggen dat de oude versie niet meer geldt.</li>
          <li>Altijd dezelfde mensen de lastige diensten geven omdat zij het niet erg vinden.</li>
        </ul>

        <h2 className={H2}>Checklist: rooster maken in de horeca</h2>
        <div className="mt-4 rounded-2xl bg-white p-5">
          <ul className="space-y-2 text-ink/80">
            {[
              "Per dienst en post is bepaald hoeveel mensen ik nodig heb",
              "Het weer, evenementen en feestdagen zijn meegenomen",
              "Beschikbaarheid is opgehaald op één plek, vóór een vaste deadline",
              "Studenten en bijbaners hebben tentamens en vakanties doorgegeven",
              "De vaste kern en sleutelfuncties staan als eerste in het rooster",
              "Bij drukke diensten staat bewust een open dienst",
              "Weekend- en avonddiensten zijn zichtbaar eerlijk verdeeld",
              "Het rooster staat op de afgesproken plek, in één versie",
              "De regels voor ruilen zijn afgesproken en bekend",
              "Na de week is kort teruggekeken: wat moet er anders?",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 rounded border-2 border-ink/40" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <h2 className={H2}>Spreadsheet, groepsapp of een tool?</h2>
        <p className={P}>
          Met een team van enkele mensen en een rooster dat weinig verandert, komt een spreadsheet ver. Het
          wordt lastig zodra beschikbaarheid, ruilen en uren door elkaar gaan lopen: dan zoek je dezelfde
          informatie op drie plekken. Dat is het moment waarop een tool iets oplevert, en het is waarom wij
          Shiftje maakten. Het helpt je bij precies de stappen uit deze gids: beschikbaarheid ophalen, een
          rooster maken, diensten ruilen en uren bijhouden, zonder dat het een zwaar systeem wordt.
        </p>
        <p className={P}>
          Meer over hoe dat werkt voor een café, kroeg of bar staat op de pagina{" "}
          <Link href="/rooster-maken-cafe" className="underline hover:text-ink">
            rooster maken voor je café, kroeg of bar
          </Link>
          .
        </p>

        <h2 className={H2}>Veelgestelde vragen</h2>
        <div className="mt-4 flex flex-col gap-2.5">
          {FAQS.map((f) => (
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

        <div className="mt-12 rounded-3xl bg-sand p-6 text-[#4A2A12] md:p-8">
          <p className="font-display text-xl font-bold md:text-2xl">Liever niet meer zoeken in appjes?</p>
          <p className="mt-2">Probeer Shiftje zeven dagen gratis, zonder creditcard.</p>
          <Link
            href="/onboarding"
            data-track="cta-gids"
            className="mt-4 inline-block rounded-full bg-terra px-6 py-3 font-bold text-white transition-colors hover:bg-terra-dark"
          >
            Begin gratis
          </Link>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
