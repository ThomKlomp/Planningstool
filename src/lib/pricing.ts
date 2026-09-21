// Pure prijsgegevens (geen database), zodat zowel de homepage als de
// facturering (lib/billing.ts) dezelfde bron gebruiken. Pas prijzen alleen
// hier aan.

export const BTW_RATE = 0.21;

/** Vanaf meer dan dit aantal medewerkers: maatwerk, neem contact op. */
export const MAX_STANDARD_MEMBERS = 40;

export type PriceTier = {
  id: string;
  label: string;
  minMembers: number; // inclusief
  maxMembers: number | null; // inclusief; null = geen bovengrens
  monthlyExcl: number;
};

// Grenzen sluiten naadloos op elkaar aan: 1–10, 11–20, 21–30, 31–40.
export const PRICE_TIERS: PriceTier[] = [
  { id: "S", label: "1–10 medewerkers", minMembers: 1, maxMembers: 10, monthlyExcl: 8.0 },
  { id: "M", label: "11–20 medewerkers", minMembers: 11, maxMembers: 20, monthlyExcl: 15.0 },
  { id: "L", label: "21–30 medewerkers", minMembers: 21, maxMembers: 30, monthlyExcl: 21.0 },
  { id: "XL", label: "31–40 medewerkers", minMembers: 31, maxMembers: 40, monthlyExcl: 25.0 },
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

/** True als het aantal medewerkers buiten de standaardstaffels valt. */
export function exceedsStandardTiers(count: number) {
  return count > MAX_STANDARD_MEMBERS;
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// Jaarprijs = 10x de maandprijs van de staffel (2 maanden gratis).
export function yearlyExclForTier(tier: PriceTier) {
  return round2(tier.monthlyExcl * 10);
}

export function inclFromExcl(excl: number) {
  return round2(excl * (1 + BTW_RATE));
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}
