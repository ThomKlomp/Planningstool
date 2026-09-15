export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type DiscountDuration = "FOREVER" | "LIMITED_MONTHS";
export type DiscountInterval = "MONTHLY" | "YEARLY" | "BOTH";

/**
 * Past een korting toe op een bedrag (in euro's, zoals PRICE_MONTHLY_INCL).
 * FIXED_AMOUNT.value staat in centen, PERCENTAGE.value is 1-100.
 * Geeft het onaangepaste bedrag terug als de korting niet geldt voor het
 * gekozen abonnementstype (bv. een code die alleen voor jaarlijks geldt,
 * bij iemand die maandelijks kiest).
 * Gaat nooit onder €0,01, zodat er nooit een ongeldig (of gratis) bedrag
 * bij Mollie wordt aangeboden, een 100%-korting wordt elders afgehandeld
 * als verlengde proefperiode, niet via deze functie.
 */
export function applyDiscount(
  baseAmount: number,
  discount:
    | { type: DiscountType; value: number; applicableInterval?: DiscountInterval }
    | null
    | undefined,
  interval?: "MONTHLY" | "YEARLY"
): number {
  if (!discount) return baseAmount;

  if (
    interval &&
    discount.applicableInterval &&
    discount.applicableInterval !== "BOTH" &&
    discount.applicableInterval !== interval
  ) {
    return baseAmount; // deze code geldt niet voor dit type abonnement
  }

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
  applicableInterval?: DiscountInterval;
}): string {
  const amount =
    discount.type === "PERCENTAGE" ? `${discount.value}%` : `€${(discount.value / 100).toFixed(2)}`;

  const intervalSuffix =
    discount.applicableInterval === "MONTHLY"
      ? " (alleen maandelijks)"
      : discount.applicableInterval === "YEARLY"
      ? " (alleen jaarlijks)"
      : "";

  if (discount.type === "PERCENTAGE" && discount.value === 100 && discount.duration === "LIMITED_MONTHS") {
    return `Eerste ${discount.durationMonths} ${discount.durationMonths === 1 ? "maand" : "maanden"} gratis`;
  }
  if (discount.duration === "FOREVER") {
    return `${amount} korting, altijd${intervalSuffix}`;
  }
  return `${amount} korting, eerste ${discount.durationMonths} ${
    discount.durationMonths === 1 ? "maand" : "maanden"
  }${intervalSuffix}`;
}
