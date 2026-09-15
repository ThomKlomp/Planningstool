export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type DiscountDuration = "FOREVER" | "LIMITED_MONTHS";

/**
 * Past een korting toe op een bedrag (in euro's, zoals PRICE_MONTHLY_INCL).
 * FIXED_AMOUNT.value staat in centen, PERCENTAGE.value is 1-100.
 * Gaat nooit onder €0,01, zodat er nooit een ongeldig (of gratis) bedrag
 * bij Mollie wordt aangeboden, een 100%-korting wordt elders afgehandeld
 * als verlengde proefperiode, niet via deze functie.
 */
export function applyDiscount(
  baseAmount: number,
  discount: { type: DiscountType; value: number } | null | undefined
): number {
  if (!discount) return baseAmount;

  const discounted =
    discount.type === "PERCENTAGE"
      ? baseAmount * (1 - discount.value / 100)
      : baseAmount - discount.value / 100;

  return Math.max(0.01, Math.round(discounted * 100) / 100);
}

/** Leesbare beschrijving van een kortingscode, voor in de UI. */
export function describeDiscount(discount: {
  type: DiscountType;
  value: number;
  duration: DiscountDuration;
  durationMonths?: number | null;
}): string {
  const amount =
    discount.type === "PERCENTAGE" ? `${discount.value}%` : `€${(discount.value / 100).toFixed(2)}`;

  if (discount.type === "PERCENTAGE" && discount.value === 100 && discount.duration === "LIMITED_MONTHS") {
    return `Eerste ${discount.durationMonths} ${discount.durationMonths === 1 ? "maand" : "maanden"} gratis`;
  }
  if (discount.duration === "FOREVER") {
    return `${amount} korting, altijd`;
  }
  return `${amount} korting, eerste ${discount.durationMonths} ${
    discount.durationMonths === 1 ? "maand" : "maanden"
  }`;
}
