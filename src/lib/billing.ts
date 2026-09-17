// Prijzen: staffelprijs per zaak per maand, gebaseerd op het aantal actieve
// medewerkers (memberships) van die zaak. Vervangt de oude vaste prijs.
// BTW-tarief voor SaaS-diensten in Nederland is het standaardtarief (21%).
import { prisma } from "@/lib/prisma";

export const BTW_RATE = 0.21;
export const TRIAL_DAYS = 7;

export type PriceTier = {
  id: string;
  label: string;
  minMembers: number; // inclusief
  maxMembers: number | null; // inclusief; null = geen bovengrens
  monthlyExcl: number;
};

// Grenzen sluiten naadloos op elkaar aan: 1–10, 11–20, 21–30, 31+.
export const PRICE_TIERS: PriceTier[] = [
  { id: "S", label: "1–10 medewerkers", minMembers: 1, maxMembers: 10, monthlyExcl: 8.0 },
  { id: "M", label: "11–20 medewerkers", minMembers: 11, maxMembers: 20, monthlyExcl: 15.0 },
  { id: "L", label: "21–30 medewerkers", minMembers: 21, maxMembers: 30, monthlyExcl: 21.0 },
  { id: "XL", label: "30+ medewerkers", minMembers: 31, maxMembers: null, monthlyExcl: 25.0 },
];

export function getTierForMemberCount(count: number): PriceTier {
  const n = Math.max(1, count);
  return (
    PRICE_TIERS.find((t) => n >= t.minMembers && (t.maxMembers === null || n <= t.maxMembers)) ??
    PRICE_TIERS[PRICE_TIERS.length - 1]
  );
}

export function getTierById(id: string): PriceTier | undefined {
  return PRICE_TIERS.find((t) => t.id === id);
}

// Jaarprijs = 10x de maandprijs van de staffel (2 maanden gratis), zelfde
// verhouding als voorheen.
export function yearlyExclForTier(tier: PriceTier) {
  return round2(tier.monthlyExcl * 10);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function inclFromExcl(excl: number) {
  return round2(excl * (1 + BTW_RATE));
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}

/**
 * Telt de medewerkers die meetellen voor de staffel: alle actieve
 * memberships van de zaak (eigenaar, managers én medewerkers). Uitnodigingen
 * die nog niet geaccepteerd zijn tellen bewust niet mee.
 */
export async function countBillableMembers(companyId: string) {
  return prisma.membership.count({ where: { companyId } });
}

/**
 * Bepaalt het bedrag (excl./incl. btw) dat een zaak op dit moment zou moeten
 * betalen: de staffelprijs o.b.v. het huidige aantal medewerkers, met een
 * eventuele actieve kortingscode verrekend.
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
      select: {
        appliedCouponId: true,
        couponMonthsRemaining: true,
        coupon: { select: { type: true, value: true } },
      },
    }),
  ]);

  const tier = getTierForMemberCount(memberCount);
  const baseExcl = interval === "YEARLY" ? yearlyExclForTier(tier) : tier.monthlyExcl;

  let discountedExcl = baseExcl;
  const couponActive =
    company?.appliedCouponId &&
    company.coupon &&
    (company.couponMonthsRemaining === null || (company.couponMonthsRemaining ?? 0) > 0);

  if (couponActive && company?.coupon) {
    discountedExcl =
      company.coupon.type === "PERCENTAGE"
        ? round2(baseExcl * (1 - company.coupon.value / 100))
        : Math.max(0, round2(baseExcl - company.coupon.value));
  }

  return {
    memberCount,
    tier,
    baseExcl,
    excl: discountedExcl,
    incl: inclFromExcl(discountedExcl),
    couponApplied: Boolean(couponActive),
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
  const currentTier = getTierForMemberCount(count);
  const nextTier = getTierForMemberCount(count + 1);
  if (nextTier.id === currentTier.id) return null;
  return {
    fromLabel: currentTier.label,
    toLabel: nextTier.label,
    newMonthlyExcl: nextTier.monthlyExcl,
  };
}
