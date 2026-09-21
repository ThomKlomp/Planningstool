// Prijzen: staffelprijs per zaak per maand, gebaseerd op het aantal actieve
// medewerkers (memberships) van die zaak. Vervangt de oude vaste prijs.
// BTW-tarief voor SaaS-diensten in Nederland is het standaardtarief (21%).
//
// Kortingscodes lopen via het bestaande DiscountCode/CompanyDiscount-systeem
// (zie prisma/schema.prisma en src/lib/discount.ts) — dit bestand voegt daar
// geen nieuw kortingsmechanisme aan toe, het rekent er alleen mee.
import { prisma } from "@/lib/prisma";
import { applyDiscount } from "@/lib/discount";
import type { CompanyDiscount } from "@prisma/client";
import {
  getTierForMemberCount,
  yearlyExclForTier,
  inclFromExcl,
  MAX_STANDARD_MEMBERS,
} from "@/lib/pricing";

// Prijzen en staffels staan in lib/pricing.ts (zonder database-afhankelijkheid,
// zodat de homepage ze ook kan gebruiken). Hier her-exporteren voor de
// bestaande imports.
export {
  BTW_RATE,
  MAX_STANDARD_MEMBERS,
  PRICE_TIERS,
  getTierForMemberCount,
  getTierById,
  exceedsStandardTiers,
  yearlyExclForTier,
  round2,
  inclFromExcl,
  formatEuro,
} from "@/lib/pricing";
export type { PriceTier } from "@/lib/pricing";

export const TRIAL_DAYS = 7;

/**
 * Telt de medewerkers die meetellen voor de staffel: alle actieve
 * memberships van de zaak (eigenaar, managers én medewerkers). Uitnodigingen
 * die nog niet geaccepteerd zijn tellen bewust niet mee.
 */
export async function countBillableMembers(companyId: string) {
  return prisma.membership.count({ where: { companyId } });
}

/**
 * Bepaalt of een CompanyDiscount op dit moment daadwerkelijk nog toegepast
 * moet worden op de facturering.
 *
 * Drie gevallen:
 *  - duration FOREVER: altijd actief zolang het record bestaat.
 *  - duration LIMITED_MONTHS met monthsRemaining = null: dit was een 100%-
 *    korting die bij het inwisselen al direct verwerkt is als een verlengde
 *    proefperiode (zie /api/billing/redeem-discount) — telt NIET meer mee
 *    voor de lopende facturering, ook al bestaat het record nog.
 *  - duration LIMITED_MONTHS met een getal: nog actief zolang er, gerekend
 *    vanaf redeemedAt, nog complete termijnen over zijn. Zelfde rekenwijze
 *    als de vroegere cron/discount-expiry, nu hier gecentraliseerd.
 */
export function isDiscountCurrentlyActive(
  discount: Pick<CompanyDiscount, "duration" | "monthsRemaining" | "redeemedAt">,
  billingInterval: "MONTHLY" | "YEARLY" | null
): boolean {
  if (discount.duration === "FOREVER") return true;
  if (discount.monthsRemaining === null) return false; // al verbruikt als proefperiode-verlenging

  const monthsSinceRedeemed =
    billingInterval === "YEARLY"
      ? 12 * Math.floor((Date.now() - discount.redeemedAt.getTime()) / (365 * 24 * 60 * 60 * 1000))
      : Math.floor((Date.now() - discount.redeemedAt.getTime()) / (30 * 24 * 60 * 60 * 1000));

  return Math.max(0, discount.monthsRemaining - monthsSinceRedeemed) > 0;
}

/**
 * Bepaalt het bedrag (excl./incl. btw) dat een zaak op dit moment zou moeten
 * betalen: de staffelprijs o.b.v. het huidige aantal medewerkers, met een
 * eventuele actieve kortingscode (uit het bestaande CompanyDiscount-record)
 * verrekend via de bestaande applyDiscount()-functie.
 *
 * Gebruikt op drie plekken:
 *  - het afrekenscherm bij een nieuw abonnement (billing/subscribe)
 *  - de webhook die de eerste betaling omzet in een Mollie-abonnement
 *  - de dagelijkse cron die bestaande abonnementen bijwerkt (cron/billing-resync)
 */
export async function computeSubscriptionAmount(
  companyId: string,
  interval: "MONTHLY" | "YEARLY"
) {
  const [memberCount, company] = await Promise.all([
    countBillableMembers(companyId),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { billingInterval: true, discount: true },
    }),
  ]);

  const tier = getTierForMemberCount(memberCount);
  const baseExcl = interval === "YEARLY" ? yearlyExclForTier(tier) : tier.monthlyExcl;
  const baseIncl = inclFromExcl(baseExcl);

  const discount = company?.discount ?? null;
  const discountActive =
    discount !== null && isDiscountCurrentlyActive(discount, company?.billingInterval ?? interval);

  const incl = discountActive && discount ? applyDiscount(baseIncl, discount, interval) : baseIncl;

  return {
    memberCount,
    tier,
    baseExcl,
    baseIncl,
    incl,
    discountApplied: discountActive,
  };
}

/**
 * Voor UI-waarschuwingen bij het uitnodigen van een medewerker: als er nu
 * nóg iemand bij zou komen, verhuist de zaak dan naar een duurdere staffel?
 * Geeft null terug als dat niet zo is. Puur informatief — de daadwerkelijke
 * afdwinging gebeurt bij de eerstvolgende afrekening (zie cron/billing-resync).
 */
export async function getNextMemberTierWarning(companyId: string) {
  const count = await countBillableMembers(companyId);

  // Boven het maximum van de standaardstaffels: geen automatische staffel
  // meer, maar maatwerk. Aparte waarschuwing, zodat de UI om contact vraagt.
  if (count + 1 > MAX_STANDARD_MEMBERS) {
    return {
      kind: "contact" as const,
      maxMembers: MAX_STANDARD_MEMBERS,
    };
  }

  const currentTier = getTierForMemberCount(count);
  const nextTier = getTierForMemberCount(count + 1);
  if (nextTier.id === currentTier.id) return null;
  return {
    kind: "tier" as const,
    fromLabel: currentTier.label,
    toLabel: nextTier.label,
    newMonthlyExcl: nextTier.monthlyExcl,
  };
}
