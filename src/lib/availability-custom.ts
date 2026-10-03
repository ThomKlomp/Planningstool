// Losse beschikbaarheid: naast de vaste shift-tijden (sjablonen) kan een medewerker
// een eigen tijdvak doorgeven, bv. "vrijdag 17:00–21:00". Dit wordt opgeslagen als
// gewone Availability-regel; het tijdvak zit in het daypart-veld als
// "custom:17:00-21:00". Zo is er geen aparte tabel nodig en blijft de unieke
// sleutel (medewerker, datum, daypart) gewoon werken.

const PREFIX = "custom:";
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function customDaypart(startTime: string, endTime: string): string {
  return `${PREFIX}${startTime}-${endTime}`;
}

export function isCustomDaypart(daypart: string): boolean {
  return parseCustomDaypart(daypart) !== null;
}

export function parseCustomDaypart(
  daypart: string
): { startTime: string; endTime: string } | null {
  if (!daypart.startsWith(PREFIX)) return null;
  const [startTime, endTime] = daypart.slice(PREFIX.length).split("-");
  if (!startTime || !endTime || !TIME.test(startTime) || !TIME.test(endTime)) return null;
  return { startTime, endTime };
}

/** "17:00–21:00" voor een losse tijd, anders null. */
export function customDaypartLabel(daypart: string): string | null {
  const parsed = parseCustomDaypart(daypart);
  return parsed ? `${parsed.startTime}–${parsed.endTime}` : null;
}

export function isValidTimeRange(startTime: unknown, endTime: unknown): boolean {
  return (
    typeof startTime === "string" &&
    typeof endTime === "string" &&
    TIME.test(startTime) &&
    TIME.test(endTime) &&
    startTime !== endTime
  );
}
