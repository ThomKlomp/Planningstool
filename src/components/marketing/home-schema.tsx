import { PRICE_TIERS } from "@/lib/pricing";
import { FAQ } from "@/lib/home-content";

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shiftje",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Personeelsplanning / roostersoftware",
  operatingSystem: "Web, iOS, Android",
  description:
    "Rooster software voor kleine horeca: beschikbaarheid, personeelsplanning, dienstruil en urenregistratie op één plek.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: PRICE_TIERS[0].monthlyExcl.toFixed(2),
    highPrice: PRICE_TIERS[PRICE_TIERS.length - 1].monthlyExcl.toFixed(2),
    offerCount: PRICE_TIERS.length,
  },
  // Geen aggregateRating: we voegen die pas toe zodra er échte, verifieerbare
  // reviews zijn. Verzonnen sterren in structured data schendt Google's
  // richtlijnen en kan tot een handmatige actie leiden.
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/** Gestructureerde gegevens (JSON-LD) voor zoekmachines, gedeeld door alle homepage-ontwerpen. */
export default function HomeSchema() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
