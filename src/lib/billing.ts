// Prijzen: vast bedrag per zaak per maand, geen prijs per medewerker.
// BTW-tarief voor SaaS-diensten in Nederland is het standaardtarief (21%).
export const BTW_RATE = 0.21;

export const PRICE_MONTHLY_EXCL = 10.0;
export const PRICE_YEARLY_EXCL = 100.0; // 10x maandprijs = 2 maanden gratis

export const PRICE_MONTHLY_INCL = round2(PRICE_MONTHLY_EXCL * (1 + BTW_RATE));
export const PRICE_YEARLY_INCL = round2(PRICE_YEARLY_EXCL * (1 + BTW_RATE));

export const TRIAL_DAYS = 7;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
