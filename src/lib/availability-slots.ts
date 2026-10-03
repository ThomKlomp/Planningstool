// Beschikbaarheid op een extra tijdvak van de manager (AvailabilitySlot) wordt
// opgeslagen als gewone Availability-regel met daypart "slot:<id>". Zo werkt
// de unieke sleutel (medewerker, datum, daypart) gewoon door.

const PREFIX = "slot:";

export function slotDaypart(slotId: string): string {
  return `${PREFIX}${slotId}`;
}

/** Het slot-id uit een daypart, of null als het geen extra tijdvak is. */
export function slotIdOf(daypart: string): string | null {
  return daypart.startsWith(PREFIX) && daypart.length > PREFIX.length
    ? daypart.slice(PREFIX.length)
    : null;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeRange(startTime: unknown, endTime: unknown): boolean {
  return (
    typeof startTime === "string" &&
    typeof endTime === "string" &&
    TIME.test(startTime) &&
    TIME.test(endTime) &&
    startTime !== endTime
  );
}

export type SlotLabelInfo = { id: string; title: string | null; startTime: string; endTime: string };

/** "Feestje van Bas (20:00–02:00)" voor een daypart van een extra tijdvak, anders null. */
export function slotLabel(daypart: string, slots: SlotLabelInfo[]): string | null {
  const id = slotIdOf(daypart);
  if (!id) return null;
  const slot = slots.find((s) => s.id === id);
  if (!slot) return "extra tijdvak";
  return `${slot.title ? `${slot.title} ` : ""}(${slot.startTime}–${slot.endTime})`;
}
